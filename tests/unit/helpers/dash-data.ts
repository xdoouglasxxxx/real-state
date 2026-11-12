/** Dados sintéticos de duas imobiliárias (o1 e o2) usados pelos testes do dashboard. */
export const D = (s: string) => new Date(s + "T15:00:00Z");
export const NOW = new Date("2026-11-12T20:00:00Z"); // 17h em Brasília; mês = novembro/2026
export const lead = (id: string, org: string, agentId: string | null, createdAt: string, stage: string, source: string, updatedAt = createdAt) =>
  ({ id, organizationId: org, agentId, createdAt: D(createdAt), updatedAt: D(updatedAt), stage, source });
export const act = (leadId: string, to: string) => ({ id: "act-" + leadId + to, leadId, type: "STAGE_CHANGE", payload: { from: "x", to } });

export const DATA = {
  agent: [
    { id: "A1", organizationId: "o1", name: "Ana", isActive: true },
    { id: "A2", organizationId: "o1", name: "Beto", isActive: true },
    { id: "A3", organizationId: "o1", name: "Caio (saiu)", isActive: false },
    { id: "X1", organizationId: "o2", name: "Xavier", isActive: true },
  ],
  lead: [
    lead("L1", "o1", "A1", "2026-11-02", "WON", "SITE", "2026-11-08"),
    lead("L2", "o1", "A1", "2026-11-03", "LOST", "SITE"),
    lead("L3", "o1", "A2", "2026-11-05", "VISIT", "INSTAGRAM"),
    lead("L4", "o1", "A2", "2026-11-10", "NEW", "INSTAGRAM"),
    lead("L5", "o1", null, "2026-11-11", "NEW", "GOOGLE"),
    lead("L6", "o1", "A1", "2026-10-05", "CONTACTED", "SITE"),   // mês anterior, dentro do "mesmo tempo decorrido"
    lead("L7", "o1", "A1", "2026-10-20", "NEW", "SITE"),         // mês anterior, DEPOIS do mesmo tempo decorrido
    lead("L8", "o1", "A2", "2026-09-15", "NEW", "SITE"),         // setembro
    lead("L9", "o2", "X1", "2026-11-04", "NEW", "SITE"),         // OUTRA imobiliária
  ],
  activity: [act("L2", "CONTACTED"), act("L2", "VISIT"), act("L2", "LOST"), act("L3", "CONTACTED"), act("L9", "CONTRACT")],
  visit: [
    { id: "V1", organizationId: "o1", agentId: "A1", status: "DONE", scheduledAt: D("2026-11-04") },
    { id: "V2", organizationId: "o1", agentId: "A2", status: "DONE", scheduledAt: D("2026-11-06") },
    { id: "V3", organizationId: "o1", agentId: "A2", status: "DONE", scheduledAt: D("2026-10-08") },
    { id: "V4", organizationId: "o1", agentId: "A1", status: "SCHEDULED", scheduledAt: D("2026-11-20") },
    { id: "V5", organizationId: "o1", agentId: "A2", status: "SCHEDULED", scheduledAt: D("2026-11-25") },
    { id: "V6", organizationId: "o2", agentId: "X1", status: "DONE", scheduledAt: D("2026-11-05") },
  ],
  property: [
    { id: "P1", organizationId: "o1", agentId: "A1", status: "FOR_SALE", price: 1000000 },
    { id: "P2", organizationId: "o1", agentId: "A2", status: "EXCLUSIVE", price: 2500000 },
    { id: "P3", organizationId: "o1", agentId: "A1", status: "SOLD", price: 3000000 },
    { id: "P4", organizationId: "o2", agentId: "X1", status: "FOR_SALE", price: 9000000 },
  ],
  proposal: [
    { id: "PR1", organizationId: "o1", leadId: "L3", status: "SENT" },
    { id: "PR2", organizationId: "o1", leadId: "L1", status: "SENT" },
    { id: "PR3", organizationId: "o1", leadId: "L1", status: "ACCEPTED" },
    { id: "PR4", organizationId: "o1", leadId: null, status: "SENT" }, // sem lead: só entra no total
  ],
  contract: [
    { id: "C1", organizationId: "o1", proposalId: "PR3", status: "CLOSED", closedAt: D("2026-11-08"), totalAmount: 800000 },
    { id: "C2", organizationId: "o1", proposalId: "PR1", status: "AWAITING_SIGNATURE", closedAt: null, totalAmount: 400000 },
    { id: "C3", organizationId: "o1", proposalId: "PR2", status: "CLOSED", closedAt: D("2026-10-06"), totalAmount: 500000 },
    { id: "C4", organizationId: "o1", proposalId: "PR4", status: "CLOSED", closedAt: D("2026-11-09"), totalAmount: 200000 },
  ],
  goal: [
    { id: "G1", organizationId: "o1", agentId: null, year: 2026, month: 11, targetAmount: 1500000 },
    { id: "G2", organizationId: "o1", agentId: "A1", year: 2026, month: 11, targetAmount: 600000 },
    { id: "G3", organizationId: "o1", agentId: null, year: 2026, month: 10, targetAmount: 1000000 },
  ],
};
