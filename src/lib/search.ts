/**
 * Busca de imóveis do site público: validação dos parâmetros da URL e montagem do filtro.
 *
 * Por que validar: um `?type=xyz` ou `?price=abc` chegava cru ao Prisma, a consulta falhava e o `catch`
 * de `searchProperties` caía no fallback de DEMONSTRAÇÃO, mostrando os imóveis fictícios da Maison no site
 * de um cliente real. Aqui nenhum valor inválido passa: ele é descartado antes da consulta.
 * Funções puras, testadas em tests/unit/search.test.ts.
 */
import type { Prisma, PropStatus, PropertyType } from "@prisma/client";

export const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "FARM"] as const;
const AVAILABLE: PropStatus[] = ["FOR_SALE", "EXCLUSIVE"];
export type SearchFilters = { type?: string; location?: string; min?: number; max?: number; q?: string; beds?: number; exclusive?: boolean };

/** Faixas de preço da busca (o `value` vai na URL como "min-max"; vazio de um lado = sem limite). */
export const PRICE_BANDS = [
  { value: "0-1000000", label: "Até R$ 1 mi" },
  { value: "1000000-3000000", label: "R$ 1 – 3 mi" },
  { value: "3000000-6000000", label: "R$ 3 – 6 mi" },
  { value: "6000000-", label: "Acima de R$ 6 mi" },
] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function normalizeQuery(q?: string | null): string | undefined {
  const s = String(q ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  return s || undefined;
}

export function parseBand(v?: string | null): { min?: number; max?: number } {
  const m = /^(\d{0,12})-(\d{0,12})$/.exec(String(v ?? ""));
  if (!m) return {};
  const min = m[1] ? Number(m[1]) : undefined;
  const max = m[2] ? Number(m[2]) : undefined;
  if (min !== undefined && max !== undefined && max < min) return {};
  return { min, max };
}

export function parseBeds(v?: string | null): number | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : undefined;
}

/** Converte os searchParams da página em filtros seguros. */
export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchFilters {
  const type = first(sp.type);
  const band = parseBand(first(sp.price));
  const location = String(first(sp.location) ?? "").trim().slice(0, 80);
  return {
    type: (PROPERTY_TYPES as readonly string[]).includes(type ?? "") ? type : undefined,
    location: location || undefined,
    min: band.min, max: band.max,
    q: normalizeQuery(first(sp.q)),
    beds: parseBeds(first(sp.beds)),
    exclusive: first(sp.excl) === "1" ? true : undefined,
  };
}

/** Filtro do Prisma. Sempre por organização; só à venda/exclusivo (rascunho, vendido e arquivado nunca aparecem). */
export function buildSearchWhere(orgId: string, f: SearchFilters): Prisma.PropertyWhereInput {
  const q = normalizeQuery(f.q);
  return {
    organizationId: orgId,
    status: f.exclusive ? ("EXCLUSIVE" as PropStatus) : { in: AVAILABLE },
    ...(f.type ? { type: f.type as PropertyType } : {}),
    ...(f.location ? { neighborhood: f.location } : {}),
    ...(f.beds ? { bedrooms: { gte: f.beds } } : {}),
    price: { gte: f.min ?? 0, ...(f.max ? { lte: f.max } : {}) },
    ...(q ? { OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { neighborhood: { contains: q, mode: "insensitive" as const } },
      { city: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  };
}

/** Mesmo filtro aplicado em memória (modo demonstração, sem banco). */
export function demoMatches(p: { type?: string; status?: string; neighborhood?: string | null; city?: string | null; title?: string; price: number; bedrooms?: number | null }, f: SearchFilters): boolean {
  const q = normalizeQuery(f.q)?.toLowerCase();
  const has = (s?: string | null) => String(s ?? "").toLowerCase().includes(q!);
  return (
    (!f.type || p.type === f.type) &&
    (!f.location || p.neighborhood === f.location) &&
    (!f.beds || (p.bedrooms ?? 0) >= f.beds) &&
    (!f.exclusive || p.status === "EXCLUSIVE") &&
    p.price >= (f.min ?? 0) && (!f.max || p.price <= f.max) &&
    (!q || has(p.title) || has(p.neighborhood) || has(p.city))
  );
}
