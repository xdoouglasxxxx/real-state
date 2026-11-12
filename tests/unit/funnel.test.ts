import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFunnel, maxStageIndex, worstStep, FUNNEL_STAGES } from "../../src/lib/funnel";

const counts = (s: ReturnType<typeof buildFunnel>) => s.map((x) => x.count);

test("lead só entrou: conta apenas no 1º degrau", () => {
  assert.deepEqual(counts(buildFunnel([{ id: "a", stage: "NEW" }], [])), [1, 0, 0, 0, 0, 0, 0]);
});

test("lead na etapa atual conta em todas as anteriores", () => {
  assert.deepEqual(counts(buildFunnel([{ id: "a", stage: "PROPOSAL" }], [])), [1, 1, 1, 1, 0, 0, 0]);
  assert.deepEqual(counts(buildFunnel([{ id: "a", stage: "WON" }], [])), [1, 1, 1, 1, 1, 1, 1]);
});

test("lead PERDIDO conta até onde chegou (histórico), não some do funil", () => {
  const f = buildFunnel([{ id: "a", stage: "LOST" }], [
    { leadId: "a", to: "CONTACTED" }, { leadId: "a", to: "VISIT" }, { leadId: "a", to: "LOST" },
  ]);
  assert.deepEqual(counts(f), [1, 1, 1, 0, 0, 0, 0]);
});

test("lead perdido sem histórico entra só como lead", () => {
  assert.deepEqual(counts(buildFunnel([{ id: "a", stage: "LOST" }], [])), [1, 0, 0, 0, 0, 0, 0]);
});

test("lead que VOLTOU de etapa continua contando onde já chegou", () => {
  const f = buildFunnel([{ id: "a", stage: "CONTACTED" }], [{ leadId: "a", to: "PROPOSAL" }, { leadId: "a", to: "CONTACTED" }]);
  assert.deepEqual(counts(f), [1, 1, 1, 1, 0, 0, 0]);
});

test("histórico de OUTRO lead não vaza", () => {
  const f = buildFunnel([{ id: "a", stage: "NEW" }, { id: "b", stage: "NEW" }], [{ leadId: "b", to: "CONTRACT" }]);
  assert.deepEqual(counts(f), [2, 1, 1, 1, 1, 1, 0]);
});

test("estágio desconhecido não quebra nem avança o lead", () => {
  assert.equal(maxStageIndex("???", ["", "xx"]), 0);
  assert.equal(maxStageIndex("LOST", []), 0);
  assert.equal(maxStageIndex("VISIT", ["CONTACTED"]), 2);
});

test("a contagem nunca aumenta de um degrau para o seguinte (monotônico)", () => {
  const stages = ["NEW", "CONTACTED", "VISIT", "PROPOSAL", "FINANCING", "CONTRACT", "WON", "LOST"];
  const leads = Array.from({ length: 200 }, (_, i) => ({ id: "l" + i, stage: stages[(i * 7) % stages.length] }));
  const changes = leads.filter((_, i) => i % 3 === 0).map((l, i) => ({ leadId: l.id, to: stages[(i * 5) % 7] }));
  const c = counts(buildFunnel(leads, changes));
  for (let k = 1; k < c.length; k++) assert.ok(c[k] <= c[k - 1], `degrau ${k}: ${c}`);
  assert.equal(c[0], 200);
});

test("percentuais: do anterior e do total; sem dividir por zero", () => {
  const leads = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: "n" + i, stage: "NEW" })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: "c" + i, stage: "CONTACTED" })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: "v" + i, stage: "VISIT" })),
  ];
  const f = buildFunnel(leads, []);
  assert.deepEqual(counts(f).slice(0, 4), [16, 6, 2, 0]);
  assert.equal(f[0].pctOfPrev, null);
  assert.equal(f[1].pctOfPrev, 38);   // 6/16
  assert.equal(f[2].pctOfPrev, 33);   // 2/6
  assert.equal(f[3].pctOfPrev, 0);
  assert.equal(f[4].pctOfPrev, 0);    // anterior zerado → 0, não NaN
  assert.equal(f[2].pctOfTotal, 13);  // 2/16
  assert.ok(f.every((s) => Number.isFinite(s.pctOfTotal)));
});

test("sem leads: tudo zero, sem NaN", () => {
  const f = buildFunnel([], []);
  assert.equal(f.length, FUNNEL_STAGES.length);
  assert.ok(f.every((s) => s.count === 0 && s.pctOfTotal === 0 && s.pctOfPrev !== NaN));
  assert.equal(worstStep(f), null);
});

test("worstStep: a passagem com menor conversão; ignora degraus sem base", () => {
  const leads = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: "n" + i, stage: "NEW" })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: "c" + i, stage: "CONTACTED" })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: "v" + i, stage: "VISIT" })),
    ...Array.from({ length: 1 }, (_, i) => ({ id: "p" + i, stage: "PROPOSAL" })),
  ];
  const w = worstStep(buildFunnel(leads, []))!;
  assert.deepEqual([w.fromIndex, w.toIndex], [2, 3]); // Visitas → Propostas: 1 de 6
  assert.equal(w.pct, 17);
});

test("worstStep: amostra pequena (base < 5) não vira 'maior perda'", () => {
  // 1 proposta que não virou financiamento = 0%, mas base 1 é ruído; vale Visitas → Propostas (1 de 6)
  const leads = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: "n" + i, stage: "NEW" })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: "v" + i, stage: "VISIT" })),
    { id: "p", stage: "PROPOSAL" },
  ];
  const f = buildFunnel(leads, []);
  assert.equal(f[4].pctOfPrev, 0);
  const w = worstStep(f)!;
  assert.deepEqual([w.fromIndex, w.toIndex], [2, 3]);
});

test("worstStep: sem base suficiente em lugar nenhum, cai na menor conversão com base > 0", () => {
  const f = buildFunnel([{ id: "a", stage: "CONTACTED" }, { id: "b", stage: "NEW" }, { id: "c", stage: "NEW" }], []);
  const w = worstStep(f)!;
  assert.ok(w && w.toIndex >= 1 && w.pct >= 0);
});
