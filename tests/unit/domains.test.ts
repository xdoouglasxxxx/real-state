import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeHost, isReservedHost, isApexHost } from "../../src/lib/vercel-domains";
import { tenantBaseUrl } from "../../src/lib/public-url";

test("normalizeHost limpa protocolo, caminho, porta, caixa e ponto final", () => {
  assert.equal(normalizeHost("https://WWW.Imobiliaria.com.br/imoveis?x=1"), "www.imobiliaria.com.br");
  assert.equal(normalizeHost("  imobiliaria.com.br.  "), "imobiliaria.com.br");
  assert.equal(normalizeHost("http://site.com.br:8080/"), "site.com.br");
  assert.equal(normalizeHost("xn--imobiliria-q5a.com.br"), "xn--imobiliria-q5a.com.br");
});

test("normalizeHost rejeita o que não é domínio", () => {
  for (const bad of ["", "localhost", "192.168.0.1", "10.0.0.1:3000", "sem espaço.com", "a..b.com", "-x.com", "x-.com", "x.c", "javascript:alert(1)", "<script>.com", "a".repeat(300) + ".com"]) {
    assert.equal(normalizeHost(bad), null, `deveria rejeitar: ${bad.slice(0, 30)}`);
  }
});

test("isReservedHost bloqueia a plataforma, vercel.app e localhost", () => {
  const root = "maisonstate.vercel.app";
  for (const h of ["maisonstate.vercel.app", "cliente.maisonstate.vercel.app", "qualquer.vercel.app", "vercel.app", "x.vercel.sh", "app.localhost"])
    assert.equal(isReservedHost(h, root), true, h);
  for (const h of ["www.imobiliaria.com.br", "imobiliaria.com.br", "maisonstate.com.br"])
    assert.equal(isReservedHost(h, root), false, h);
  // raiz própria com porta e wildcard
  assert.equal(isReservedHost("x.plataforma.com.br", "plataforma.com.br:443"), true);
  assert.equal(isReservedHost("plataforma.com.br", "plataforma.com.br"), true);
  assert.equal(isReservedHost("outraplataforma.com.br", "plataforma.com.br"), false);
});

test("isApexHost: raiz usa A, subdomínio usa CNAME (inclui .com.br)", () => {
  assert.equal(isApexHost("imobiliaria.com.br"), true);
  assert.equal(isApexHost("imobiliaria.com"), true);
  assert.equal(isApexHost("www.imobiliaria.com.br"), false);
  assert.equal(isApexHost("www.imobiliaria.com"), false);
  assert.equal(isApexHost("imoveis.imobiliaria.com.br"), false);
  assert.equal(isApexHost("imobiliaria.net.br"), true);
});

test("tenantBaseUrl: domínio próprio > subdomínio (só com wildcard real) > raiz", () => {
  const save = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = "maisonstate.vercel.app";
  assert.equal(tenantBaseUrl("silva", "www.silva.com.br"), "https://www.silva.com.br");
  assert.equal(tenantBaseUrl("silva", null), "https://maisonstate.vercel.app"); // vercel.app não tem wildcard
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = "plataforma.com.br";
  assert.equal(tenantBaseUrl("silva", null), "https://silva.plataforma.com.br");
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = "localhost:3000";
  assert.equal(tenantBaseUrl("silva", null), "https://maisonstate.vercel.app");
  if (save === undefined) delete process.env.NEXT_PUBLIC_ROOT_DOMAIN; else process.env.NEXT_PUBLIC_ROOT_DOMAIN = save;
});
