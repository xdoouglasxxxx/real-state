"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PublicMap.module.css";
import { brlCompact } from "@/lib/format";
import { MIN_ZOOM, clusterPoints, fitView, tileUrl, toScreen, visibleTiles, type Cluster, type View } from "@/lib/geo";
import type { PublicPin } from "@/lib/site";

const MAX = 16; // coordenada pública é aproximada (~110 m): aproximar além disso não revela nada a mais

/**
 * Mapa dos imóveis do site público. Recebe SÓ pins já saneados (coordenada arredondada, 6 campos).
 * Os tiles só carregam quando o mapa chega perto da tela (quem nunca rola até ele não gera requisição).
 */
export default function PublicMap({
  pins, tileTemplate, attribution, height = 420, label = "Mapa dos imóveis",
  area = false,
}: { pins: PublicPin[]; tileTemplate: string; attribution: string; height?: number; label?: string; area?: boolean }) {
  const [override, setOverride] = useState<View | null>(null);
  const [size, setSize] = useState({ w: 800, h: height });
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || 800, h = el.clientHeight || height;
      setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") setShown(true);
    else {
      io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShown(true); io?.disconnect(); } }, { rootMargin: "300px" });
      io.observe(el);
    }
    return () => { ro?.disconnect(); io?.disconnect(); };
  }, [height]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const auto = useMemo(() => fitView(pins, size.w, size.h, 64, 15), [pins, size.w, size.h]);
  const view = override ?? auto;
  const z = Math.round(view.zoom);
  const tiles = useMemo(() => (shown ? visibleTiles(view, size.w, size.h) : []), [shown, view, size.w, size.h]);
  const clusters = useMemo(() => clusterPoints(pins, view, size.w, size.h, 56), [pins, view, size.w, size.h]);

  const zoomBy = (d: number) => { setOpen(null); setOverride({ lat: view.lat, lng: view.lng, zoom: Math.max(MIN_ZOOM, Math.min(MAX, z + d)) }); };
  const clickCluster = (c: Cluster<PublicPin>, key: string) => {
    const next = fitView(c.items, size.w, size.h, 90, MAX);
    if (next.zoom > z && z < MAX) { setOpen(null); setOverride(next); } else setOpen(open === key ? null : key); // mesma célula: abre a lista
  };

  return (
    <div ref={ref} className={styles.wrap} style={{ height }} role="region" aria-label={label}>
      <div className={styles.tiles} aria-hidden="true">
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t.key} className={styles.tile} src={tileUrl(tileTemplate, t)} alt="" width={256} height={256} draggable={false} style={{ left: t.left, top: t.top }} />
        ))}
      </div>

      {area && pins[0] && (() => {
        // modo "região aproximada" (página do imóvel): um círculo de ~450 m, sem ponto exato, sem link
        const pt = toScreen(pins[0].lat, pins[0].lng, view, size.w, size.h);
        const mpp = (156543.03392 * Math.cos((pins[0].lat * Math.PI) / 180)) / Math.pow(2, view.zoom);
        const d = Math.max(36, 450 / mpp);
        return <div className={styles.area} aria-hidden="true" style={{ left: pt.x, top: pt.y, width: d, height: d }} />;
      })()}

      {!area && clusters.map((c) => {
        if (c.x < -60 || c.x > size.w + 60 || c.y < -60 || c.y > size.h + 60) return null;
        const key = c.items.map((i) => i.slug).join("|");
        if (c.items.length === 1) {
          const p = c.items[0];
          return (
            <Link key={key} href={`/imovel/${p.slug}`} className={styles.pin} style={{ left: c.x, top: c.y }} aria-label={`${p.title}, ${brlCompact(p.price)}${p.exclusive ? ", exclusivo" : ""}`}>
              <span className={styles.tag}>{brlCompact(p.price)}</span>
              <i className={p.exclusive ? styles.dotX : styles.dot} />
            </Link>
          );
        }
        return (
          <div key={key}>
            <button type="button" className={styles.cluster} style={{ left: c.x, top: c.y }} aria-expanded={open === key}
              aria-label={`${c.items.length} imóveis nesta região. Clique para ver.`} onClick={() => clickCluster(c, key)}>
              {c.items.length}
            </button>
            {open === key && (
              <div className={styles.pop} style={{ left: Math.min(Math.max(c.x, 130), size.w - 130), top: c.y }} role="dialog" aria-label={`${c.items.length} imóveis`}>
                <div className={styles.popHead}><span>{c.items.length} imóveis aqui</span><button type="button" className={styles.popClose} aria-label="Fechar" onClick={() => setOpen(null)}>×</button></div>
                {c.items.map((p) => (
                  <Link key={p.slug} href={`/imovel/${p.slug}`} className={styles.popRow}><span>{p.title}</span><b>{brlCompact(p.price)}</b></Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.controls}>
        <button type="button" className={styles.ctl} aria-label="Aproximar" disabled={z >= MAX} onClick={() => zoomBy(1)}>+</button>
        <button type="button" className={styles.ctl} aria-label="Afastar" disabled={z <= MIN_ZOOM} onClick={() => zoomBy(-1)}>−</button>
        <button type="button" className={styles.ctl} aria-label="Ajustar o mapa aos imóveis" onClick={() => { setOpen(null); setOverride(null); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
      </div>
      <span className={styles.attrib}>{attribution}</span>
    </div>
  );
}
