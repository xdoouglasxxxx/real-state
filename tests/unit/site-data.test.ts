import { test } from "node:test";
import assert from "node:assert/strict";
import { getSiteSummary, summaryFromProperties, sortHoods } from "../../src/lib/site-data";
import { makeFakeDb } from "./helpers/fake-db";

const P = (id: string, o: Record<string, any>) => ({ id, organizationId: "o1", status: "FOR_SALE", neighborhood: "Jardins", ...o });
const props = [
  P("1", { neighborhood: "Alphaville" }), P("2", { neighborhood: "Jardins" }), P("3", { neighborhood: "Jardins", status: "EXCLUSIVE" }),
  P("4", { neighborhood: "Itaim Bibi" }), P("5", { neighborhood: null }),                          // disponível sem bairro: conta no total, não vira chip
  P("6", { neighborhood: "Moema", status: "SOLD" }), P("7", { neighborhood: "Moema", status: "RESERVED" }), P("8", { neighborhood: "Moema", status: "DRAFT" }),
  P("9", { organizationId: "o2", neighborhood: "Outra" }),
];
const agents = [{ id: "a1", organizationId: "o1", isActive: true }, { id: "a2", organizationId: "o1", isActive: true }, { id: "a3", organizationId: "o1", isActive: false }, { id: "x", organizationId: "o2", isActive: true }];
const db = makeFakeDb({ property: props, agent: agents } as any) as any;

test("resumo: total de disponíveis, bairros com contagem e corretores ativos", async () => {
  const s = await getSiteSummary(db, "o1");
  assert.equal(s.availableCount, 5);                                   // 1,2,3,4,5 (vendido, reservado e rascunho não contam)
  assert.deepEqual(s.hoods, [{ name: "Jardins", count: 2 }, { name: "Alphaville", count: 1 }, { name: "Itaim Bibi", count: 1 }]);
  assert.equal(s.agentsCount, 2);
});

test("resumo: isolamento entre imobiliárias e imobiliária vazia", async () => {
  assert.deepEqual(await getSiteSummary(db, "o2"), { availableCount: 1, hoods: [{ name: "Outra", count: 1 }], agentsCount: 1 });
  assert.deepEqual(await getSiteSummary(db, "o-nova"), { availableCount: 0, hoods: [], agentsCount: 0 });
});

test("o resumo do banco e o do modo demonstração são iguais para os mesmos dados", async () => {
  const mine = props.filter((p) => p.organizationId === "o1");
  assert.deepEqual(summaryFromProperties(mine, 2), await getSiteSummary(db, "o1"));
});

test("sortHoods: mais imóveis primeiro, desempate em ordem alfabética (pt-BR) e limite", () => {
  const rows = [{ name: "Zona", count: 1 }, { name: "Ágata", count: 1 }, { name: "Bela", count: 3 }, { name: "Alto", count: 1 }];
  assert.deepEqual(sortHoods(rows).map((r) => r.name), ["Bela", "Ágata", "Alto", "Zona"]);
  assert.equal(sortHoods(Array.from({ length: 30 }, (_, i) => ({ name: "B" + i, count: 1 }))).length, 12);
  assert.equal(sortHoods(Array.from({ length: 30 }, (_, i) => ({ name: "B" + i, count: 1 })), 5).length, 5);
});
