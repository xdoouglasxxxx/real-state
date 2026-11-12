"use client";

import { useState } from "react";
import styles from "./DashParts.module.css";

export type FunnelRow = { label: string; count: number; pctOfPrev: number | null; pctOfTotal: number };

/** Funil de conversão do período: passar o mouse (ou Tab) numa etapa mostra a conversão dela. */
export default function FunnelCard({
  steps, worstIndex, worstText,
}: { steps: FunnelRow[]; worstIndex: number | null; worstText: string | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = steps[0]?.count ?? 0;

  const hint = (() => {
    if (hover === null) return "Passe o mouse (ou use Tab) sobre uma etapa para ver a conversão.";
    const s = steps[hover];
    const parts = [`${s.label}: ${s.count}`];
    if (hover > 0 && s.pctOfPrev !== null) parts.push(`${s.pctOfPrev}% de quem chegou em ${steps[hover - 1].label.toLowerCase()}`);
    parts.push(`${s.pctOfTotal}% do total de leads`);
    if (worstIndex !== null && hover === worstIndex) parts.push("maior perda do funil");
    return parts.join(" · ");
  })();

  return (
    <section className="ficha-box">
      <div className={styles.cardHead}>
        <h2>Funil do período</h2>
        {worstText && <span className={styles.worst}>{worstText}</span>}
      </div>
      {total === 0 ? (
        <p style={{ color: "var(--stone)" }}>Sem leads criados neste período.</p>
      ) : (
        steps.map((s, i) => (
          <div key={s.label} tabIndex={0} className={hover === i ? styles.frowOn : styles.frow}
            aria-label={`${s.label}: ${s.count}${s.pctOfPrev !== null ? `, ${s.pctOfPrev}% da etapa anterior` : ""}`}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
            <div className={styles.frowTop}>
              <span>{s.label}</span>
              <span><strong>{s.count}</strong> <span style={{ color: "var(--stone)" }}>{s.pctOfPrev === null ? "100%" : `${s.pctOfPrev}%`}</span></span>
            </div>
            <div className={styles.track}>
              <i className={hover === i ? styles.barOn : styles.bar} style={{ width: `${s.count > 0 ? Math.max(2, s.pctOfTotal) : 0}%` }} />
            </div>
          </div>
        ))
      )}
      <p className={styles.hint} aria-live="polite">{hint}</p>
    </section>
  );
}
