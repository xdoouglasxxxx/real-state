/**
 * Dashboard do gestor por PERÍODO (mês/trimestre/ano) e, opcionalmente, por CORRETOR.
 *
 * O cliente do banco entra por parâmetro (`db`): o tipo vem do Prisma de verdade (a build da
 * Vercel confere cada consulta), mas nada aqui importa o Prisma em tempo de execução — assim a
 * lógica é testada com um banco de mentira (tests/unit/dashboard.test.ts).
 *
 * O que é "do período" x "de agora":
 *  - DO PERÍODO: leads novos, visitas realizadas, vendas (contratos fechados), valor realizado,
 *    funil de conversão, origem dos leads, conversão, meta, ranking.
 *  - DE AGORA (fotografia, não depende do período): imóveis disponíveis, visitas marcadas,
 *    contratos aguardando assinatura, propostas em aberto.
 *
 * Filtro por corretor:
 *  - leads/visitas/imóveis → `agentId` da própria linha;
 *  - propostas → `lead.agentId`; contratos → `proposal.lead.agentId` (contrato não tem corretor).
 */
import type { prisma } from "./prisma";
import { periodRange, type Period } from "./periods";
import { buildFunnel, worstStep, type FunnelStep } from "./funnel";
import { buildSources, mergeRanking, rate, type RankRow, type SourceRow } from "./dash-calc";

type Db = typeof prisma;

export type DashFilters = { period: Period; agentId: string | null };

export type DashData = {
  label: string;      // "novembro de 2026"
  noun: string;       // "no mês"
  cmp: string;        // "vs mês anterior"
  elapsedFraction: number;
  /** horários (UTC) usados nas consultas, prontos para colar no SQL de conferência (DASHBOARD.md) */
  range: { ini: string; fim: string; pini: string; pfim: string };
  // fotografia de agora
  availableValue: number; availableCount: number; scheduledVisits: number;
  awaitingContracts: number; openProposals: number;
  // do período (+ período anterior para variação)
  newLeads: number; newLeadsPrev: number;
  visitsDone: number; visitsDonePrev: number;
  sold: number; soldPrev: number; realizado: number;
  conversion: number; // % dos leads criados no período que já viraram venda
  meta: number; goalPct: number;
  funnel: FunnelStep[];
  worst: { fromIndex: number; toIndex: number; pct: number } | null;
  sources: SourceRow[];
  ranking: RankRow[];
};

export async function getAgentOptions(db: Db, orgId: string) {
  const rows = await db.agent.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true },
  });
  return rows.map((a) => ({ id: a.id, name: a.isActive ? a.name : `${a.name} (inativo)` }));
}

/** `to` do payload de uma mudança de etapa; "" se o payload não tem o formato esperado. */
const utc = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19) + "+00";

const toOf = (payload: unknown): string =>
  payload && typeof payload === "object" && "to" in payload ? String((payload as { to: unknown }).to ?? "") : "";

export async function getDashboardPeriod(db: Db, orgId: string, f: DashFilters, now: Date = new Date()): Promise<DashData> {
  const r = periodRange(f.period, now);
  const agentId = f.agentId;
  const byAgent = agentId ? { agentId } : {};
  const viaLead = agentId ? { lead: { agentId } } : {};
  const viaProposalLead = agentId ? { proposal: { lead: { agentId } } } : {};
  const inRange = { gte: r.start, lt: r.end };
  const inPrev = { gte: r.prevStart, lt: r.prevEnd };

  const [
    availableAgg, scheduledVisits, awaitingContracts, openProposals,
    cohort, changes, newLeadsPrev,
    visitsDone, visitsDonePrev, soldAgg, soldPrev,
    goals, agents, leadsBy, visitsBy, wonBy,
  ] = await Promise.all([
    db.property.aggregate({ where: { organizationId: orgId, status: { in: ["FOR_SALE", "EXCLUSIVE"] }, ...byAgent }, _sum: { price: true }, _count: true }),
    db.visit.count({ where: { organizationId: orgId, status: "SCHEDULED", ...byAgent } }),
    db.contract.count({ where: { organizationId: orgId, status: "AWAITING_SIGNATURE", ...viaProposalLead } }),
    db.proposal.count({ where: { organizationId: orgId, status: "SENT", ...viaLead } }),
    // leads CRIADOS no período: base do funil, da origem e da conversão
    db.lead.findMany({ where: { organizationId: orgId, createdAt: inRange, ...byAgent }, select: { id: true, stage: true, source: true }, take: 20000 }),
    db.activity.findMany({ where: { type: "STAGE_CHANGE", lead: { organizationId: orgId, createdAt: inRange, ...byAgent } }, select: { leadId: true, payload: true }, take: 100000 }),
    db.lead.count({ where: { organizationId: orgId, createdAt: inPrev, ...byAgent } }),
    db.visit.count({ where: { organizationId: orgId, status: "DONE", scheduledAt: inRange, ...byAgent } }),
    db.visit.count({ where: { organizationId: orgId, status: "DONE", scheduledAt: inPrev, ...byAgent } }),
    db.contract.aggregate({ where: { organizationId: orgId, status: "CLOSED", closedAt: inRange, ...viaProposalLead }, _sum: { totalAmount: true }, _count: true }),
    db.contract.count({ where: { organizationId: orgId, status: "CLOSED", closedAt: inPrev, ...viaProposalLead } }),
    // meta: soma das metas dos meses do período (da imobiliária, ou do corretor filtrado)
    db.goal.findMany({ where: { organizationId: orgId, agentId: agentId ?? null, OR: r.months.map((m) => ({ year: m.year, month: m.month })) }, select: { targetAmount: true } }),
    // ranking: sempre de todos os corretores, para dar para trocar de filtro
    db.agent.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } }),
    db.lead.groupBy({ by: ["agentId"], where: { organizationId: orgId, createdAt: inRange, agentId: { not: null } }, _count: true }),
    db.visit.groupBy({ by: ["agentId"], where: { organizationId: orgId, status: "DONE", scheduledAt: inRange, agentId: { not: null } }, _count: true }),
    db.lead.groupBy({ by: ["agentId"], where: { organizationId: orgId, stage: "WON", updatedAt: inRange, agentId: { not: null } }, _count: true }),
  ]);

  const funnel = buildFunnel(
    cohort.map((l) => ({ id: l.id, stage: String(l.stage) })),
    changes.map((c) => ({ leadId: c.leadId, to: toOf(c.payload) })),
  );
  const wonLeads = cohort.filter((l) => l.stage === "WON").length;
  const meta = goals.reduce((s, g) => s + Number(g.targetAmount), 0);
  const realizado = Number(soldAgg._sum.totalAmount ?? 0);

  return {
    label: r.label, noun: r.noun, cmp: r.cmp, elapsedFraction: r.elapsedFraction,
    range: { ini: utc(r.start), fim: utc(r.end), pini: utc(r.prevStart), pfim: utc(r.prevEnd) },
    availableValue: Number(availableAgg._sum.price ?? 0), availableCount: availableAgg._count,
    scheduledVisits, awaitingContracts, openProposals,
    newLeads: cohort.length, newLeadsPrev,
    visitsDone, visitsDonePrev,
    sold: soldAgg._count, soldPrev, realizado,
    conversion: rate(wonLeads, cohort.length),
    meta, goalPct: meta ? Math.min(100, Math.round((100 * realizado) / meta)) : 0,
    funnel, worst: worstStep(funnel),
    sources: buildSources(cohort.map((l) => ({ source: String(l.source), won: l.stage === "WON" }))),
    ranking: mergeRanking(agents, leadsBy, visitsBy, wonBy),
  };
}
