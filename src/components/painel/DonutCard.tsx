"use client";

import { useState } from "react";
import styles from "./DashParts.module.css";

export type DonutItem = {
  label: string;
  value: number;      // base do tamanho da fatia
  display: string;    // como o valor aparece na legenda e no centro ao destacar (ex.: "14" ou "R$ 4,2 mil")
  note?: string;      // complemento na legenda (ex.: " · 2 vendas")
  aria: string;       // leitura completa para leitor de tela
};

// 1ª cor = cor da marca (já legível no grafite); as demais são fixas e distinguíveis entre si.
const COLORS = ["var(--brass)", "#6fb1a5", "#8fa3d9", "#d9826b", "#9ba4b2", "#c9a0dc", "#b8c27a"];
const R = 48;
const C = 2 * Math.PI * R;

/** Rosca com legenda: passar o mouse (ou Tab) numa linha destaca a fatia e mostra o valor dela no centro. */
export default function DonutCard({
  title, items, totalDisplay, caption, emptyText, hint,
}: { title: string; items: DonutItem[]; totalDisplay: string; caption: string; emptyText: string; hint: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = items.reduce((s, it) => s + it.value, 0);
  const share = (v: number) => (total > 0 ? Math.round((100 * v) / total) : 0);

  let acc = 0;
  const arcs = items.map((it, i) => {
    const len = total > 0 ? (C * it.value) / total : 0;
    const arc = { len, offset: acc, color: COLORS[i % COLORS.length] };
    acc += len;
    return arc;
  });
  const h = hover !== null ? items[hover] : null;
  // o centro da rosca é pequeno: o tamanho da fonte acompanha o tamanho do texto ("27" grande, "R$ 450.000" menor)
  const centerText = h ? h.display : totalDisplay;
  const centerSize = centerText.length <= 4 ? "1.6rem" : centerText.length <= 7 ? "1.3rem" : centerText.length <= 10 ? "1.05rem" : ".9rem";

  return (
    <section className="ficha-box">
      <h2>{title}</h2>
      {total <= 0 ? (
        <p style={{ color: "var(--stone)" }}>{emptyText}</p>
      ) : (
        <div className={styles.donutWrap}>
          <div className={styles.donutBox}>
            <svg viewBox="0 0 120 120" className={styles.donutSvg} role="img" aria-label={`${title}: ${totalDisplay} ${caption}`}>
              <g transform="rotate(-90 60 60)">
                {arcs.map((a, i) => (
                  <circle key={items[i].label} cx="60" cy="60" r={R} fill="none" strokeWidth="18"
                    strokeDasharray={`${a.len} ${C - a.len}`} strokeDashoffset={-a.offset}
                    style={{ stroke: a.color, opacity: hover === null || hover === i ? 1 : 0.3, transition: "opacity .15s" }} />
                ))}
              </g>
            </svg>
            <div className={styles.donutCenter}>
              <strong style={{ fontSize: centerSize, whiteSpace: "nowrap" }}>{centerText}</strong>
              <span>{h ? `${h.label} · ${share(h.value)}%` : caption}</span>
            </div>
          </div>
          <div className={styles.legend}>
            {items.map((it, i) => (
              <div key={it.label} tabIndex={0} className={hover === i ? styles.legRowOn : styles.legRow} aria-label={it.aria}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <i className={styles.dot} style={{ background: COLORS[i % COLORS.length] }} />
                <span className={styles.legName}>{it.label}</span>
                <span><strong>{it.display}</strong>{it.note ? <span style={{ color: "var(--stone)" }}>{it.note}</span> : null}</span>
                <span className={styles.legPct}>{share(it.value)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className={styles.hint}>{hint}</p>
    </section>
  );
}
