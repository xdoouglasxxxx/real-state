import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeQuery, parseBand, parseBeds, parseSearchParams, buildSearchWhere, demoMatches, PRICE_BANDS } from "../../src/lib/search";
import { makeFakeDb } from "./helpers/fake-db";

const P = (id: string, o: Record<string, any>) => ({ id, organizationId: "o1", type: "HOUSE", status: "FOR_SALE", neighborhood: "Alphaville", city: "Barueri", title: "Imóvel " + id, price: 1000000, bedrooms: 3, ...o });
const DATA = { property: [
  P("P1", { title: "Casa do Vale", price: 4850000, bedrooms: 5 }),
  P("P2", { type: "APARTMENT", neighborhood: "Itaim Bibi", city: "São Paulo", title: "Penthouse Horizonte", price: 7200000, bedrooms: 4 }),
  P("P3", { status: "EXCLUSIVE", neighborhood: "Riviera de São Lourenço", city: "Bertioga", title: "Villa Mar Azul", price: 9500000, bedrooms: 6 }),
  P("P4", { type: "APARTMENT", neighborhood: "Jardins", city: "São Paulo", title: "Loft Jardins", price: 2350000, bedrooms: 2 }),
  P("P5", { status: "SOLD", title: "Vendida" }), P("P6", { status: "DRAFT", title: "Rascunho" }), P("P8", { status: "ARCHIVED", title: "Arquivada" }),
  P("P7", { organizationId: "o2", title: "Casa de outra org" }),
] };
const db = makeFakeDb(DATA as any) as any;
const ids = async (org: string, f: any) => (await db.property.findMany({ where: buildSearchWhere(org, f), orderBy: { id: "asc" } })).map((r: any) => r.id);

test("normalizeQuery: aparar, juntar espaços, limitar a 60, vazio vira undefined", () => {
  assert.equal(normalizeQuery("  jardins   sp  "), "jardins sp");
  assert.equal(normalizeQuery("a".repeat(200))!.length, 60);
  for (const v of ["", "   ", null, undefined]) assert.equal(normalizeQuery(v as any), undefined);
});

test("parseBand: faixas válidas e TODA entrada inválida descartada (sem NaN)", () => {
  assert.deepEqual(parseBand("0-1000000"), { min: 0, max: 1000000 });
  assert.deepEqual(parseBand("6000000-"), { min: 6000000, max: undefined });
  assert.deepEqual(parseBand("-3000000"), { min: undefined, max: 3000000 });
  for (const bad of ["abc", "1-2-3", "5-1", "-5-3", "1e6-2e6", "1.5-2", "9999999999999-1", "", null, undefined, " 1-2", "1 -2"]) assert.deepEqual(parseBand(bad as any), {}, String(bad));
  for (const b of PRICE_BANDS) { const r = parseBand(b.value); assert.ok(r.min !== undefined || r.max !== undefined, b.value); }
});

test("parseBeds: só inteiros de 1 a 10", () => {
  assert.equal(parseBeds("3"), 3); assert.equal(parseBeds("10"), 10);
  for (const bad of ["0", "11", "2.5", "-1", "abc", "", null, undefined, "3x"]) assert.equal(parseBeds(bad as any), undefined, String(bad));
});

test("parseSearchParams: valida o tipo e ignora lixo; aceita lista (pega o primeiro)", () => {
  assert.deepEqual(parseSearchParams({ type: "HOUSE", location: " Jardins ", price: "1000000-3000000", q: " loft ", beds: "3", excl: "1" }),
    { type: "HOUSE", location: "Jardins", min: 1000000, max: 3000000, q: "loft", beds: 3, exclusive: true });
  const junk = parseSearchParams({ type: "xyz", price: "abc-def", beds: "99", excl: "yes", q: "   " });
  assert.deepEqual(junk, { type: undefined, location: undefined, min: undefined, max: undefined, q: undefined, beds: undefined, exclusive: undefined });
  assert.equal(parseSearchParams({ type: "house" }).type, undefined, "enum é maiúsculo");
  assert.equal(parseSearchParams({ type: ["APARTMENT", "HOUSE"] }).type, "APARTMENT");
  assert.equal(parseSearchParams({ location: "x".repeat(500) }).location!.length, 80);
});

test("filtro: só à venda/exclusivo, nunca rascunho, vendido ou arquivado, sempre da imobiliária", async () => {
  assert.deepEqual(await ids("o1", {}), ["P1", "P2", "P3", "P4"]);
  assert.deepEqual(await ids("o2", {}), ["P7"]);
  assert.deepEqual(await ids("o-vazia", {}), []);
});

test("filtro: tipo, bairro, quartos, faixa de preço e exclusivos", async () => {
  assert.deepEqual(await ids("o1", { type: "HOUSE" }), ["P1", "P3"]);
  assert.deepEqual(await ids("o1", { type: "APARTMENT" }), ["P2", "P4"]);
  assert.deepEqual(await ids("o1", { location: "Itaim Bibi" }), ["P2"]);
  assert.deepEqual(await ids("o1", { beds: 4 }), ["P1", "P2", "P3"]);
  assert.deepEqual(await ids("o1", { min: 1000000, max: 3000000 }), ["P4"]);
  assert.deepEqual(await ids("o1", { min: 6000000 }), ["P2", "P3"]);
  assert.deepEqual(await ids("o1", { exclusive: true }), ["P3"]);
  assert.deepEqual(await ids("o1", { type: "APARTMENT", max: 3000000 }), ["P4"]);
  assert.deepEqual(await ids("o1", { type: "HOUSE", beds: 6 }), ["P3"]);
});

test("busca por texto: título, bairro ou cidade, sem diferença de maiúsculas", async () => {
  assert.deepEqual(await ids("o1", { q: "ALPHAville" }), ["P1"]);
  assert.deepEqual(await ids("o1", { q: "horizonte" }), ["P2"]);
  assert.deepEqual(await ids("o1", { q: "são paulo" }), ["P2", "P4"]);
  assert.deepEqual(await ids("o1", { q: "bertioga" }), ["P3"]);
  assert.deepEqual(await ids("o1", { q: "inexistente" }), []);
  assert.deepEqual(await ids("o1", { q: "vendida" }), [], "imóvel vendido não aparece nem na busca por texto");
});

test("parâmetros inválidos NUNCA derrubam a consulta nem mudam o resultado (sem cair no demo)", async () => {
  const all = await ids("o1", {});
  for (const sp of [{ type: "xyz" }, { price: "abc-def" }, { beds: "banana" }, { q: "   " }, { excl: "talvez" }, { type: "'; DROP TABLE" }])
    assert.deepEqual(await ids("o1", parseSearchParams(sp)), all, JSON.stringify(sp));
});

test("o filtro do banco e o do modo demonstração dão o MESMO resultado para as mesmas entradas", async () => {
  const props = DATA.property.filter((p: any) => p.organizationId === "o1" && ["FOR_SALE", "EXCLUSIVE"].includes(p.status));
  const combos: any[] = [{}, { type: "HOUSE" }, { type: "APARTMENT" }, { location: "Jardins" }, { beds: 5 }, { min: 3000000 }, { max: 3000000 }, { min: 1000000, max: 5000000 },
    { exclusive: true }, { q: "casa" }, { q: "são paulo" }, { q: "ALPHA" }, { type: "HOUSE", q: "vale" }, { type: "APARTMENT", beds: 3, min: 5000000 }, { location: "Jardins", exclusive: true }];
  for (const f of combos) {
    const fromDb = await ids("o1", f);
    const fromDemo = props.filter((p: any) => demoMatches(p, f)).map((p: any) => p.id).sort();
    assert.deepEqual(fromDemo, fromDb, JSON.stringify(f));
  }
});
