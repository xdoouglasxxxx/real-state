/**
 * Períodos do dashboard (Mês / Trimestre / Ano). Limites calculados no fuso do Brasil
 * (UTC-3, sem horário de verão desde 2019), não no do servidor (UTC na Vercel): às 22h
 * do último dia do mês ainda é este mês. Funções puras, testadas em tests/unit/periods.test.ts.
 */
export type Period = "mes" | "tri" | "ano";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "mes", label: "Mês" },
  { id: "tri", label: "Trimestre" },
  { id: "ano", label: "Ano" },
];

const BRT = -3 * 3600000; // hora local = UTC + BRT
const MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const COPY: Record<Period, { span: number; noun: string; cmp: string }> = {
  mes: { span: 1, noun: "no mês", cmp: "vs mês anterior" },
  tri: { span: 3, noun: "no trimestre", cmp: "vs trimestre anterior" },
  ano: { span: 12, noun: "no ano", cmp: "vs ano anterior" },
};

export function parsePeriod(v: unknown): Period {
  return v === "tri" || v === "ano" ? v : "mes";
}

export type PeriodRange = {
  period: Period;
  start: Date;        // início do período (inclusive)
  end: Date;          // agora (exclusivo)
  prevStart: Date;    // início do período anterior
  prevEnd: Date;      // mesmo tempo decorrido no período anterior (comparação justa: parcial com parcial)
  fullEnd: Date;      // fim do período inteiro
  months: { year: number; month: number }[]; // meses do calendário dentro do período (month 1-12)
  elapsedFraction: number; // 0..1 — quanto do período já passou
  noun: string;       // "no mês"
  cmp: string;        // "vs mês anterior"
  label: string;      // "novembro de 2026"
};

export function periodRange(period: Period, now: Date = new Date()): PeriodRange {
  const { span, noun, cmp } = COPY[period];
  const local = new Date(now.getTime() + BRT); // use só os getters UTC* neste objeto
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const sm = period === "mes" ? m : period === "tri" ? Math.floor(m / 3) * 3 : 0;
  const at = (month: number) => new Date(Date.UTC(y, month, 1) - BRT); // 1º dia, 00:00 BRT

  const start = at(sm);
  const fullEnd = at(sm + span);
  const prevStart = at(sm - span);
  const elapsed = now.getTime() - start.getTime();
  const prevEnd = new Date(Math.min(prevStart.getTime() + elapsed, start.getTime())); // não passa do fim do anterior

  const months = Array.from({ length: span }, (_, i) => {
    const idx = sm + i;
    return { year: y + Math.floor(idx / 12), month: (idx % 12) + 1 };
  });
  const total = fullEnd.getTime() - start.getTime();
  const label = period === "mes" ? `${MONTHS_PT[m]} de ${y}` : period === "tri" ? `${Math.floor(m / 3) + 1}º trimestre de ${y}` : String(y);

  return {
    period, start, end: now, prevStart, prevEnd, fullEnd, months, noun, cmp, label,
    elapsedFraction: Math.max(0, Math.min(1, elapsed / total)),
  };
}

/** Link do dashboard com os filtros (o período padrão "mes" não vai na URL: links mais limpos). */
export function dashHref(period: Period, agentId: string | null): string {
  const q = new URLSearchParams();
  if (period !== "mes") q.set("periodo", period);
  if (agentId) q.set("corretor", agentId);
  const s = q.toString();
  return "/painel" + (s ? "?" + s : "");
}
