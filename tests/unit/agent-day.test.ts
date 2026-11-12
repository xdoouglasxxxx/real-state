import { test } from "node:test";
import assert from "node:assert/strict";
import { getAgentDay, resolveSuggestion, brtDay, agentKey, DONE_WINDOW_DAYS } from "../../src/lib/agent-day";
import { makeFakeDb } from "./helpers/fake-db";
import { NOW, H, DAY, lead, build } from "./helpers/agent-data";

const mk = (data: any = build()) => ({ data, db: makeFakeDb(data) as any });
const day = (scope: any, org = "o1", data: any = build()) => getAgentDay(makeFakeDb(data) as any, org, scope, "Maison Estate", NOW);
const MGR = { agentId: null, isAgent: false };
const ids = (d: any, kind: string) => d.suggestions.filter((s: any) => s.kind === kind).map((s: any) => s.entityId ?? s.key);

test("brtDay: o dia de Brasília, inclusive na virada em que o UTC já é outro dia", () => {
  const t = brtDay(NOW, 1);
  assert.equal(t.from.toISOString(), "2026-11-13T03:00:00.000Z"); assert.equal(t.to.toISOString(), "2026-11-14T03:00:00.000Z");
  const late = new Date("2026-11-13T02:30:00Z"); // 23h30 de 12/11 em Brasília
  assert.equal(brtDay(late, 0).from.toISOString(), "2026-11-12T03:00:00.000Z");
  assert.equal(brtDay(late, 1).from.toISOString(), "2026-11-13T03:00:00.000Z");
});

test("gerente: contratos parados (5+ dias), do mais antigo ao mais novo, com dados do cliente e do imóvel", async () => {
  const d = await day(MGR);
  assert.deepEqual(ids(d, "contrato"), ["CT6", "CT3", "CT1"]);   // CT2 (3 dias), CT4 (assinado) e CT5 (outra org) ficam de fora
  const s = d.suggestions.find((x) => x.entityId === "CT1")!;
  assert.equal(s.title, "Contrato aguardando assinatura há 10 dias");
  assert.equal(s.why, "Fernanda Ryu · Garden Moema");
  assert.equal(s.leadId, "L1"); assert.equal(s.tag, "Urgente");
  assert.ok(s.wa!.startsWith("https://wa.me/5511987654321?text="));
  assert.ok(s.draft!.includes("Fernanda") && !s.draft!.includes("Ryu"));
  assert.equal(d.suggestions.find((x) => x.entityId === "CT3")!.wa, null, "cliente sem telefone: sem link do WhatsApp");
  assert.equal(d.suggestions.find((x) => x.entityId === "CT6")!.leadId, null, "proposta sem lead: não dá para marcar como feito");
});

test("visitas de amanhã no horário de Brasília (23h30 de hoje não conta; 00h do dia seguinte também não)", async () => {
  const d = await day(MGR);
  assert.deepEqual(ids(d, "visita"), ["V1", "V6", "V2"]);       // V3 (hoje 23h30), V4 (feita), V5 (depois de amanhã), V7 (outra org) fora
  const v1 = d.suggestions.find((x) => x.entityId === "V1")!;
  assert.equal(v1.title, "Visita amanhã: Loft Jardins"); assert.equal(v1.tag, "Amanhã");
  assert.ok(v1.draft!.includes("(sexta-feira, 13/11), às 10h") && v1.draft!.includes("Carla") && !v1.draft!.includes("Mendes"));
  assert.ok(d.suggestions.find((x) => x.entityId === "V2")!.draft!.includes("às 23h30"));
  const v6 = d.suggestions.find((x) => x.entityId === "V6")!;
  assert.equal(v6.why, "Fernanda Ryu", "sem contato na visita, usa o contato do lead");
});

test("leads esfriando: novo/contatado sem movimento há 72h+ (limite exato), só da imobiliária, sem os já resolvidos", async () => {
  const d = await day(MGR);
  assert.deepEqual(ids(d, "lead_frio"), ["L1", "L2", "L11", "L16"]);   // L10 resolvida há 1 dia; L12 (2 dias), L13 (etapa), L14 (outra org), L15 (72h exatas) fora
  const l1 = d.suggestions.find((x) => x.entityId === "L1")!;
  assert.equal(l1.title, "Fernanda Ryu está sem movimento há 7 dias"); assert.equal(l1.why, "Novo · sem imóvel de interesse");
  assert.equal(d.suggestions.find((x) => x.entityId === "L11")!.why, "Contatado · sem imóvel de interesse");
  assert.equal(d.suggestions.find((x) => x.entityId === "L16")!.title.startsWith("Otávio Lima está sem movimento há 3 dias"), true);
  assert.ok(d.suggestions.find((x) => x.entityId === "L16")!.draft!.includes("Otávio") && !d.suggestions.find((x) => x.entityId === "L16")!.draft!.includes("Lima"));
  assert.equal(d.coldShown, 4); assert.equal(d.coldTotal, 4); assert.equal(d.hiddenCount, 1);
});

test("sugestão resolvida: some por 3 dias (lead/contrato) e volta depois; a anotação comum não esconde nada", async () => {
  const d = await day(MGR);
  assert.ok(!ids(d, "lead_frio").includes("L10"), "resolvida há 1 dia: escondida");
  assert.ok(ids(d, "lead_frio").includes("L11"), "resolvida há 5 dias: já voltou");
  assert.ok(ids(d, "lead_frio").includes("L1"), "anotação sem agentKey não esconde");
  assert.equal(DONE_WINDOW_DAYS.lead_frio, 3); assert.equal(DONE_WINDOW_DAYS.visita, 30);
});

test("imóveis sem visita: mesma regra do dashboard (90+ dias, nenhuma visita nos últimos 90) + atalho para o mapa filtrado", async () => {
  const d = await day(MGR);
  const s = d.suggestions.find((x) => x.kind === "imoveis_parados")!;
  assert.equal(s.title, "2 imóveis há 90+ dias sem nenhuma visita");
  assert.equal(s.why, "Refúgio da Serra, Garden Moema — revise preço, fotos e destaque.");   // P2 teve visita; P3 é recente; P4 vendido; P6 outra org
  assert.equal(s.href, "/painel/mapa?filtro=parado"); assert.equal(s.hrefLabel, "Ver no mapa");
  assert.equal(s.draft, null); assert.equal(s.leadId, null);
});

test("leads sem corretor: só para gerente/admin, e só os ainda ativos", async () => {
  const d = await day(MGR);
  assert.equal(d.suggestions.find((x) => x.kind === "sem_corretor")!.title, "1 lead sem corretor responsável");
  const a = await day({ agentId: "A1", isAgent: true });
  assert.equal(a.suggestions.find((x) => x.kind === "sem_corretor"), undefined);
});

test("tarefas: vencidas e de hoje, não concluídas, da imobiliária; amanhã e feitas ficam de fora", async () => {
  const d = await day(MGR);
  assert.deepEqual(d.tasks.map((t) => t.id), ["T5", "T1", "T2"]);
  assert.deepEqual(d.tasks.map((t) => t.overdue), [true, true, false]);
  assert.equal(d.tasks[1].contactName, "Fernanda Ryu"); assert.equal(d.tasks[1].leadId, "L1");
});

test("ordem: contratos, visitas, leads esfriando, sem corretor, imóveis parados", async () => {
  const d = await day(MGR);
  const kinds = d.suggestions.map((s) => s.kind);
  const order = ["contrato", "visita", "lead_frio", "sem_corretor", "imoveis_parados"];
  const first = order.map((k) => kinds.indexOf(k as any));
  assert.deepEqual([...first].sort((a, b) => a - b), first, "cada tipo aparece depois do mais urgente");
  assert.ok(d.suggestions.every((s, i, a) => i === 0 || a[i - 1].priority <= s.priority));
});

test("CORRETOR vê só o que é dele: leads, visitas, contratos dos seus leads, imóveis e tarefas", async () => {
  const d = await day({ agentId: "A1", isAgent: true });
  assert.deepEqual(ids(d, "contrato"), ["CT1"]);            // CT3 é de lead do Beto; CT6 não tem lead
  assert.deepEqual(ids(d, "visita"), ["V1", "V6"]);         // V2 é do Beto
  assert.deepEqual(ids(d, "lead_frio"), ["L1", "L16"]);     // L2 e L11 são do Beto; L10 resolvida
  assert.equal(d.suggestions.find((x) => x.kind === "imoveis_parados")!.title, "1 imóvel há 90+ dias sem nenhuma visita");
  assert.deepEqual(d.tasks.map((t) => t.id), ["T1", "T2"]);  // T5 é do Beto
  assert.equal(d.hiddenCount, 1);
  const b = await day({ agentId: "A2", isAgent: true });
  assert.deepEqual(ids(b, "contrato"), ["CT3"]); assert.deepEqual(ids(b, "visita"), ["V2"]); assert.deepEqual(ids(b, "lead_frio"), ["L2", "L11"]);
  assert.deepEqual(b.tasks.map((t) => t.id), ["T5"]);
});

test("corretor SEM vínculo com perfil de corretor: nada (nunca os dados da imobiliária)", async () => {
  const d = await day({ agentId: null, isAgent: true });
  assert.deepEqual(d.suggestions, []); assert.deepEqual(d.tasks, []);
});

test("ISOLAMENTO: imobiliária B só enxerga o dela", async () => {
  const d = await day(MGR, "o2");
  const all = d.suggestions.map((s) => s.entityId ?? s.key).sort();
  assert.deepEqual(all, ["CT5", "L14", "L22", "V7", "agente:imoveis_parados", "agente:sem_corretor"].sort());
  const mine = await day(MGR);
  for (const x of ["CT5", "L14", "L22", "V7"]) assert.ok(!mine.suggestions.some((s) => s.entityId === x), `${x} vazou para a outra imobiliária`);
});

test("limite de leads esfriando: mostra os 8 mais antigos e informa o total", async () => {
  const data = build();
  data.lead = Array.from({ length: 12 }, (_, i) => lead("F" + i, { updatedAt: new Date(+NOW - (10 + i) * DAY) })) as any; // F11 é o mais antigo
  data.activity = [] as any;
  const d = await day(MGR, "o1", data);
  assert.equal(d.coldShown, 8); assert.equal(d.coldTotal, 12);
  assert.deepEqual(ids(d, "lead_frio"), ["F11", "F10", "F9", "F8", "F7", "F6", "F5", "F4"]);
  // resolvendo os 2 mais antigos, entram os seguintes e o total cai
  data.activity = [11, 10].map((n) => ({ id: "n" + n, leadId: "F" + n, type: "NOTE", createdAt: new Date(+NOW - H), payload: { agentKey: agentKey("lead_frio", "F" + n) } })) as any;
  const d2 = await day(MGR, "o1", data);
  assert.deepEqual(ids(d2, "lead_frio"), ["F9", "F8", "F7", "F6", "F5", "F4", "F3", "F2"]);
  assert.equal(d2.coldTotal, 10); assert.equal(d2.hiddenCount, 2);
});

// ----------------------------------------------------------------- resolveSuggestion
const MGR_CTX = { orgId: "o1", agentId: null, isAgent: false, author: "gerente@maison.com" };
const A1_CTX = { orgId: "o1", agentId: "A1", isAgent: true, author: "ana@maison.com" };
const notesFor = (data: any, leadId: string) => data.activity.filter((a: any) => a.leadId === leadId && a.payload?.agentKey);

test("resolver: 'feito' grava UMA anotação na timeline com autor, chave e resultado", async () => {
  const { data, db } = mk();
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "lead_frio", entityId: "L1", leadId: "L1", outcome: "done" }, NOW), "created");
  const n = notesFor(data, "L1");
  assert.equal(n.length, 1);
  assert.deepEqual(n[0].payload, { note: "Agente do dia: contato com lead esfriando — feito", by: "gerente@maison.com", agentKey: "agente:lead_frio:L1", outcome: "done" });
  assert.equal(+n[0].createdAt, +NOW);
});

test("resolver: não duplica (duplo clique, recarregar, dispensar depois de feito)", async () => {
  const { data, db } = mk();
  const input = { kind: "contrato", entityId: "CT1", leadId: "L1" };
  assert.equal(await resolveSuggestion(db, MGR_CTX, { ...input, outcome: "done" }, NOW), "created");
  assert.equal(await resolveSuggestion(db, MGR_CTX, { ...input, outcome: "done" }, NOW), "duplicate");
  assert.equal(await resolveSuggestion(db, MGR_CTX, { ...input, outcome: "dismiss" }, NOW), "duplicate", "o primeiro resultado vale");
  assert.equal(notesFor(data, "L1").filter((a: any) => a.payload.agentKey === "agente:contrato:CT1").length, 1);
});

test("resolver: passada a janela, a sugestão pode ser resolvida de novo (lead 3 dias; visita 30)", async () => {
  const { data, db } = mk();
  data.activity.push({ id: "old1", leadId: "L1", type: "NOTE", createdAt: new Date(+NOW - 4 * DAY), payload: { agentKey: "agente:lead_frio:L1" } });
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "lead_frio", entityId: "L1", leadId: "L1", outcome: "done" }, NOW), "created");
  data.activity.push({ id: "old2", leadId: "L3", type: "NOTE", createdAt: new Date(+NOW - 20 * DAY), payload: { agentKey: "agente:visita:V1" } });
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "visita", entityId: "V1", leadId: "L3", outcome: "done" }, NOW), "duplicate", "visita: janela de 30 dias");
});

test("resolver: entradas inválidas são recusadas sem gravar nada", async () => {
  const { data, db } = mk(); const n0 = data.activity.length;
  for (const bad of [
    { kind: "foo", entityId: "L1", leadId: "L1", outcome: "done" }, { kind: "lead_frio", entityId: "L1", leadId: "L1", outcome: "talvez" },
    { kind: "lead_frio", entityId: "", leadId: "L1", outcome: "done" }, { kind: "lead_frio", entityId: "L1", leadId: "", outcome: "done" },
    { kind: "imoveis_parados", entityId: "x", leadId: "L1", outcome: "done" },   // só tipos ligados a um lead podem ser resolvidos
  ]) assert.equal(await resolveSuggestion(db, MGR_CTX, bad, NOW), "invalid", JSON.stringify(bad));
  assert.equal(data.activity.length, n0);
});

test("resolver: SEGURANÇA — lead de outra imobiliária, lead de outro corretor e entidade que não é daquele lead", async () => {
  const { data, db } = mk(); const n0 = data.activity.length;
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "lead_frio", entityId: "L14", leadId: "L14", outcome: "done" }, NOW), "not_found");          // outra org
  assert.equal(await resolveSuggestion(db, A1_CTX, { kind: "lead_frio", entityId: "L2", leadId: "L2", outcome: "done" }, NOW), "not_found");            // lead do Beto
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "contrato", entityId: "CT3", leadId: "L1", outcome: "done" }, NOW), "not_found");          // CT3 é do L2
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "visita", entityId: "V2", leadId: "L1", outcome: "done" }, NOW), "not_found");             // V2 não tem lead
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "lead_frio", entityId: "L2", leadId: "L1", outcome: "done" }, NOW), "not_found");          // entidade ≠ lead
  assert.equal(await resolveSuggestion(db, { ...A1_CTX, agentId: null }, { kind: "lead_frio", entityId: "L1", leadId: "L1", outcome: "done" }, NOW), "not_found"); // corretor sem vínculo
  assert.equal(data.activity.length, n0, "nada foi gravado");
});

test("resolver: gerente resolve de qualquer corretor; dois leads diferentes não colidem", async () => {
  const { data, db } = mk();
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "lead_frio", entityId: "L2", leadId: "L2", outcome: "dismiss" }, NOW), "created");
  assert.equal(await resolveSuggestion(db, MGR_CTX, { kind: "lead_frio", entityId: "L1", leadId: "L1", outcome: "dismiss" }, NOW), "created");
  assert.equal(notesFor(data, "L2")[0].payload.note, "Agente do dia: contato com lead esfriando — dispensado");
});

test("integração: depois de resolver, a sugestão some do dia (e só ela)", async () => {
  const { data, db } = mk();
  const before = await getAgentDay(db, "o1", { agentId: "A1", isAgent: true }, "Maison Estate", NOW);
  assert.ok(ids(before, "contrato").includes("CT1") && ids(before, "visita").includes("V1"));
  assert.equal(await resolveSuggestion(db, A1_CTX, { kind: "contrato", entityId: "CT1", leadId: "L1", outcome: "done" }, NOW), "created");
  assert.equal(await resolveSuggestion(db, A1_CTX, { kind: "visita", entityId: "V1", leadId: "L3", outcome: "dismiss" }, NOW), "created");
  const after = await getAgentDay(db, "o1", { agentId: "A1", isAgent: true }, "Maison Estate", NOW);
  assert.ok(!ids(after, "contrato").includes("CT1") && !ids(after, "visita").includes("V1"));
  assert.deepEqual(ids(after, "visita"), ["V6"]); assert.deepEqual(ids(after, "lead_frio"), ["L1", "L16"]);
  assert.equal(after.hiddenCount, before.hiddenCount + 2);
  // a nota do corretor Ana não esconde nada para o Beto
  const beto = await getAgentDay(db, "o1", { agentId: "A2", isAgent: true }, "Maison Estate", NOW);
  assert.deepEqual(ids(beto, "contrato"), ["CT3"]);
  void data;
});

test("o banco de mentira acusa campo inexistente em consulta do agente (rede de segurança)", async () => {
  const { db } = mk();
  await assert.rejects(() => db.lead.count({ where: { organizacaoId: "o1" } }), /não existe/);
});
