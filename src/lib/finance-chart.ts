/**
 * Série do gráfico "Fluxo de caixa · 12 meses" do Financeiro.
 *
 * Mesma base do resto da tela: CAIXA (data do `paidAt`) e mesmos limites de mês dos KPIs e da DRE
 * (horário do servidor — UTC na Vercel). Assim a barra do mês selecionado é igual ao KPI "recebido"/"pago".
 * O cliente do banco entra por parâmetro (o tipo vem do Prisma real; nada é importado em tempo de execução),
 * então a lógica é testada com um banco de mentira (tests/unit/finance-chart.test.ts).
 */
import type { prisma } from "./prisma";

type Db = typeof prisma;

export const MONTHS_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const monthIndex = (year: number, month0: number) => year * 12 + month0;
export const monthKey = (year: number, month0: number) => `${year}-${String(month0 + 1).padStart(2, "0")}`;

/**
 * Janela de `size` meses: termina no mês atual; se o mês selecionado é futuro, termina nele;
 * se é anterior ao começo da janela, ele vira o primeiro mês (a janela anda para trás).
 */
export function chartWindow(selectedIdx: number, currentIdx: number, size = 12): { startIdx: number; endIdx: number } {
  let endIdx = currentIdx;
  if (selectedIdx > currentIdx) endIdx = selectedIdx;
  else if (selectedIdx < currentIdx - (size - 1)) endIdx = selectedIdx + (size - 1);
  return { startIdx: endIdx - (size - 1), endIdx };
}

/** Passo "redondo" (1, 2, 5 × 10^k) para dividir `range` em ~`target` faixas. */
export function niceStep(range: number, target = 5): number {
  if (!(range > 0)) return 1;
  const raw = range / target;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

/** Escala do eixo Y que sempre inclui o zero (e o negativo, se o saldo ficar abaixo dele). */
export function buildScale(values: number[], target = 5): { lo: number; hi: number; ticks: number[] } {
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const step = niceStep(max - min, target);
  const hi = Math.ceil(max / step) * step;
  const lo = Math.floor(min / step) * step;
  const n = Math.max(1, Math.round((hi - lo) / step));
  return { lo, hi: hi === lo ? lo + step : hi, ticks: Array.from({ length: n + 1 }, (_, i) => lo + i * step) };
}

export type FinanceMonth = {
  key: string;      // "2026-11" (o mesmo formato do ?mes=)
  label: string;    // "nov" (com "/26" no primeiro mês e em janeiro)
  long: string;     // "novembro de 2026"
  inn: number;      // entradas pagas no mês
  out: number;      // saídas pagas no mês
  saldo: number;    // inn − out
  selected: boolean;
  current: boolean;
};

export async function getFinanceSeries(db: Db, orgId: string, year: number, month: number, now: Date = new Date()): Promise<FinanceMonth[]> {
  const selIdx = monthIndex(year, month - 1);
  const curIdx = monthIndex(now.getFullYear(), now.getMonth());
  const { startIdx, endIdx } = chartWindow(selIdx, curIdx);
  const at = (idx: number) => ({ y: Math.floor(idx / 12), m0: ((idx % 12) + 12) % 12 });
  // limites exatamente como os do KPI/DRE: 1º dia 00:00 até o último dia 23:59:59
  const bounds = (idx: number) => { const { y, m0 } = at(idx); return { from: new Date(y, m0, 1), to: new Date(y, m0 + 1, 0, 23, 59, 59) }; };

  const rows = await db.financeEntry.findMany({
    where: { organizationId: orgId, paidAt: { gte: bounds(startIdx).from, lte: bounds(endIdx).to } },
    select: { direction: true, amount: true, paidAt: true },
    take: 50000,
  });

  const months: FinanceMonth[] = [];
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const { y, m0 } = at(idx);
    const { from, to } = bounds(idx);
    let inn = 0, out = 0;
    for (const r of rows) {
      const t = +new Date(r.paidAt as Date);
      if (t < +from || t > +to) continue;
      if (r.direction === "IN") inn += Number(r.amount); else out += Number(r.amount);
    }
    months.push({
      key: monthKey(y, m0),
      label: MONTHS_ABBR[m0] + (idx === startIdx || m0 === 0 ? `/${String(y).slice(2)}` : ""),
      long: `${MONTHS_LONG[m0]} de ${y}`,
      inn, out, saldo: inn - out,
      selected: idx === selIdx,
      current: idx === curIdx,
    });
  }
  return months;
}
