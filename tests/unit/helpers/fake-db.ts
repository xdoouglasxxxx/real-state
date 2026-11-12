/**
 * Banco de mentira p/ testar consultas do Prisma sem banco: implementa só o que o dashboard usa
 * (count, findMany, aggregate, groupBy; filtros gte/gt/lt/lte/in/notIn/not/OR e relações).
 * Campo desconhecido ou operador não suportado LANÇA ERRO — assim erro de digitação numa
 * consulta aparece no teste em vez de passar calado.
 */
type Row = Record<string, any>;
export type Tables = Record<string, Row[]>;

const RELATIONS: Record<string, Record<string, [string, string]>> = {
  activity: { lead: ["lead", "leadId"] },
  proposal: { lead: ["lead", "leadId"] },
  contract: { proposal: ["proposal", "proposalId"] },
};

export function makeFakeDb(t: Tables) {
  const num = (v: any) => (v instanceof Date ? +v : v);
  function matchValue(v: any, cond: any, path: string): boolean {
    if (cond === undefined) return true;
    if (cond === null) return v == null;
    if (cond instanceof Date) return +v === +cond;
    if (typeof cond === "object") {
      for (const [op, arg] of Object.entries(cond)) {
        switch (op) {
          case "gte": if (!(v != null && num(v) >= num(arg))) return false; break;
          case "gt": if (!(v != null && num(v) > num(arg))) return false; break;
          case "lte": if (!(v != null && num(v) <= num(arg))) return false; break;
          case "lt": if (!(v != null && num(v) < num(arg))) return false; break;
          case "in": if (!(arg as any[]).includes(v)) return false; break;
          case "notIn": if ((arg as any[]).includes(v)) return false; break;
          case "not": if (arg === null ? v == null : v === arg) return false; break;
          default: throw new Error(`banco de mentira: operador "${op}" não suportado em ${path}`);
        }
      }
      return true;
    }
    return v === cond;
  }
  function matches(table: string, row: Row, where: Row = {}): boolean {
    for (const [key, cond] of Object.entries(where)) {
      if (cond === undefined) continue;
      if (key === "OR") { if (!(cond as Row[]).some((sub) => matches(table, row, sub))) return false; continue; }
      const rel = RELATIONS[table]?.[key];
      if (rel) {
        const [relTable, fk] = rel;
        const related = (t[relTable] ?? []).find((r) => r.id === row[fk]);
        if (!related || !matches(relTable, related, cond as Row)) return false;
        continue;
      }
      if (!(key in row)) throw new Error(`banco de mentira: ${table}.${key} não existe (erro de digitação na consulta?)`);
      if (!matchValue(row[key], cond, `${table}.${key}`)) return false;
    }
    return true;
  }
  const rows = (table: string, where?: Row) => (t[table] ?? []).filter((r) => matches(table, r, where));
  const project = (r: Row, select?: Row) => (select ? Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, r[k]])) : { ...r });

  const model = (table: string) => ({
    count: async ({ where }: Row = {}) => rows(table, where).length,
    findMany: async ({ where, select, take, orderBy }: Row = {}) => {
      let out = rows(table, where);
      if (orderBy) { const [k, dir] = Object.entries(orderBy)[0] as [string, string]; out = [...out].sort((a, b) => (a[k] > b[k] ? 1 : -1) * (dir === "desc" ? -1 : 1)); }
      if (take) out = out.slice(0, take);
      return out.map((r) => project(r, select));
    },
    aggregate: async ({ where, _sum, _count }: Row) => {
      const rs = rows(table, where);
      const sums: Row = {};
      for (const k of Object.keys(_sum ?? {})) sums[k] = rs.length ? rs.reduce((s, r) => s + Number(r[k] ?? 0), 0) : null;
      return { _sum: sums, _count: _count ? rs.length : undefined };
    },
    groupBy: async ({ by, where }: Row) => {
      const g = new Map<any, number>();
      for (const r of rows(table, where)) g.set(r[by[0]], (g.get(r[by[0]]) ?? 0) + 1);
      return Array.from(g, ([k, n]) => ({ [by[0]]: k, _count: n }));
    },
  });
  return { lead: model("lead"), visit: model("visit"), property: model("property"), contract: model("contract"), proposal: model("proposal"), goal: model("goal"), activity: model("activity"), agent: model("agent") };
}
