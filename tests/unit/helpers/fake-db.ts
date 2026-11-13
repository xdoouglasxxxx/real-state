/**
 * Banco de mentira p/ testar consultas do Prisma sem banco. Implementa só o que o código do projeto usa:
 * count, findMany, findFirst, findUnique, create, aggregate, groupBy; filtros gte/gt/lt/lte/in/notIn/not/OR, relações
 * (to-one e `none`/`some` em to-many) e filtro em JSON (`path` + `equals`/`string_starts_with`); `select` aninhado.
 * Campo desconhecido ou operador não suportado LANÇA ERRO — erro de digitação numa consulta aparece no teste
 * em vez de passar calado.
 */
type Row = Record<string, any>;
export type Tables = Record<string, Row[]>;

// relações "para um" (chave estrangeira na própria linha): tabela → campo → [tabela alvo, coluna da chave]
const RELATIONS: Record<string, Record<string, [string, string]>> = {
  activity: { lead: ["lead", "leadId"] },
  proposal: { lead: ["lead", "leadId"], property: ["property", "propertyId"], contact: ["contact", "contactId"] },
  contract: { proposal: ["proposal", "proposalId"] },
  lead: { contact: ["contact", "contactId"], property: ["property", "propertyId"], agent: ["agent", "agentId"] },
  visit: { property: ["property", "propertyId"], lead: ["lead", "leadId"], contact: ["contact", "contactId"], agent: ["agent", "agentId"] },
  task: { lead: ["lead", "leadId"], agent: ["agent", "agentId"] },
};
// relações "para muitos" (a chave estrangeira está na outra tabela): tabela → campo → [tabela alvo, coluna da chave]
const MANY: Record<string, Record<string, [string, string]>> = {
  property: { visits: ["visit", "propertyId"] },
};

export function makeFakeDb(t: Tables) {
  const num = (v: any) => (v instanceof Date ? +v : v);
  const dig = (obj: any, path: string[]) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj);

  function matchValue(v: any, cond: any, where: string): boolean {
    if (cond === undefined) return true;
    if (cond === null) return v == null;
    if (cond instanceof Date) return +v === +cond;
    if (typeof cond === "object") {
      if ("path" in cond) { // filtro em campo JSON
        const got = dig(v, cond.path);
        if ("equals" in cond) return got === cond.equals;
        if ("string_starts_with" in cond) return typeof got === "string" && got.startsWith(cond.string_starts_with);
        throw new Error(`banco de mentira: filtro JSON sem operador suportado em ${where}`);
      }
      for (const [op, arg] of Object.entries(cond)) {
        switch (op) {
          case "gte": if (!(v != null && num(v) >= num(arg))) return false; break;
          case "gt": if (!(v != null && num(v) > num(arg))) return false; break;
          case "lte": if (!(v != null && num(v) <= num(arg))) return false; break;
          case "lt": if (!(v != null && num(v) < num(arg))) return false; break;
          case "in": if (!(arg as any[]).includes(v)) return false; break;
          case "notIn": if ((arg as any[]).includes(v)) return false; break;
          case "not": if (arg === null ? v == null : v === arg) return false; break;
          case "mode": break; // junto de `contains`: a comparação já é sem diferença de maiúsculas
          case "contains": if (!(typeof v === "string" && v.toLowerCase().includes(String(arg).toLowerCase()))) return false; break;
          default: throw new Error(`banco de mentira: operador "${op}" não suportado em ${where}`);
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
      const one = RELATIONS[table]?.[key];
      if (one) {
        const [relTable, fk] = one;
        const related = (t[relTable] ?? []).find((r) => r.id === row[fk]);
        if (!related || !matches(relTable, related, cond as Row)) return false;
        continue;
      }
      const many = MANY[table]?.[key];
      if (many) {
        const [relTable, fk] = many;
        const children = (t[relTable] ?? []).filter((r) => r[fk] === row.id);
        const c = cond as Row;
        if ("none" in c && children.some((r) => matches(relTable, r, c.none))) return false;
        if ("some" in c && !children.some((r) => matches(relTable, r, c.some))) return false;
        const known = ["none", "some"]; for (const k of Object.keys(c)) if (!known.includes(k)) throw new Error(`banco de mentira: filtro de relação "${k}" não suportado em ${table}.${key}`);
        continue;
      }
      if (!(key in row)) throw new Error(`banco de mentira: ${table}.${key} não existe (erro de digitação na consulta?)`);
      if (!matchValue(row[key], cond, `${table}.${key}`)) return false;
    }
    return true;
  }

  const rows = (table: string, where?: Row) => (t[table] ?? []).filter((r) => matches(table, r, where));

  function project(table: string, r: Row, select?: Row): Row {
    if (!select) return { ...r };
    const out: Row = {};
    for (const [k, v] of Object.entries(select)) {
      if (!v) continue;
      if (v === true) {
        if (!(k in r)) throw new Error(`banco de mentira: select de ${table}.${k}, que não existe`);
        out[k] = r[k]; continue;
      }
      const one = RELATIONS[table]?.[k];
      if (!one) throw new Error(`banco de mentira: relação ${table}.${k} desconhecida no select`);
      const [relTable, fk] = one;
      const related = (t[relTable] ?? []).find((x) => x.id === r[fk]);
      out[k] = related ? project(relTable, related, (v as Row).select) : null;
    }
    return out;
  }

  const sorted = (out: Row[], orderBy?: Row) => {
    if (!orderBy) return out;
    const [k, dir] = Object.entries(Array.isArray(orderBy) ? orderBy[0] : orderBy)[0] as [string, string];
    return [...out].sort((a, b) => ((num(a[k]) > num(b[k]) ? 1 : num(a[k]) < num(b[k]) ? -1 : 0)) * (dir === "desc" ? -1 : 1));
  };

  let seq = 0;
  const model = (table: string) => ({
    count: async ({ where }: Row = {}) => rows(table, where).length,
    findMany: async ({ where, select, take, orderBy }: Row = {}) => {
      let out = sorted(rows(table, where), orderBy);
      if (take) out = out.slice(0, take);
      return out.map((r) => project(table, r, select));
    },
    // chave composta do Prisma (ex.: organizationId_slug: { organizationId, slug }) vira filtro simples
    findUnique: async ({ where, select }: Row = {}) => {
      const flat: Row = {};
      for (const [k, v] of Object.entries(where ?? {})) {
        if (k.includes("_") && v && typeof v === "object" && !(v instanceof Date)) Object.assign(flat, v); else flat[k] = v;
      }
      const r = rows(table, flat)[0];
      return r ? project(table, r, select) : null;
    },
    findFirst: async ({ where, select, orderBy }: Row = {}) => {
      const r = sorted(rows(table, where), orderBy)[0];
      return r ? project(table, r, select) : null;
    },
    create: async ({ data }: Row) => {
      const row = { id: `${table}-new-${++seq}`, createdAt: new Date(), ...data };
      (t[table] ??= []).push(row);
      return { ...row };
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
  return {
    lead: model("lead"), visit: model("visit"), property: model("property"), contract: model("contract"), proposal: model("proposal"),
    goal: model("goal"), activity: model("activity"), agent: model("agent"), financeEntry: model("financeEntry"),
    task: model("task"), contact: model("contact"), testimonial: model("testimonial"),
  };
}
