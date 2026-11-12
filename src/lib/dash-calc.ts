/** Cálculos puros do dashboard (testados em tests/unit/dash-calc.test.ts). */

/** Variação %: período anterior zerado → 100 se houve algo, senão 0. */
export const pctChange = (cur: number, prev: number): number =>
  prev === 0 ? (cur > 0 ? 100 : 0) : Math.round((100 * (cur - prev)) / prev);

/** a/b em %, sem dividir por zero. */
export const rate = (a: number, b: number): number => (b > 0 ? Math.round((100 * a) / b) : 0);

/** Projeção linear do realizado até o fim do período, dado quanto dele já passou (0..1). */
export const paceProjection = (realizado: number, elapsedFraction: number): number =>
  realizado > 0 && elapsedFraction > 0 ? Math.round(realizado / elapsedFraction) : 0;

export type SourceRow = { source: string; count: number; won: number; share: number };

/** Origem dos leads do período: ordenada por volume, com % do total. Top `limit`; o resto vira "OUTRO". */
export function buildSources(rows: { source: string; won: boolean }[], limit = 6): SourceRow[] {
  const total = rows.length;
  const map = new Map<string, { count: number; won: number }>();
  for (const r of rows) {
    const cur = map.get(r.source) ?? { count: 0, won: 0 };
    cur.count++;
    if (r.won) cur.won++;
    map.set(r.source, cur);
  }
  const all = Array.from(map, ([source, v]) => ({ source, ...v })).sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
  const top = all.slice(0, limit);
  const rest = all.slice(limit);
  if (rest.length) {
    const extra = rest.reduce((s, r) => ({ count: s.count + r.count, won: s.won + r.won }), { count: 0, won: 0 });
    const other = top.find((t) => t.source === "OUTRO");
    if (other) { other.count += extra.count; other.won += extra.won; } else top.push({ source: "OUTRO", ...extra });
  }
  return top.map((t) => ({ ...t, share: rate(t.count, total) }));
}

export type RankRow = { id: string; name: string; leads: number; visits: number; won: number };
type Grouped = { agentId: string | null; _count: number };

/** Ranking por corretor: junta contagens por agente; descarta quem não teve nada no período. */
export function mergeRanking(
  agents: { id: string; name: string }[],
  leadsBy: Grouped[], visitsBy: Grouped[], wonBy: Grouped[], limit = 8,
): RankRow[] {
  const n = (rows: Grouped[], id: string) => rows.find((r) => r.agentId === id)?._count ?? 0;
  return agents
    .map((a) => ({ id: a.id, name: a.name, leads: n(leadsBy, a.id), visits: n(visitsBy, a.id), won: n(wonBy, a.id) }))
    .filter((r) => r.leads + r.visits + r.won > 0)
    .sort((a, b) => b.won - a.won || b.visits - a.visits || b.leads - a.leads || a.name.localeCompare(b.name))
    .slice(0, limit);
}
