import { test } from "node:test";
import assert from "node:assert/strict";
import { getDashboardPeriod, getAgentOptions } from "../../src/lib/dashboard";
import { makeFakeDb } from "./helpers/fake-db";
import { DATA, NOW, D, lead } from "./helpers/dash-data";

const db = makeFakeDb(DATA) as any;
const run = (period: "mes" | "tri" | "ano", agentId: string | null = null, org = "o1") => getDashboardPeriod(db, org, { period, agentId }, NOW);

test("mês, todos os corretores: números do período", async () => {
  const d = await run("mes");
  assert.equal(d.label, "novembro de 2026");
  assert.equal(d.newLeads, 5);            // L1..L5; L9 é de outra imobiliária
  assert.equal(d.newLeadsPrev, 1);        // só L6 (L7 é depois do mesmo tempo decorrido)
  assert.equal(d.visitsDone, 2); assert.equal(d.visitsDonePrev, 1);
  assert.equal(d.sold, 2); assert.equal(d.soldPrev, 1);
  assert.equal(d.realizado, 1000000);     // C1 + C4
  assert.equal(d.meta, 1500000); assert.equal(d.goalPct, 67);
  assert.equal(d.conversion, 20);         // 1 venda em 5 leads criados no mês
  assert.deepEqual(d.range, { ini: "2026-11-01 03:00:00+00", fim: "2026-11-12 20:00:00+00", pini: "2026-10-01 03:00:00+00", pfim: "2026-10-12 20:00:00+00" });
});

test("mês: números de AGORA (não dependem do período)", async () => {
  const d = await run("mes");
  assert.equal(d.availableCount, 2); assert.equal(d.availableValue, 3500000); // P3 vendido e P4 de outra org ficam fora
  assert.equal(d.scheduledVisits, 2);
  assert.equal(d.awaitingContracts, 1);
  assert.equal(d.openProposals, 3);       // PR1, PR2, PR4
  const t = await run("tri"); assert.equal(t.availableCount, 2); assert.equal(t.scheduledVisits, 2); assert.equal(t.openProposals, 3);
});

test("funil: de quem foi criado no período, quantos CHEGARAM em cada etapa (perdido conta até onde foi)", async () => {
  const d = await run("mes");
  assert.deepEqual(d.funnel.map((s) => s.count), [5, 3, 3, 1, 1, 1, 1]);
  assert.deepEqual(d.funnel.map((s) => s.pctOfPrev), [null, 60, 100, 33, 100, 100, 100]);
  assert.deepEqual(d.worst, { fromIndex: 0, toIndex: 1, pct: 60 }); // só a 1ª passagem tem base ≥ 5
});

test("origem dos leads do período, com % e vendas", async () => {
  const d = await run("mes");
  assert.deepEqual(d.sources, [
    { source: "INSTAGRAM", count: 2, won: 0, share: 40 },
    { source: "SITE", count: 2, won: 1, share: 40 },
    { source: "GOOGLE", count: 1, won: 0, share: 20 },
  ]);
});

test("ranking: todos os corretores, ordenado, sem quem não teve nada", async () => {
  const d = await run("mes");
  assert.deepEqual(d.ranking, [
    { id: "A1", name: "Ana", leads: 2, visits: 1, won: 1 },
    { id: "A2", name: "Beto", leads: 2, visits: 1, won: 0 },
  ]);
});

test("filtro por corretor: tudo passa a ser DELE (leads, visitas, imóveis, propostas, contratos, meta)", async () => {
  const d = await run("mes", "A1");
  assert.equal(d.newLeads, 2); assert.equal(d.newLeadsPrev, 1);
  assert.equal(d.visitsDone, 1); assert.equal(d.visitsDonePrev, 0);
  assert.equal(d.sold, 1); assert.equal(d.realizado, 800000); assert.equal(d.soldPrev, 1); // C4 (proposta sem lead) sai
  assert.equal(d.meta, 600000); assert.equal(d.goalPct, 100);                               // meta DELE; 133% limitado a 100
  assert.equal(d.conversion, 50);
  assert.equal(d.availableCount, 1); assert.equal(d.availableValue, 1000000);
  assert.equal(d.scheduledVisits, 1); assert.equal(d.openProposals, 1); assert.equal(d.awaitingContracts, 0);
  assert.deepEqual(d.funnel.map((s) => s.count), [2, 2, 2, 1, 1, 1, 1]);
  assert.deepEqual(d.sources, [{ source: "SITE", count: 2, won: 1, share: 100 }]);
  assert.equal(d.ranking.length, 2, "o ranking continua mostrando todos, para dar para trocar de filtro");
});

test("filtro por outro corretor", async () => {
  const d = await run("mes", "A2");
  assert.equal(d.newLeads, 2); assert.equal(d.awaitingContracts, 1); assert.equal(d.openProposals, 1);
  assert.equal(d.sold, 0); assert.equal(d.meta, 0); assert.equal(d.goalPct, 0);
});

test("trimestre: soma as metas dos 3 meses e as vendas do trimestre", async () => {
  const d = await run("tri");
  assert.equal(d.label, "4º trimestre de 2026");
  assert.equal(d.meta, 2500000);          // G1 (nov) + G3 (out); dezembro sem meta
  assert.equal(d.sold, 3); assert.equal(d.realizado, 1500000); // C1 + C3 + C4
  assert.equal(d.newLeads, 7);            // L1..L7 (L8 é de setembro)
});

test("ano: comparação com o ano anterior vazio não quebra", async () => {
  const d = await run("ano");
  assert.equal(d.newLeads, 8); assert.equal(d.newLeadsPrev, 0); assert.equal(d.soldPrev, 0);
});

test("ISOLAMENTO: nada de outra imobiliária vaza, nem com id de corretor alheio", async () => {
  const other = await run("mes", null, "o2");
  assert.equal(other.newLeads, 1); assert.equal(other.availableCount, 1); assert.equal(other.visitsDone, 1);
  assert.deepEqual(other.funnel.map((s) => s.count), [1, 1, 1, 1, 1, 1, 0]); // histórico L9 → CONTRACT
  const cross = await run("mes", "X1", "o1"); // corretor de o2 consultado em o1
  assert.equal(cross.newLeads, 0); assert.equal(cross.availableCount, 0); assert.equal(cross.sold, 0);
  assert.equal(cross.funnel[0].count, 0); assert.equal(cross.worst, null);
});

test("imobiliária vazia: tudo zero, sem NaN e sem erro", async () => {
  const d = await run("mes", null, "o-nova");
  for (const k of ["newLeads", "newLeadsPrev", "visitsDone", "sold", "realizado", "meta", "goalPct", "conversion", "availableCount", "availableValue"] as const) assert.equal(d[k], 0, k);
  assert.deepEqual(d.ranking, []); assert.deepEqual(d.sources, []); assert.equal(d.worst, null);
  assert.ok(d.funnel.every((s) => Number.isFinite(s.pctOfTotal)));
});

test("a janela do mês respeita Brasília: lead criado às 23h do último dia do mês passado não é de novembro", async () => {
  const edge = makeFakeDb({ ...DATA, lead: [
    { ...lead("E1", "o1", "A1", "2026-11-01", "NEW", "SITE"), createdAt: new Date("2026-11-01T02:59:00Z") }, // 31/out 23:59 em BRT
    { ...lead("E2", "o1", "A1", "2026-11-01", "NEW", "SITE"), createdAt: new Date("2026-11-01T03:00:00Z") }, // 1/nov 00:00 em BRT
  ] }) as any;
  const d = await getDashboardPeriod(edge, "o1", { period: "mes", agentId: null }, NOW);
  assert.equal(d.newLeads, 1);
});

test("getAgentOptions: ordena por nome e marca inativos, só da própria imobiliária", async () => {
  const opts = await getAgentOptions(db, "o1");
  assert.deepEqual(opts.map((o) => o.name), ["Ana", "Beto", "Caio (saiu) (inativo)"]);
});

test("o banco de mentira acusa campo inexistente (a rede de segurança funciona)", async () => {
  await assert.rejects(() => (db as any).lead.count({ where: { organizacaoId: "o1" } }), /não existe/);
});
