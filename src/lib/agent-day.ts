/**
 * "Agente do dia" — fase 1: sugestões geradas por REGRAS sobre os dados do próprio sistema.
 * Sem IA externa, sem custo, nada sai da plataforma: o rascunho é só texto e o botão do WhatsApp abre
 * a conversa já preenchida para o corretor enviar (ou não).
 *
 * O cliente do banco entra por parâmetro (o tipo vem do Prisma real; nada é importado em tempo de execução),
 * então a lógica é testada com um banco de mentira (tests/unit/agent-day.test.ts).
 *
 * Regras (as mesmas do resto do painel, para os números baterem):
 *  - Contrato parado: AWAITING_SIGNATURE criado há 5+ dias (alerta do dashboard).
 *  - Lead esfriando: NEW/CONTACTED sem movimento (`updatedAt`) há 72h+ (selo "Leads" do menu).
 *  - Imóvel sem visita: disponível, criado há 90+ dias e sem visita nos últimos 90 (dashboard e mapa).
 *  - Visita de amanhã: SCHEDULED no dia seguinte, no horário de Brasília.
 *  - Tarefas: não concluídas com vencimento até o fim de hoje (selo do menu e caixa do dashboard).
 *  - Lead sem corretor: só para gerente/admin.
 * Corretor vê só o que é DELE (leads, visitas, imóveis, contratos dos seus leads, tarefas).
 */
import type { prisma } from "./prisma";
import { STAGE_LABEL } from "./format";
import { draftColdLead, draftContract, draftVisit, waLink } from "./agent-drafts";

type Db = typeof prisma;

const DAY = 86400000;
const BRT = -3 * 3600000; // Brasília = UTC-3 (sem horário de verão)

export type ResolvableKind = "lead_frio" | "contrato" | "visita";
export type SuggestionKind = ResolvableKind | "imoveis_parados" | "sem_corretor";

/** Quanto tempo uma sugestão "feita/dispensada" fica escondida. A visita é pontual: some de vez. */
export const DONE_WINDOW_DAYS: Record<ResolvableKind, number> = { lead_frio: 3, contrato: 3, visita: 30 };
export const agentKey = (kind: ResolvableKind, entityId: string) => `agente:${kind}:${entityId}`;

export type Suggestion = {
  key: string;
  kind: SuggestionKind;
  priority: number; // menor = mais urgente
  tag: "Urgente" | "Amanhã" | "Hoje" | "Atenção";
  title: string;
  why: string;
  leadId: string | null;    // onde o "feito" é gravado (sem lead = não dá para marcar)
  entityId: string | null;  // contrato / visita / lead da sugestão
  href: string | null;
  hrefLabel: string | null;
  draft: string | null;
  wa: string | null;        // link do WhatsApp com o rascunho (null sem telefone válido)
};
export type AgentTask = { id: string; title: string; dueAt: string; overdue: boolean; leadId: string; contactName: string | null };
export type AgentDay = { suggestions: Suggestion[]; tasks: AgentTask[]; hiddenCount: number; coldTotal: number; coldShown: number };
export type DayScope = { agentId: string | null; isAgent: boolean };

const EMPTY: AgentDay = { suggestions: [], tasks: [], hiddenCount: 0, coldTotal: 0, coldShown: 0 };
const MAX_COLD = 8;

/** [from, to) do dia de Brasília `offsetDays` à frente de `now`. */
export function brtDay(now: Date, offsetDays = 0): { from: Date; to: Date } {
  const local = new Date(now.getTime() + BRT);
  const base = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + offsetDays);
  return { from: new Date(base - BRT), to: new Date(base + DAY - BRT) };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export async function getAgentDay(db: Db, orgId: string, scope: DayScope, orgName: string, now: Date = new Date()): Promise<AgentDay> {
  // corretor sem vínculo = nada (nunca os dados da imobiliária)
  if (scope.isAgent && !scope.agentId) return EMPTY;
  const agentId = scope.isAgent ? scope.agentId : null;
  const byAgent = agentId ? { agentId } : {};
  const viaProposalLead = agentId ? { proposal: { lead: { agentId } } } : {};
  const viaLead = agentId ? { lead: { agentId } } : {};

  const d72h = new Date(+now - 72 * 3600000);
  const d5d = new Date(+now - 5 * DAY);
  const d90d = new Date(+now - 90 * DAY);
  const d30d = new Date(+now - 30 * DAY);
  const tomorrow = brtDay(now, 1);
  const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999); // mesma regra do selo/caixa de tarefas (horário do servidor)

  const [contracts, visits, coldRows, coldAll, staleCount, staleRows, orphanCount, taskRows, notes] = await Promise.all([
    db.contract.findMany({
      where: { organizationId: orgId, status: "AWAITING_SIGNATURE", createdAt: { lt: d5d }, ...viaProposalLead },
      orderBy: { createdAt: "asc" }, take: 20,
      select: { id: true, createdAt: true, proposal: { select: { leadId: true, property: { select: { title: true } }, contact: { select: { name: true, phone: true } } } } },
    }),
    db.visit.findMany({
      where: { organizationId: orgId, status: "SCHEDULED", scheduledAt: { gte: tomorrow.from, lt: tomorrow.to }, ...byAgent },
      orderBy: { scheduledAt: "asc" }, take: 30,
      select: { id: true, scheduledAt: true, leadId: true, property: { select: { title: true } }, contact: { select: { name: true, phone: true } }, lead: { select: { contact: { select: { name: true, phone: true } } } } },
    }),
    db.lead.findMany({
      where: { organizationId: orgId, ...byAgent, stage: { in: ["NEW", "CONTACTED"] }, updatedAt: { lt: d72h } },
      orderBy: { updatedAt: "asc" }, take: 40,
      select: { id: true, stage: true, updatedAt: true, contact: { select: { name: true, phone: true } }, property: { select: { title: true } } },
    }),
    db.lead.count({ where: { organizationId: orgId, ...byAgent, stage: { in: ["NEW", "CONTACTED"] }, updatedAt: { lt: d72h } } }),
    db.property.count({ where: { organizationId: orgId, status: { in: ["FOR_SALE", "EXCLUSIVE"] }, createdAt: { lt: d90d }, visits: { none: { scheduledAt: { gte: d90d } } }, ...byAgent } }),
    db.property.findMany({
      where: { organizationId: orgId, status: { in: ["FOR_SALE", "EXCLUSIVE"] }, createdAt: { lt: d90d }, visits: { none: { scheduledAt: { gte: d90d } } }, ...byAgent },
      orderBy: { createdAt: "asc" }, take: 3, select: { title: true },
    }),
    scope.isAgent ? Promise.resolve(0) : db.lead.count({ where: { organizationId: orgId, agentId: null, stage: { notIn: ["WON", "LOST"] } } }),
    db.task.findMany({
      where: { organizationId: orgId, doneAt: null, dueAt: { lte: dayEnd }, ...byAgent },
      orderBy: { dueAt: "asc" }, take: 10,
      select: { id: true, title: true, dueAt: true, leadId: true, lead: { select: { contact: { select: { name: true } } } } },
    }),
    // anotações do agente ("feito"/"dispensado") dos últimos 30 dias
    db.activity.findMany({
      where: { type: "NOTE", createdAt: { gte: d30d }, payload: { path: ["agentKey"], string_starts_with: "agente:" }, lead: { organizationId: orgId, ...byAgent } },
      select: { payload: true, createdAt: true },
    }),
  ]);

  // quando cada sugestão foi resolvida pela última vez
  const resolvedAt = new Map<string, number>();
  for (const n of notes) {
    const k = (n.payload as { agentKey?: unknown } | null)?.agentKey;
    if (typeof k === "string") resolvedAt.set(k, Math.max(resolvedAt.get(k) ?? 0, +new Date(n.createdAt as Date)));
  }
  const isResolved = (kind: ResolvableKind, entityId: string) => {
    const t = resolvedAt.get(agentKey(kind, entityId));
    return t !== undefined && t >= +now - DONE_WINDOW_DAYS[kind] * DAY;
  };
  let hiddenCount = 0;
  const out: Suggestion[] = [];

  // 1) contratos parados
  for (const c of contracts) {
    if (isResolved("contrato", c.id)) { hiddenCount++; continue; }
    const days = Math.floor((+now - +new Date(c.createdAt as Date)) / DAY);
    const contact = c.proposal.contact; const prop = c.proposal.property?.title ?? null;
    const draft = draftContract({ name: contact?.name, property: prop, org: orgName });
    out.push({
      key: agentKey("contrato", c.id), kind: "contrato", priority: 1, tag: "Urgente",
      title: `Contrato aguardando assinatura há ${days} dias`,
      why: `${contact?.name ?? "Cliente"} · ${prop ?? "imóvel"}`,
      leadId: c.proposal.leadId ?? null, entityId: c.id,
      href: `/painel/contratos/${c.id}`, hrefLabel: "Abrir contrato",
      draft, wa: waLink(contact?.phone, draft),
    });
  }

  // 2) visitas de amanhã
  for (const v of visits) {
    if (isResolved("visita", v.id)) { hiddenCount++; continue; }
    const contact = v.contact ?? v.lead?.contact ?? null; const prop = v.property?.title ?? null;
    const when = new Date(v.scheduledAt as Date);
    const draft = draftVisit({ name: contact?.name, property: prop, when, org: orgName });
    out.push({
      key: agentKey("visita", v.id), kind: "visita", priority: 2, tag: "Amanhã",
      title: `Visita amanhã: ${prop ?? "imóvel"}`,
      why: contact?.name ?? "Cliente",
      leadId: v.leadId ?? null, entityId: v.id,
      href: "/painel/agenda", hrefLabel: "Abrir agenda",
      draft, wa: waLink(contact?.phone, draft),
    });
  }

  // 3) leads esfriando (os mais antigos primeiro; mostra no máximo MAX_COLD)
  const coldVisible: typeof coldRows = [];
  let hiddenCold = 0;
  for (const l of coldRows) {
    if (isResolved("lead_frio", l.id)) { hiddenCold++; hiddenCount++; continue; }
    if (coldVisible.length < MAX_COLD) coldVisible.push(l);
  }
  for (const l of coldVisible) {
    const days = Math.floor((+now - +new Date(l.updatedAt as Date)) / DAY);
    const prop = l.property?.title ?? null;
    const draft = draftColdLead({ name: l.contact?.name, property: prop, org: orgName });
    out.push({
      key: agentKey("lead_frio", l.id), kind: "lead_frio", priority: 3, tag: "Hoje",
      title: `${l.contact?.name ?? "Lead"} está sem movimento há ${days} dias`,
      why: `${STAGE_LABEL[String(l.stage)] ?? String(l.stage)} · ${prop ?? "sem imóvel de interesse"}`,
      leadId: l.id, entityId: l.id,
      href: `/painel/leads/${l.id}`, hrefLabel: "Abrir lead",
      draft, wa: waLink(l.contact?.phone, draft),
    });
  }
  const coldTotal = Math.max(0, coldAll - hiddenCold);

  // 4) leads sem corretor (só gerente/admin)
  if (!scope.isAgent && orphanCount > 0) {
    out.push({
      key: "agente:sem_corretor", kind: "sem_corretor", priority: 4, tag: "Atenção",
      title: `${orphanCount} ${plural(orphanCount, "lead sem corretor responsável", "leads sem corretor responsável")}`,
      why: "Atribua para não esfriar.", leadId: null, entityId: null,
      href: "/painel/leads", hrefLabel: "Abrir leads", draft: null, wa: null,
    });
  }

  // 5) imóveis sem visita (resumo + atalho para o mapa já filtrado)
  if (staleCount > 0) {
    const names = staleRows.map((p) => p.title);
    const rest = staleCount - names.length;
    out.push({
      key: "agente:imoveis_parados", kind: "imoveis_parados", priority: 5, tag: "Atenção",
      title: `${staleCount} ${plural(staleCount, "imóvel há 90+ dias sem nenhuma visita", "imóveis há 90+ dias sem nenhuma visita")}`,
      why: `${names.join(", ")}${rest > 0 ? ` e mais ${rest}` : ""} — revise preço, fotos e destaque.`,
      leadId: null, entityId: null,
      href: "/painel/mapa?filtro=parado", hrefLabel: "Ver no mapa", draft: null, wa: null,
    });
  }

  const suggestions = out.map((s, i) => ({ s, i })).sort((a, b) => a.s.priority - b.s.priority || a.i - b.i).map((x) => x.s);
  const tasks: AgentTask[] = taskRows.map((t) => ({
    id: t.id, title: t.title, dueAt: new Date(t.dueAt as Date).toISOString(),
    overdue: +new Date(t.dueAt as Date) < +now, leadId: t.leadId, contactName: t.lead?.contact?.name ?? null,
  }));
  return { suggestions, tasks, hiddenCount, coldTotal, coldShown: coldVisible.length };
}

// ---------------------------------------------------------------------------------------------
// Marcar como feito / dispensar — grava uma anotação na timeline do lead, sem tabela nova.
// ---------------------------------------------------------------------------------------------
export type ResolveInput = { kind: string; entityId: string; leadId: string; outcome: string };
export type ResolveCtx = { orgId: string; agentId: string | null; isAgent: boolean; author: string };
export type ResolveResult = "created" | "duplicate" | "not_found" | "invalid";

const LABEL: Record<ResolvableKind, string> = {
  lead_frio: "contato com lead esfriando", contrato: "cobrança de assinatura", visita: "lembrete de visita",
};
const isKind = (k: string): k is ResolvableKind => k === "lead_frio" || k === "contrato" || k === "visita";

export async function resolveSuggestion(db: Db, ctx: ResolveCtx, input: ResolveInput, now: Date = new Date()): Promise<ResolveResult> {
  const { kind, entityId, leadId, outcome } = input;
  if (!isKind(kind) || (outcome !== "done" && outcome !== "dismiss") || !entityId || !leadId) return "invalid";

  // posse: o lead é da imobiliária e, para corretor, é dele
  const lead = await db.lead.findFirst({
    where: { id: leadId, organizationId: ctx.orgId, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
    select: { id: true },
  });
  if (!lead) return "not_found";

  // a sugestão (contrato/visita/lead) tem que pertencer a ESSE lead — não se grava nota arbitrária
  const owns =
    kind === "lead_frio" ? entityId === leadId
    : kind === "contrato" ? await db.contract.findFirst({ where: { id: entityId, organizationId: ctx.orgId, proposal: { leadId } }, select: { id: true } })
    : await db.visit.findFirst({ where: { id: entityId, organizationId: ctx.orgId, leadId }, select: { id: true } });
  if (!owns) return "not_found";

  // não duplica: já resolvida dentro da janela → não grava outra
  const key = agentKey(kind, entityId);
  const since = new Date(+now - DONE_WINDOW_DAYS[kind] * DAY);
  const existing = await db.activity.findFirst({
    where: { leadId, type: "NOTE", createdAt: { gte: since }, payload: { path: ["agentKey"], equals: key } },
    select: { id: true },
  });
  if (existing) return "duplicate";

  await db.activity.create({
    data: {
      leadId, type: "NOTE", createdAt: now,
      payload: { note: `Agente do dia: ${LABEL[kind]} — ${outcome === "done" ? "feito" : "dispensado"}`, by: ctx.author, agentKey: key, outcome },
    },
  });
  return "created";
}
