import { test } from "node:test";
import assert from "node:assert/strict";
import { periodRange, parsePeriod, dashHref } from "../../src/lib/periods";

const iso = (d: Date) => d.toISOString();
const NOV12 = new Date("2026-11-12T20:00:00Z"); // 17:00 em Brasília

test("parsePeriod: só aceita tri/ano; o resto vira mês", () => {
  assert.equal(parsePeriod("tri"), "tri"); assert.equal(parsePeriod("ano"), "ano");
  for (const v of [undefined, "", "mes", "semana", "TRI", 3, null]) assert.equal(parsePeriod(v), "mes");
});

test("mês: limites em horário de Brasília e comparação com o mesmo tempo decorrido", () => {
  const r = periodRange("mes", NOV12);
  assert.equal(iso(r.start), "2026-11-01T03:00:00.000Z");
  assert.equal(iso(r.fullEnd), "2026-12-01T03:00:00.000Z");
  assert.equal(iso(r.prevStart), "2026-10-01T03:00:00.000Z");
  assert.equal(iso(r.prevEnd), "2026-10-12T20:00:00.000Z"); // 11d17h depois de 1º/out
  assert.deepEqual(r.months, [{ year: 2026, month: 11 }]);
  assert.equal(r.label, "novembro de 2026");
  assert.ok(r.elapsedFraction > 0.37 && r.elapsedFraction < 0.40, String(r.elapsedFraction));
});

test("trimestre (T4): out–dez; anterior = jul–set", () => {
  const r = periodRange("tri", NOV12);
  assert.equal(iso(r.start), "2026-10-01T03:00:00.000Z");
  assert.equal(iso(r.prevStart), "2026-07-01T03:00:00.000Z");
  assert.equal(iso(r.fullEnd), "2027-01-01T03:00:00.000Z");
  assert.deepEqual(r.months, [{ year: 2026, month: 10 }, { year: 2026, month: 11 }, { year: 2026, month: 12 }]);
  assert.equal(r.label, "4º trimestre de 2026");
});

test("trimestre T1 olha para o T4 do ano anterior", () => {
  const r = periodRange("tri", new Date("2026-02-10T12:00:00Z"));
  assert.equal(iso(r.start), "2026-01-01T03:00:00.000Z");
  assert.equal(iso(r.prevStart), "2025-10-01T03:00:00.000Z");
  assert.deepEqual(r.months.map((m) => m.month), [1, 2, 3]);
});

test("ano: 1º/jan até agora; anterior = ano passado; 12 meses", () => {
  const r = periodRange("ano", NOV12);
  assert.equal(iso(r.start), "2026-01-01T03:00:00.000Z");
  assert.equal(iso(r.prevStart), "2025-01-01T03:00:00.000Z");
  assert.equal(r.months.length, 12); assert.equal(r.months[0].month, 1); assert.equal(r.months[11].month, 12);
  assert.equal(r.label, "2026");
});

test("virada do mês é no horário de Brasília, não no UTC", () => {
  // 02:59:59 UTC de 1º/dez = 23:59:59 de 30/nov em Brasília → ainda novembro
  const before = periodRange("mes", new Date("2026-12-01T02:59:59Z"));
  assert.equal(before.label, "novembro de 2026");
  const after = periodRange("mes", new Date("2026-12-01T03:00:00Z"));
  assert.equal(after.label, "dezembro de 2026");
  assert.equal(iso(after.start), "2026-12-01T03:00:00.000Z");
});

test("dia 31 comparando com mês de 28 dias: o anterior não passa do próprio fim", () => {
  const r = periodRange("mes", new Date("2026-03-31T15:00:00Z"));
  assert.equal(iso(r.prevStart), "2026-02-01T03:00:00.000Z");
  assert.equal(iso(r.prevEnd), "2026-03-01T03:00:00.000Z"); // = início de março, não 3/mar
  assert.ok(r.prevEnd.getTime() <= r.start.getTime());
});

test("ano bissexto: o anterior sempre termina antes do início do período", () => {
  for (const d of ["2028-03-01T12:00:00Z", "2028-12-31T20:00:00Z", "2029-01-02T12:00:00Z"]) {
    const r = periodRange("ano", new Date(d));
    assert.ok(r.prevEnd.getTime() <= r.start.getTime(), d);
    assert.ok(r.prevStart.getTime() < r.prevEnd.getTime(), d);
  }
});

test("início exato do período: nada decorrido, comparação vazia, sem erro", () => {
  const r = periodRange("mes", new Date("2026-11-01T03:00:00Z"));
  assert.equal(r.elapsedFraction, 0);
  assert.equal(iso(r.prevEnd), iso(r.prevStart));
});

test("elapsedFraction fica entre 0 e 1 em qualquer período", () => {
  for (const p of ["mes", "tri", "ano"] as const) for (const d of ["2026-01-01T03:00:00Z", "2026-06-15T10:00:00Z", "2026-12-31T20:00:00Z"]) {
    const f = periodRange(p, new Date(d)).elapsedFraction; assert.ok(f >= 0 && f <= 1, `${p} ${d} ${f}`);
  }
});

test("dashHref: período padrão fora da URL, corretor e período quando houver", () => {
  assert.equal(dashHref("mes", null), "/painel");
  assert.equal(dashHref("tri", null), "/painel?periodo=tri");
  assert.equal(dashHref("mes", "ag1"), "/painel?corretor=ag1");
  assert.equal(dashHref("ano", "ag 1&x"), "/painel?periodo=ano&corretor=ag+1%26x"); // id é escapado
});
