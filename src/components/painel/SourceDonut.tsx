"use client";

import { useState } from "react";
import styles from "./DashParts.module.css";

export type SourceItem = { label: string; count: number; won: number; share: number };

// 1ª cor = cor da marca (já legível no grafite); as demais são fixas e distinguíveis entre si.
const COLORS = ["var(--brass)", "#6fb1a5", "#8fa3d9", "#d9826b", "#9ba4b2", "#c9a0dc", "#b8c27a"];
const R = 48;
const C = 2 * Math.PI * R;

/** Rosca "De onde vêm": passar o mouse (ou Tab) num canal o destaca e mostra o número dele no centro. */
export default function SourceDonut({ items, total }: { items: SourceItem[]; total: number }) {
  const [hover, setHover] = useState<number | null>(null);
  let acc = 0;
  const arcs = items.map((it, i) => {
    const len = total > 0 ? (C * it.count) / total : 0;
    const arc = { len, offset: acc, color: COLORS[i % COLORS.length] };
    acc += len;
    return arc;
  });
  const h = hover !== null ? items[hover] : null;

  return (
    <section className="ficha-box">
      <h2>De onde vêm</h2>
      {total === 0 ? (
        <p style={{ color: "var(--stone)" }}>Sem leads criados neste período.</p>
      ) : (
        <div className={styles.donutWrap}>
          <div className={styles.donutBox}>
            <svg viewBox="0 0 120 120" className={styles.donutSvg} role="img" aria-label={`${total} leads por origem`}>
              <g transform="rotate(-90 60 60)">
                {arcs.map((a, i) => (
                  <circle key={items[i].label} cx="60" cy="60" r={R} fill="none" strokeWidth="18"
                    strokeDasharray={`${a.len} ${C - a.len}`} strokeDashoffset={-a.offset}
                    style={{ stroke: a.color, opacity: hover === null || hover === i ? 1 : 0.3, transition: "opacity .15s" }} />
                ))}
              </g>
            </svg>
            <div className={styles.donutCenter}>
              <strong>{h ? h.count : total}</strong>
              <span>{h ? `${h.label} · ${h.share}%` : "leads"}</span>
            </div>
          </div>
          <div className={styles.legend}>
            {items.map((it, i) => (
              <div key={it.label} tabIndex={0} className={hover === i ? styles.legRowOn : styles.legRow}
                aria-label={`${it.label}: ${it.count} leads, ${it.share}%${it.won > 0 ? `, ${it.won} vendas` : ""}`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <i className={styles.dot} style={{ background: COLORS[i % COLORS.length] }} />
                <span className={styles.legName}>{it.label}</span>
                <span><strong>{it.count}</strong>{it.won > 0 ? <span style={{ color: "var(--stone)" }}> · {it.won} venda{it.won > 1 ? "s" : ""}</span> : null}</span>
                <span className={styles.legPct}>{it.share}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className={styles.hint}>Leads criados no período, por canal. Onde investir: volume + vendas.</p>
    </section>
  );
}
