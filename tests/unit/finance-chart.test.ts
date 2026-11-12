import { test } from "node:test";
import assert from "node:assert/strict";
import { chartWindow, niceStep, buildScale, getFinanceSeries, monthIndex, monthKey } from "../../src/lib/finance-chart";
import { makeFakeDb } from "./helpers/fake-db";

// Datas em horário LOCAL de propósito: o módulo usa o horário do servidor (como KPIs e DRE do Financeiro).
const L = (y: number, m: number, d: number, h = 12, mi = 0, s = 0, ms = 0) => new Date(y, m - 1, d, h, mi, s, ms);
const NOW = L(2026, 11, 12, 17);
const e = (id: string, org: string, direction: "IN" | "OUT", amount: number, paidAt: Date | null) => ({ id, organizationId: org, direction, amount, paidAt });

const db = makeFakeDb({
  financeEntry: [
    e("F1", "o1", "IN", 1000, L(2026, 11, 3)),
    e("F2", "o1", "OUT", 400, L(2026, 11, 10)),
    e("F3", "o1", "IN", 500, L(2026, 10, 31, 23, 59, 59)),      // último segundo de outubro → outubro
    e("F4", "o1", "IN", 700, L(2026, 11, 1, 0, 0, 0)),          // 1º instante de novembro → novembro
    e("F5", "o1", "OUT", 250, L(2026, 10, 15)),
    e("F6", "o1", "IN", 300, L(2025, 12, 20)),                  // 1º mês da janela
    e("F7", "o1", "IN", 999, L(2025, 11, 30)),                  // ANTES da janela
    e("F8", "o2", "IN", 5000, L(2026, 11, 5)),                  // OUTRA imobiliária
    e("F9", "o1", "IN", 800, null),                             // não pago: fora (é "previsto")
    e("F10", "o1", "OUT", 100, L(2026, 11, 30, 23, 59, 59, 500)), // fração depois do limite do KPI → fora, igual ao KPI
  ],
}) as any;
const run = (y: number, m: number, org = "o1", now = NOW) => getFinanceSeries(db, org, y, m, now);

test("chartWindow: termina no mês atual; mês futuro empurra para frente; mês antigo vira o 1º", () => {
  const cur = monthIndex(2026, 10);
  assert.deepEqual(chartWindow(cur, cur), { startIdx: cur - 11, endIdx: cur });
  assert.deepEqual(chartWindow(cur - 11, cur), { startIdx: cur - 11, endIdx: cur });   // limite: ainda cabe
  assert.deepEqual(chartWindow(cur - 12, cur), { startIdx: cur - 12, endIdx: cur - 1 }); // não cabe: vira o 1º
  assert.deepEqual(chartWindow(cur + 1, cur), { startIdx: cur - 10, endIdx: cur + 1 });
  assert.deepEqual(chartWindow(cur + 6, cur), { startIdx: cur - 5, endIdx: cur + 6 });
  for (const sel of [cur - 30, cur - 12, cur - 11, cur - 3, cur, cur + 1, cur + 9]) {
    const w = chartWindow(sel, cur);
    assert.equal(w.endIdx - w.startIdx, 11, "sempre 12 meses");
    assert.ok(sel >= w.startIdx && sel <= w.endIdx, `o mês selecionado (${sel}) sempre aparece`);
  }
});

test("niceStep e buildScale: escala redonda, sempre com o zero", () => {
  assert.equal(niceStep(0), 1); assert.equal(niceStep(-5), 1);
  assert.equal(niceStep(100), 20); assert.equal(niceStep(1700), 500); assert.equal(niceStep(130000), 50000);
  assert.deepEqual(buildScale([1700, 400, 1300]), { lo: 0, hi: 2000, ticks: [0, 500, 1000, 1500, 2000] });
  assert.deepEqual(buildScale([1000, 400, -600]), { lo: -1000, hi: 1000, ticks: [-1000, -500, 0, 500, 1000] }); // saldo negativo
  assert.deepEqual(buildScale([0, 0]), { lo: 0, hi: 1, ticks: [0, 1] });                                         // sem dados: não quebra
  assert.deepEqual(buildScale([]), { lo: 0, hi: 1, ticks: [0, 1] });
});

test("buildScale: propriedades para qualquer conjunto de valores", () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 300; i++) {
    const vals = Array.from({ length: 1 + Math.floor(rnd() * 24) }, () => Math.round((rnd() - 0.3) * Math.pow(10, 2 + Math.floor(rnd() * 6))));
    const s = buildScale(vals);
    assert.ok(s.lo <= Math.min(0, ...vals) && s.hi >= Math.max(0, ...vals), `cobre os dados: ${vals}`);
    assert.ok(s.lo < s.hi); assert.ok(s.ticks.includes(0), "tem o zero");
    assert.ok(s.ticks.length >= 2 && s.ticks.length <= 9, `nº de marcas razoável: ${s.ticks.length}`);
    const d = s.ticks[1] - s.ticks[0];
    for (let k = 1; k < s.ticks.length; k++) assert.ok(Math.abs(s.ticks[k] - s.ticks[k - 1] - d) < 1e-6, "marcas igualmente espaçadas");
    assert.equal(s.ticks[0], s.lo); assert.equal(s.ticks[s.ticks.length - 1], s.hi);
  }
});

test("série: 12 meses terminando no atual, com rótulos e marcações", async () => {
  const m = await run(2026, 11);
  assert.equal(m.length, 12);
  assert.equal(m[0].key, "2025-12"); assert.equal(m[11].key, "2026-11");
  assert.deepEqual(m.map((x) => x.label), ["dez/25", "jan/26", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov"]);
  assert.equal(m[11].long, "novembro de 2026");
  assert.deepEqual(m.filter((x) => x.selected).map((x) => x.key), ["2026-11"]);
  assert.deepEqual(m.filter((x) => x.current).map((x) => x.key), ["2026-11"]);
});

test("série: valores por mês, só o que foi PAGO, mesma janela do KPI", async () => {
  const m = await run(2026, 11);
  const by = Object.fromEntries(m.map((x) => [x.key, x]));
  assert.deepEqual([by["2026-11"].inn, by["2026-11"].out, by["2026-11"].saldo], [1700, 400, 1300]); // F1+F4 | F2 (F10 e F9 fora)
  assert.deepEqual([by["2026-10"].inn, by["2026-10"].out, by["2026-10"].saldo], [500, 250, 250]);   // F3 (23:59:59 de 31/out) | F5
  assert.deepEqual([by["2025-12"].inn, by["2025-12"].out], [300, 0]);
  assert.equal(by["2026-03"].inn + by["2026-03"].out, 0, "mês sem movimento = zero, sem quebrar");
  assert.equal(m.reduce((s, x) => s + x.inn, 0), 1700 + 500 + 300, "F7 (antes da janela), F8 (outra org) e F9 (não pago) não entram");
});

test("série: mês selecionado no passado, no futuro e antigo demais", async () => {
  const past = await run(2026, 3);
  assert.equal(past[0].key, "2025-12"); assert.deepEqual(past.filter((x) => x.selected).map((x) => x.key), ["2026-03"]);
  const fut = await run(2027, 1);
  assert.equal(fut[11].key, "2027-01"); assert.equal(fut[0].key, "2026-02");
  assert.deepEqual(fut.filter((x) => x.selected).map((x) => x.key), ["2027-01"]);
  assert.deepEqual(fut.filter((x) => x.current).map((x) => x.key), ["2026-11"], "o mês atual continua marcado");
  const old = await run(2025, 1);
  assert.equal(old[0].key, "2025-01"); assert.equal(old[11].key, "2025-12");
  assert.equal(old[0].selected, true); assert.equal(old.find((x) => x.current), undefined);
  assert.equal(old[11].inn, 300);
});

test("série: virada de ano nos rótulos (janeiro leva o ano)", async () => {
  const m = await run(2027, 1);
  assert.equal(m.find((x) => x.key === "2027-01")!.label, "jan/27");
  assert.equal(m.find((x) => x.key === "2026-12")!.label, "dez");
  assert.equal(m[0].label, "fev/26");
});

test("ISOLAMENTO e imobiliária vazia", async () => {
  const other = await run(2026, 11, "o2");
  assert.equal(other.find((x) => x.key === "2026-11")!.inn, 5000);
  assert.equal(other.reduce((s, x) => s + x.out, 0), 0);
  const none = await run(2026, 11, "o-nova");
  assert.equal(none.length, 12); assert.ok(none.every((x) => x.inn === 0 && x.out === 0 && x.saldo === 0));
});

test("monthKey casa com o formato do ?mes= da tela", () => {
  assert.equal(monthKey(2026, 0), "2026-01"); assert.equal(monthKey(2026, 10), "2026-11"); assert.equal(monthKey(2026, 11), "2026-12");
});
