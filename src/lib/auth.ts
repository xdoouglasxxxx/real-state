import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// H1: AUTH_SECRET obrigatória em produção; sem ela qualquer um pode forjar sessões.
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET env var must be set in production");
}
if (process.env.NODE_ENV !== "production" && !process.env.AUTH_SECRET) {
  console.warn("[auth] AUTH_SECRET não definida — usando fallback de dev. NUNCA use em produção.");
}
const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-me";
const SESSION_COOKIE = "maison_session";
const TENANT_COOKIE = "tenant_preview";
const WEEK = 60 * 60 * 24 * 7;

/* ---------- comparação timing-safe (C2) ---------- */
/**
 * Compara duas strings em tempo constante (padding de 256 bytes).
 * Usa-se para credenciais master onde === vaza informação por tempo.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const LEN = 256;
  const aBuf = Buffer.alloc(LEN);
  const bBuf = Buffer.alloc(LEN);
  Buffer.from(a).copy(aBuf, 0, 0, Math.min(a.length, LEN));
  Buffer.from(b).copy(bBuf, 0, 0, Math.min(b.length, LEN));
  const sameContent = timingSafeEqual(aBuf, bBuf);
  return a.length === b.length && sameContent;
}

/* ---------- senha (scrypt) ---------- */
export function hashPassword(pass: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pass, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pass: string, stored?: string | null) {
  if (!stored?.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(pass, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ---------- sessão (cookie assinado) ---------- */
// role/userId/agentId chegaram na etapa multiusuário; sessões antigas não os
// têm — o app trata sessão sem role como ORG_ADMIN (antes só o admin logava).
export type SessionRole = "ORG_ADMIN" | "MANAGER" | "AGENT" | "CLIENT" | "OWNER";
type Session = {
  orgId: string;
  email: string;
  userId?: string;
  role?: SessionRole;
  agentId?: string | null;
  master?: boolean;
  exp: number;
};

const sign = (data: string) => createHmac("sha256", SECRET).update(data).digest("base64url");

export function createSession(s: Omit<Session, "exp">) {
  const payload = Buffer.from(JSON.stringify({ ...s, exp: Date.now() + WEEK * 1000 })).toString("base64url");
  cookies().set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: WEEK, path: "/",
  });
}

export function getSession(): Session | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw?.includes(".")) return null;
  const [payload, sig] = raw.split(".");
  if (sign(payload) !== sig) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

/* ---------- tenant preview (antes do domínio próprio) ---------- */
export function setTenantPreview(slug: string) {
  // H2: httpOnly impede leitura por JavaScript (XSS). Apenas código servidor usa getTenantPreview().
  cookies().set(TENANT_COOKIE, slug, { httpOnly: true, sameSite: "lax", maxAge: WEEK, path: "/" });
}
export function getTenantPreview() {
  return cookies().get(TENANT_COOKIE)?.value ?? null;
}
