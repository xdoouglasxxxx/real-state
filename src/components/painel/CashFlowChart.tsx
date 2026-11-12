"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./FinanceChart.module.css";

export type ChartMonth = {
  key: string; label: string; long: string;
  inn: number; out: number; saldo: number;
  selected: boolean; current: boolean;
  href: string;                                   // ?mes=AAAA-MM
  innText: string; outText: string; saldoText: string; // já formatados em R$
};

/**
 * Fluxo de caixa dos últimos 12 meses: entradas × saídas pagas (barras) e saldo do mês (linha).
 * Cada mês é um link para o mês (atualiza KPIs, DRE e extrato); passar o mouse ou Tab mostra os valores.
 */
export default function CashFlowChart({
  months, ticks, lo, hi,
}: { months: ChartMonth[]; ticks: { value: number; text: string }[]; lo: number; hi: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = months.length;
  const span = hi - lo || 1;
  const pct = (v: number) => ((v - lo) / span) * 100;   // posição a partir do fundo
  const zero = pct(0);
  const hasData = months.some((m) => m.inn > 0 || m.out > 0);

  if (!hasData) {
    return (
      <section className="ficha-box">
        <div className={styles.head}><h2>Fluxo de caixa · 12 meses</h2></div>
        <p style={{ color: "var(--stone)" }}>Sem entradas ou saídas pagas nos últimos 12 meses.</p>
      </section>
    );
  }
  const t = hover !== null ? months[hover] : null;
  const points = months.map((m, i) => `${((i + 0.5) / n) * 100},${100 - pct(m.saldo)}`).join(" ");

  return (
    <section className="ficha-box">
      <div className={styles.head}>
        <h2>Fluxo de caixa · 12 meses</h2>
        <div className={styles.legend}>
          <span><i className={styles.swIn} />Entradas</span>
          <span><i className={styles.swOut} />Saídas</span>
          <span><i className={styles.swLine} />Saldo do mês</span>
        </div>
      </div>

      <div className={styles.chart}>
        <div className={styles.axis} aria-hidden="true">
          {ticks.map((k) => <span key={k.value} style={{ bottom: `${pct(k.value)}%` }}>{k.text}</span>)}
        </div>
        <div>
          <div className={styles.plot}>
            {ticks.map((k) => <div key={k.value} className={k.value === 0 ? styles.gridZero : styles.grid} style={{ bottom: `${pct(k.value)}%` }} aria-hidden="true" />)}

            <nav className={styles.cols} aria-label="Meses: clique para ver o mês">
              {months.map((m, i) => (
                <Link key={m.key} href={m.href} className={m.selected ? styles.colOn : styles.col}
                  aria-current={m.selected ? "page" : undefined}
                  aria-label={`${m.long}: entradas ${m.innText}, saídas ${m.outText}, saldo ${m.saldoText}`}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                  <i className={styles.barIn} style={{ bottom: `${zero}%`, height: `${(m.inn / span) * 100}%` }} />
                  <i className={styles.barOut} style={{ bottom: `${zero}%`, height: `${(m.out / span) * 100}%` }} />
                </Link>
              ))}
            </nav>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.line} aria-hidden="true">
              <polyline points={points} fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {months.map((m, i) => (
              <i key={m.key} className={styles.dot} aria-hidden="true" style={{ left: `${((i + 0.5) / n) * 100}%`, bottom: `${pct(m.saldo)}%` }} />
            ))}

            {t && (
              <div className={styles.tip} style={{ left: `${Math.min(86, Math.max(14, ((hover! + 0.5) / n) * 100))}%` }}>
                <strong>{t.long}</strong>
                <div><span>Entradas</span><b>{t.innText}</b></div>
                <div><span>Saídas</span><b>{t.outText}</b></div>
                <div><span>Saldo</span><b>{t.saldoText}</b></div>
              </div>
            )}
          </div>
          <div className={styles.labels}>
            {months.map((m) => {
              const [abbr, yr] = m.label.split("/");
              return <span key={m.key} className={m.selected ? styles.lblOn : styles.lbl}>{abbr}{yr ? <small className={styles.yr}>/{yr}</small> : null}</span>;
            })}
          </div>
        </div>
      </div>
      <p className={styles.hint}>Pelo que foi efetivamente pago/recebido (data do pagamento). Clique num mês para ver os KPIs, a DRE e o extrato dele.</p>
    </section>
  );
}
