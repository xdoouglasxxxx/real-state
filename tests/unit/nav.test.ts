import { test } from "node:test";
import assert from "node:assert/strict";
import { isNavActive } from "../../src/lib/nav";

test("Dashboard (/painel) só fica ativo na própria home", () => {
  assert.equal(isNavActive("/painel", "/painel"), true);
  assert.equal(isNavActive("/painel", "/painel/leads"), false);
  assert.equal(isNavActive("/painel", "/painel/mapa"), false);
});
test("seção fica ativa na página e nas subpáginas", () => {
  assert.equal(isNavActive("/painel/leads", "/painel/leads"), true);
  assert.equal(isNavActive("/painel/leads", "/painel/leads/novo"), true);
  assert.equal(isNavActive("/painel/imoveis", "/painel/imoveis/abc123"), true);
  assert.equal(isNavActive("/painel/locacao", "/painel/locacao/x/vistoria/y"), true);
});
test("não confunde prefixos parecidos nem seções vizinhas", () => {
  assert.equal(isNavActive("/painel/imoveis", "/painel/imoveis-antigos"), false);
  assert.equal(isNavActive("/painel/leads", "/painel/agenda"), false);
  assert.equal(isNavActive("/painel/mapa", "/painel/metas"), false);
  assert.equal(isNavActive("/painel/leads", ""), false);
});
