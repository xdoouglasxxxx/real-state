/** Cenário sintético (duas imobiliárias, 2 corretores) usado pelos testes do Agente do dia. */
import { agentKey } from "../../../src/lib/agent-day";

export const NOW = new Date("2026-11-12T20:00:00Z"); // quinta, 17h em Brasília
export const U = (s: string) => new Date(s);
export const H = 3600000;
export const DAY = 86400000;
export const dayEnd = new Date(NOW); dayEnd.setHours(23, 59, 59, 999); // fim do dia no horário do servidor (regra das tarefas)

export const contact = (id: string, name: string, phone: string | null) => ({ id, organizationId: "o1", name, phone });
export const lead = (id: string, o: Record<string, any> = {}) => ({ id, organizationId: "o1", contactId: "C1", propertyId: null, agentId: "A1", stage: "NEW", createdAt: U("2026-10-01T15:00:00Z"), updatedAt: U("2026-11-05T15:00:00Z"), ...o });
export const visit = (id: string, o: Record<string, any> = {}) => ({ id, organizationId: "o1", propertyId: "P3", leadId: null, contactId: null, agentId: "A1", status: "SCHEDULED", scheduledAt: U("2026-11-13T13:00:00Z"), ...o });

export const build = () => ({
  agent: [{ id: "A1", organizationId: "o1", name: "Ana" }, { id: "A2", organizationId: "o1", name: "Beto" }],
  contact: [
    contact("C1", "Fernanda Ryu", "(11) 98765-4321"), contact("C2", "Paulo Nunes", null), contact("C3", "Carla Mendes", "11 91234-5678"),
    contact("C4", "MARIANA COSTA", "(11) 99999-0000"), contact("C5", "João Alves", "(21) 98888-7777"), contact("C6", "Otávio Lima", "(11) 97777-1111"),
  ],
  property: [
    { id: "P1", organizationId: "o1", title: "Garden Moema", status: "FOR_SALE", createdAt: U("2026-07-01T15:00:00Z"), agentId: "A1" },       // parado
    { id: "P2", organizationId: "o1", title: "Penthouse Horizonte", status: "EXCLUSIVE", createdAt: U("2026-08-01T15:00:00Z"), agentId: "A2" }, // teve visita há 23 dias
    { id: "P3", organizationId: "o1", title: "Loft Jardins", status: "FOR_SALE", createdAt: U("2026-09-20T15:00:00Z"), agentId: "A1" },        // recente demais
    { id: "P4", organizationId: "o1", title: "Mansão Tamboré", status: "SOLD", createdAt: U("2026-01-01T15:00:00Z"), agentId: "A1" },          // vendido
    { id: "P5", organizationId: "o1", title: "Refúgio da Serra", status: "FOR_SALE", createdAt: U("2026-06-01T15:00:00Z"), agentId: "A2" },    // parado
    { id: "P6", organizationId: "o2", title: "Imóvel de outra org", status: "FOR_SALE", createdAt: U("2026-01-01T15:00:00Z"), agentId: "X1" },
  ],
  lead: [
    lead("L1"), lead("L2", { agentId: "A2", contactId: "C2" }), lead("L3", { contactId: "C3", stage: "VISIT" }),
    lead("L10", { contactId: "C4", propertyId: "P3", updatedAt: U("2026-11-05T15:00:00Z") }),                   // frio há 7 dias
    lead("L11", { agentId: "A2", contactId: "C5", stage: "CONTACTED", updatedAt: U("2026-11-08T15:00:00Z") }),   // frio há 4 dias
    lead("L12", { updatedAt: U("2026-11-10T15:00:00Z") }),                                                      // 2 dias: não está frio
    lead("L13", { stage: "VISIT", updatedAt: U("2026-10-01T15:00:00Z") }),                                      // etapa que não esfria
    lead("L14", { organizationId: "o2", agentId: "X1" }),                                                       // outra imobiliária
    lead("L15", { updatedAt: new Date(+NOW - 72 * H) }),                                                        // EXATAMENTE 72h: ainda não
    lead("L16", { contactId: "C6", updatedAt: new Date(+NOW - 72 * H - 1000) }),                               // 72h + 1s: frio
    lead("L20", { agentId: null, stage: "NEW", updatedAt: U("2026-11-12T10:00:00Z") }),                         // sem corretor
    lead("L21", { agentId: null, stage: "WON", updatedAt: U("2026-11-12T10:00:00Z") }),                         // sem corretor, mas já ganho
    lead("L22", { organizationId: "o2", agentId: null }),
  ],
  proposal: [
    { id: "PR1", organizationId: "o1", leadId: "L1", propertyId: "P1", contactId: "C1" },
    { id: "PR2", organizationId: "o1", leadId: "L2", propertyId: "P2", contactId: "C2" },
    { id: "PR3", organizationId: "o1", leadId: "L1", propertyId: "P3", contactId: "C1" },
    { id: "PR4", organizationId: "o1", leadId: null, propertyId: "P3", contactId: "C1" },
    { id: "PRX", organizationId: "o2", leadId: "L22", propertyId: "P6", contactId: "C1" },
  ],
  contract: [
    { id: "CT1", organizationId: "o1", proposalId: "PR1", status: "AWAITING_SIGNATURE", createdAt: U("2026-11-02T15:00:00Z") }, // 10 dias, lead da Ana
    { id: "CT2", organizationId: "o1", proposalId: "PR3", status: "AWAITING_SIGNATURE", createdAt: U("2026-11-09T15:00:00Z") }, // 3 dias: cedo
    { id: "CT3", organizationId: "o1", proposalId: "PR2", status: "AWAITING_SIGNATURE", createdAt: U("2026-10-20T15:00:00Z") }, // 23 dias, lead do Beto, cliente sem telefone
    { id: "CT4", organizationId: "o1", proposalId: "PR1", status: "SIGNED", createdAt: U("2026-10-01T15:00:00Z") },             // já assinado
    { id: "CT5", organizationId: "o2", proposalId: "PRX", status: "AWAITING_SIGNATURE", createdAt: U("2026-10-01T15:00:00Z") }, // outra org
    { id: "CT6", organizationId: "o1", proposalId: "PR4", status: "AWAITING_SIGNATURE", createdAt: U("2026-10-10T15:00:00Z") }, // proposta sem lead
  ],
  visit: [
    visit("V1", { leadId: "L3", contactId: "C3" }),                                                                  // amanhã 10h, da Ana
    visit("V2", { agentId: "A2", scheduledAt: U("2026-11-14T02:30:00Z"), propertyId: "P2" }),                         // amanhã 23h30 BRT (já é dia 14 em UTC)
    visit("V3", { scheduledAt: U("2026-11-13T02:30:00Z") }),                                                          // HOJE 23h30 BRT: não é amanhã
    visit("V4", { status: "DONE" }),                                                                                  // já feita
    visit("V5", { scheduledAt: U("2026-11-14T03:00:00Z") }),                                                          // 00h00 BRT do dia seguinte: depois de amanhã
    visit("V6", { leadId: "L1", scheduledAt: U("2026-11-13T15:00:00Z") }),                                            // sem contato na visita → usa o do lead
    visit("V7", { organizationId: "o2", agentId: "X1" }),
    visit("V8", { propertyId: "P2", scheduledAt: U("2026-10-20T15:00:00Z"), status: "DONE", agentId: "A2" }),         // a visita de 23 dias do P2
  ],
  task: [
    { id: "T1", organizationId: "o1", leadId: "L1", agentId: "A1", title: "Ligar para Fernanda", dueAt: new Date(+NOW - DAY), doneAt: null },
    { id: "T2", organizationId: "o1", leadId: "L1", agentId: "A1", title: "Enviar proposta", dueAt: new Date(+dayEnd - 1000), doneAt: null },
    { id: "T3", organizationId: "o1", leadId: "L1", agentId: "A1", title: "Só amanhã", dueAt: new Date(+dayEnd + 2000), doneAt: null },
    { id: "T4", organizationId: "o1", leadId: "L1", agentId: "A1", title: "Já feita", dueAt: new Date(+NOW - DAY), doneAt: new Date(+NOW - H) },
    { id: "T5", organizationId: "o1", leadId: "L2", agentId: "A2", title: "Tarefa do Beto", dueAt: new Date(+NOW - 2 * DAY), doneAt: null },
  ],
  activity: [
    { id: "N1", leadId: "L10", type: "NOTE", createdAt: new Date(+NOW - DAY), payload: { note: "x", agentKey: agentKey("lead_frio", "L10") } },       // resolvida há 1 dia → escondida
    { id: "N2", leadId: "L11", type: "NOTE", createdAt: new Date(+NOW - 5 * DAY), payload: { note: "x", agentKey: agentKey("lead_frio", "L11") } },  // há 5 dias → volta
    { id: "N3", leadId: "L1", type: "NOTE", createdAt: new Date(+NOW - DAY), payload: { note: "anotação comum, sem agentKey" } },
  ],
});
