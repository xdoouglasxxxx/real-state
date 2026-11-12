import { createHmac, createHash, timingSafeEqual } from "crypto";

/**
 * Token de "esqueci minha senha" SEM tabela no banco:
 *   payload = { u: userId, e: expiraEm(ms), f: impressão da senha atual }
 *   token   = base64url(payload) + "." + HMAC-SHA256("pwreset:" + payload)
 * A impressão `f` é um hash do passHash ATUAL — ao trocar a senha ela muda e
 * o link deixa de valer (uso único de fato). Expira em 1 hora.
 */
const secret = () => process.env.AUTH_SECRET ?? "dev-secret-change-me";
const sign = (payload: string) =>
  createHmac("sha256", secret()).update("pwreset:" + payload).digest("base64url");

export const RESET_TTL_MS = 60 * 60 * 1000;

/** Impressão curta da senha atual (null/vazio = usuário legado sem hash). */
export const passFingerprint = (passHash: string | null | undefined) =>
  createHash("sha256").update(passHash ?? "").digest("hex").slice(0, 16);

export function createResetToken(userId: string, passHash: string | null | undefined, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ u: userId, e: now + RESET_TTL_MS, f: passFingerprint(passHash) }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Valida assinatura e validade. NÃO confere a impressão — quem chama compara com o usuário atual. */
export function readResetToken(token: string, now = Date.now()): { userId: string; fp: string } | null {
  if (typeof token !== "string" || token.length > 600 || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u?: string; e?: number; f?: string };
    if (!p.u || !p.f || typeof p.e !== "number" || p.e < now) return null;
    return { userId: p.u, fp: p.f };
  } catch {
    return null;
  }
}
