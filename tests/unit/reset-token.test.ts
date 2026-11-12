import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createResetToken, readResetToken, passFingerprint, RESET_TTL_MS } from "../../src/lib/reset-token";

process.env.AUTH_SECRET = "segredo-de-teste-1";

test("token válido volta o userId e a impressão da senha atual", () => {
  const t = createResetToken("user_1", "salt:hash-antigo");
  const r = readResetToken(t);
  assert.ok(r);
  assert.equal(r!.userId, "user_1");
  assert.equal(r!.fp, passFingerprint("salt:hash-antigo"));
});

test("uso único: trocar a senha muda a impressão e invalida o link", () => {
  const t = createResetToken("user_1", "salt:hash-antigo");
  const r = readResetToken(t)!;
  assert.notEqual(r.fp, passFingerprint("salt:hash-NOVO"));
});

test("token expira após 1 hora", () => {
  const t = createResetToken("user_1", "x", 1_000_000);
  assert.ok(readResetToken(t, 1_000_000 + RESET_TTL_MS - 1));
  assert.equal(readResetToken(t, 1_000_000 + RESET_TTL_MS + 1), null);
});

test("payload adulterado é rejeitado", () => {
  const t = createResetToken("user_1", "x");
  const [payload, sig] = t.split(".");
  const evil = Buffer.from(JSON.stringify({ u: "admin_da_plataforma", e: Date.now() + 1e9, f: "x" })).toString("base64url");
  assert.equal(readResetToken(`${evil}.${sig}`), null);
  assert.equal(readResetToken(`${payload}.${sig.slice(0, -2)}AA`), null);
});

test("token assinado com OUTRO segredo é rejeitado", () => {
  const t = createResetToken("user_1", "x");
  process.env.AUTH_SECRET = "segredo-de-teste-2";
  assert.equal(readResetToken(t), null);
  process.env.AUTH_SECRET = "segredo-de-teste-1";
});

test("separação de domínio: assinatura de sessão (sem prefixo) NÃO vale como token de reset", () => {
  const payload = Buffer.from(JSON.stringify({ u: "user_1", e: Date.now() + 1e6, f: "x" })).toString("base64url");
  const sessionStyleSig = createHmac("sha256", "segredo-de-teste-1").update(payload).digest("base64url");
  assert.equal(readResetToken(`${payload}.${sessionStyleSig}`), null);
});

test("entradas lixo nunca lançam exceção", () => {
  for (const bad of ["", ".", "abc", "a.b", "....", "x".repeat(5000), "e30.e30", "%%%.%%%"]) {
    assert.equal(readResetToken(bad), null);
  }
  // @ts-expect-error tipo errado de propósito
  assert.equal(readResetToken(undefined), null);
});

test("usuário legado sem passHash também gera token válido e estável", () => {
  const t = createResetToken("legacy", null);
  assert.equal(readResetToken(t)!.fp, passFingerprint(undefined));
});
