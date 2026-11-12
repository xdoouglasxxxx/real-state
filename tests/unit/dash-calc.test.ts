import { test } from "node:test";
import assert from "node:assert/strict";
import { pctChange, rate, paceProjection, buildSources, mergeRanking } from "../../src/lib/dash-calc";

test("pctChange", () => {
  assert.equal(pctChange(12, 10), 20); assert.equal(pctChange(5, 10), -50); assert.equal(pctChange(10, 10), 0);
  assert.equal(pctChange(0, 0), 0); assert.equal(pctChange(4, 0), 100); assert.equal(pctChange(0, 5), -100);
});
test("rate: sem divisão por zero", () => {
  assert.equal(rate(1, 3), 33); assert.equal(rate(2, 3), 67); assert.equal(rate(5, 0), 0); assert.equal(rate(0, 0), 0);
});
test("paceProjection", () => {
  assert.equal(paceProjection(500, 0.5), 1000); assert.equal(paceProjection(0, 0.5), 0);
  assert.equal(paceProjection(500, 0), 0); assert.equal(paceProjection(300, 1), 300);
});
test("buildSources: ordena, calcula % e conta vendas", () => {
  const rows = [
    ...Array(6).fill(0).map((_, i) => ({ source: "SITE", won: i === 0 })),
    ...Array(3).fill(0).map(() => ({ source: "INSTAGRAM", won: false })),
    { source: "GOOGLE", won: true },
  ];
  const s = buildSources(rows);
  assert.deepEqual(s.map((x) => x.source), ["SITE", "INSTAGRAM", "GOOGLE"]);
  assert.deepEqual(s.map((x) => x.share), [60, 30, 10]);
  assert.equal(s[0].won, 1); assert.equal(s[2].won, 1);
});
test("buildSources: o excedente do top vira OUTRO e o total fecha", () => {
  const names = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const rows = names.flatMap((n, i) => Array(names.length - i).fill(0).map(() => ({ source: n, won: false })));
  const s = buildSources(rows, 3);
  assert.equal(s.length, 4); assert.equal(s[3].source, "OUTRO");
  assert.equal(s.reduce((a, b) => a + b.count, 0), rows.length);
  assert.equal(buildSources([]).length, 0);
});
test("mergeRanking: junta, ordena (vendas > visitas > leads) e descarta quem zerou", () => {
  const agents = [{ id: "a", name: "Ana" }, { id: "b", name: "Beto" }, { id: "c", name: "Caio" }, { id: "d", name: "Dani" }];
  const r = mergeRanking(agents,
    [{ agentId: "a", _count: 9 }, { agentId: "b", _count: 4 }, { agentId: null, _count: 7 }],
    [{ agentId: "a", _count: 2 }, { agentId: "c", _count: 5 }],
    [{ agentId: "b", _count: 1 }]);
  assert.deepEqual(r.map((x) => x.name), ["Beto", "Caio", "Ana"]); // Dani (zerada) fora; lead sem corretor ignorado
  assert.deepEqual(r[0], { id: "b", name: "Beto", leads: 4, visits: 0, won: 1 });
});
