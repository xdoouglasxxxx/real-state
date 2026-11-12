"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./PropertyMap.module.css";
import { brlCompact } from "@/lib/format";
import {
  MAX_ZOOM, MIN_ZOOM, clusterPoints, fitView, tileUrl, visibleTiles, type Cluster, type View,
} from "@/lib/geo";

/** Mapa dos imóveis sem biblioteca: tiles + pins por projeção Web Mercator (src/lib/geo.ts). */
export type MapGroup = "disp" | "res" | "vend";
export type MapItem = {
  id: string;
  title: string;
  hood: string;
  price: number;
  group: MapGroup;
  statusLabel: string;
  beds: number | null;
  area: number | null;
  lat: number | null;
  lng: number | null;
  /** dias desde a última visita (ou desde o cadastro, se nunca teve) */
  noVisitDays: number | null;
  /** disponível, cadastrado há 90+ dias e sem visita nos últimos 90 (mesma regra do dashboard) */
  stale: boolean;
};
type Placed = MapItem & { lat: number; lng: number };
export type MapFilter = "todos" | MapGroup | "parado";
type Filter = MapFilter;

const CHIPS: { id: Filter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "disp", label: "Disponíveis" },
  { id: "res", label: "Reservados" },
  { id: "vend", label: "Vendidos/alugados" },
  { id: "parado", label: "Sem visita 90+ dias" },
];

export default function PropertyMap({
  items, tileTemplate, attribution, initialFilter = "todos",
}: { items: MapItem[]; tileTemplate: string; attribution: string; initialFilter?: MapFilter }) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [override, setOverride] = useState<View | null>(null);
  const [dark, setDark] = useState(true);
  const [size, setSize] = useState({ w: 800, h: 440 });
  const stageRef = useRef<HTMLDivElement>(null);

  // Mede a área do mapa (e acompanha redimensionamento).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 440;
      setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placed = useMemo(() => items.filter((i): i is Placed => i.lat != null && i.lng != null), [items]);
  const missing = items.length - placed.length;
  const counts = useMemo<Record<Filter, number>>(() => ({
    todos: placed.length,
    disp: placed.filter((p) => p.group === "disp").length,
    res: placed.filter((p) => p.group === "res").length,
    vend: placed.filter((p) => p.group === "vend").length,
    parado: placed.filter((p) => p.stale).length,
  }), [placed]);
  const filtered = useMemo(
    () => placed.filter((p) => (filter === "todos" ? true : filter === "parado" ? p.stale : p.group === filter)),
    [placed, filter],
  );

  const auto = useMemo(() => fitView(filtered, size.w, size.h), [filtered, size.w, size.h]);
  const view = override ?? auto;
  const z = Math.round(view.zoom);
  const tiles = useMemo(() => visibleTiles(view, size.w, size.h), [view, size.w, size.h]);
  const clusters = useMemo(() => clusterPoints(filtered, view, size.w, size.h), [filtered, view, size.w, size.h]);
  const selected = placed.find((p) => p.id === selectedId) ?? null;

  const changeFilter = (f: Filter) => { setFilter(f); setOverride(null); setSelectedId(null); };
  const zoomBy = (d: number) => setOverride({ lat: view.lat, lng: view.lng, zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + d)) });
  const pickFromList = (p: Placed) => { setSelectedId(p.id); setOverride({ lat: p.lat, lng: p.lng, zoom: Math.max(z, 13) }); };
  const openCluster = (c: Cluster<Placed>) => {
    const next = fitView(c.items, size.w, size.h, 80);
    if (next.zoom > z) setOverride(next); // aproxima
    else setSelectedId(c.items[0].id); // mesma coordenada (ex.: prédio): seleciona o primeiro
  };

  if (items.length === 0) {
    return <p className={styles.empty}>Nenhum imóvel cadastrado ainda. Cadastre em Imóveis → Novo imóvel e preencha a localização para ele aparecer aqui.</p>;
  }
  if (placed.length === 0) {
    return <p className={styles.empty}>Nenhum imóvel tem latitude e longitude. Preencha na seção “Localização” do cadastro de cada imóvel para ele aparecer no mapa.</p>;
  }

  return (
    <section className={styles.wrap} aria-label="Mapa dos imóveis">
      <div className={styles.toolbar}>
        <div className={styles.chips} role="group" aria-label="Filtro de imóveis">
          {CHIPS.map((c) => (
            <button key={c.id} type="button" aria-pressed={filter === c.id}
              className={filter === c.id ? styles.chipOn : styles.chip} onClick={() => changeFilter(c.id)}>
              {c.label} ({counts[c.id]})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.mapCol}>
          <div ref={stageRef} className={styles.stage}>
            <div className={dark ? styles.tilesDark : styles.tiles} aria-hidden="true">
              {tiles.map((t) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={t.key} className={styles.tile} src={tileUrl(tileTemplate, t)} alt="" width={256} height={256}
                  draggable={false} style={{ left: t.left, top: t.top }} />
              ))}
            </div>

            {clusters.map((c) => {
              if (c.x < -40 || c.x > size.w + 40 || c.y < -40 || c.y > size.h + 40) return null;
              const multi = c.items.length > 1;
              const p0 = c.items[0];
              const key = c.items.map((i) => i.id).join("|");
              const isSel = !multi && selectedId === p0.id;
              const showLabel = hoverKey === key || isSel;
              const cls = multi
                ? styles.cluster
                : [styles.pin, styles[`pin_${p0.group}`], isSel ? styles.pinSel : "", filter === "parado" ? styles.ring : ""].join(" ");
              return (
                <button key={key} type="button" className={cls} style={{ left: c.x, top: c.y }}
                  aria-label={multi ? `${c.items.length} imóveis nesta região. Clique para aproximar.` : `${p0.title}, ${brlCompact(p0.price)}, ${p0.statusLabel}`}
                  onClick={() => (multi ? openCluster(c) : setSelectedId(p0.id))}
                  onMouseEnter={() => setHoverKey(key)} onMouseLeave={() => setHoverKey(null)}
                  onFocus={() => setHoverKey(key)} onBlur={() => setHoverKey(null)}>
                  {multi ? c.items.length : null}
                  {showLabel && (
                    <span className={[styles.label, c.x < 140 ? styles.labelL : c.x > size.w - 140 ? styles.labelR : "", c.y < 48 ? styles.labelB : ""].join(" ")}>
                      {multi ? `${c.items.length} imóveis · clique para aproximar` : `${p0.title} · ${brlCompact(p0.price)}`}
                    </span>
                  )}
                </button>
              );
            })}

            <div className={styles.controls}>
              <button type="button" className={styles.ctl} aria-label="Aproximar" disabled={z >= MAX_ZOOM} onClick={() => zoomBy(1)}>+</button>
              <button type="button" className={styles.ctl} aria-label="Afastar" disabled={z <= MIN_ZOOM} onClick={() => zoomBy(-1)}>−</button>
              <button type="button" className={styles.ctl} aria-label="Ajustar o mapa aos imóveis" onClick={() => setOverride(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
              </button>
              <button type="button" className={styles.ctl} aria-label="Alternar mapa claro ou escuro" aria-pressed={dark} onClick={() => setDark((d) => !d)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></svg>
              </button>
            </div>
            <span className={styles.attrib}>{attribution}</span>
          </div>

          <div className={styles.legend}>
            <span><i className={styles.dot} style={{ background: "var(--brass)" }} />Disponível</span>
            <span><i className={styles.dot} style={{ background: "#6fb1a5" }} />Reservado</span>
            <span><i className={styles.dot} style={{ background: "#8a93a6" }} />Vendido/alugado</span>
            <span>{filtered.length} de {placed.length} imóveis no mapa</span>
          </div>
          {missing > 0 && (
            <p className={styles.muted}>
              {missing} {missing === 1 ? "imóvel não tem" : "imóveis não têm"} latitude/longitude e {missing === 1 ? "não aparece" : "não aparecem"} no mapa.
              Preencha em Imóveis → Editar → Localização.
            </p>
          )}
        </div>

        <aside className={styles.side}>
          {selected ? (
            <div className={styles.detail} aria-live="polite">
              <div className={styles.detailTop}>
                <strong>{selected.title}</strong>
                <span className={`${styles.st} ${styles[`st_${selected.group}`]}`}>{selected.statusLabel}</span>
              </div>
              <span className={styles.muted}>{selected.hood}</span>
              <span className={styles.price}>{brlCompact(selected.price)}</span>
              <span className={styles.muted}>
                {[selected.beds != null ? `${selected.beds} quartos` : null, selected.area != null ? `${selected.area} m²` : null].filter(Boolean).join(" · ") || "—"}
              </span>
              {selected.stale && (
                <div className={styles.warn}>Sem visita há {selected.noVisitDays} dias — revise preço, fotos e destaque.</div>
              )}
              <Link className={styles.open} href={`/painel/imoveis/${selected.id}`}>Abrir imóvel</Link>
            </div>
          ) : (
            <p className={styles.hint}>Clique num imóvel no mapa ou na lista para ver os detalhes.</p>
          )}

          <div className={styles.list}>
            {filtered.map((p) => (
              <button key={p.id} type="button" className={selectedId === p.id ? styles.rowOn : styles.row} onClick={() => pickFromList(p)}>
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>{p.title}</span>
                  <span className={styles.muted}>{brlCompact(p.price)}</span>
                </span>
                <span className={`${styles.st} ${styles[`st_${p.group}`]}`}>{p.statusLabel}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
