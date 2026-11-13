/**
 * Resumo do tenant para a home do site público: tudo calculado dos dados REAIS dele (nada de número fixo).
 * O cliente do banco entra por parâmetro (tipo do Prisma real, sem import em tempo de execução) → testável.
 */
import type { prisma } from "./prisma";

type Db = typeof prisma;
export type SiteSummary = { availableCount: number; hoods: { name: string; count: number }[]; agentsCount: number };

const AVAILABLE = ["FOR_SALE", "EXCLUSIVE"] as const;

export function sortHoods(rows: { name: string; count: number }[], limit = 12) {
  return [...rows].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")).slice(0, limit);
}

export async function getSiteSummary(db: Db, orgId: string): Promise<SiteSummary> {
  const [availableCount, byHood, agentsCount] = await Promise.all([
    db.property.count({ where: { organizationId: orgId, status: { in: ["FOR_SALE", "EXCLUSIVE"] } } }),
    db.property.groupBy({ by: ["neighborhood"], where: { organizationId: orgId, status: { in: ["FOR_SALE", "EXCLUSIVE"] }, neighborhood: { not: null } }, _count: true }),
    db.agent.count({ where: { organizationId: orgId, isActive: true } }),
  ]);
  return {
    availableCount,
    hoods: sortHoods(byHood.filter((r) => r.neighborhood).map((r) => ({ name: String(r.neighborhood), count: r._count }))),
    agentsCount,
  };
}

/** Mesmo resumo em memória (modo demonstração, sem banco). */
export function summaryFromProperties(props: { status?: string; neighborhood?: string | null }[], agentsCount: number): SiteSummary {
  const avail = props.filter((p) => (AVAILABLE as readonly string[]).includes(String(p.status)));
  const map = new Map<string, number>();
  for (const p of avail) if (p.neighborhood) map.set(p.neighborhood, (map.get(p.neighborhood) ?? 0) + 1);
  return { availableCount: avail.length, hoods: sortHoods(Array.from(map, ([name, count]) => ({ name, count }))), agentsCount };
}
