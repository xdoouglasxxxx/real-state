/**
 * Domínio próprio por tenant — integração com a API da Vercel.
 * Envs (ver DOMINIOS.md):
 *   VERCEL_API_TOKEN   token criado em Vercel → Account Settings → Tokens
 *   VERCEL_PROJECT_ID  Project → Settings → General → Project ID
 *   VERCEL_TEAM_ID     opcional — só se o projeto estiver dentro de um Team
 * Sem as duas primeiras o recurso fica desligado (a tela explica).
 * Toda chamada tem timeout e NUNCA lança: o painel não pode quebrar por
 * causa da API externa.
 */

const API = "https://api.vercel.com";
export const DEFAULT_CNAME = "cname.vercel-dns.com";
export const DEFAULT_IPV4 = "76.76.21.21";

type Cfg = { token: string; project: string; team?: string };
const cfg = (): Cfg | null => {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const project = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !project) return null;
  return { token, project, team: process.env.VERCEL_TEAM_ID?.trim() || undefined };
};
export const domainsEnabled = () => Boolean(cfg());

/* ---------- funções puras (testadas em tests/unit) ---------- */

const HOST_RE =
  /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+(xn--[a-z0-9-]{1,59}|[a-z]{2,63})$/;

/** "https://WWW.Site.com.br/x?y" → "www.site.com.br". Retorna null se inválido (inclui IPs). */
export function normalizeHost(input: string): string | null {
  const h = String(input ?? "")
    .trim().toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split(/[/?#]/)[0]
    .split(":")[0]
    .replace(/\.$/, "");
  return HOST_RE.test(h) ? h : null;
}

/** Domínios que o tenant NÃO pode reivindicar (plataforma, vercel.app, localhost). */
export function isReservedHost(host: string, rootDomain: string): boolean {
  const root = rootDomain.split(":")[0].toLowerCase();
  return (
    host === root || host.endsWith(`.${root}`) ||
    host === "vercel.app" || host.endsWith(".vercel.app") ||
    host.endsWith(".vercel.sh") || host === "localhost" || host.endsWith(".localhost")
  );
}

const SECOND_LEVEL = new Set(["com", "net", "org", "gov", "edu", "adv", "eco", "ind", "imb", "mil", "art", "blog"]);
/** Apex (raiz) usa registro A; subdomínio (www...) usa CNAME. Heurística p/ TLDs de 2 níveis (.com.br). */
export function isApexHost(host: string): boolean {
  const p = host.split(".");
  if (p.length <= 2) return true;
  return p.length === 3 && SECOND_LEVEL.has(p[1]) && p[2].length === 2;
}

/* ---------- chamadas à API ---------- */

type Resp<T = any> = { ok: boolean; status: number; data: T | null; error?: string };

async function vercel<T = any>(method: string, path: string, body?: unknown): Promise<Resp<T>> {
  const c = cfg();
  if (!c) return { ok: false, status: 0, data: null, error: "not_configured" };
  const url = new URL(path, API);
  if (c.team) url.searchParams.set("teamId", c.team);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* corpo não-JSON */ }
    if (!res.ok) {
      const code = String(data?.error?.code ?? data?.error?.message ?? `http_${res.status}`);
      return { ok: false, status: res.status, data, error: code };
    }
    return { ok: true, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: null, error: e?.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

const proj = () => encodeURIComponent(cfg()?.project ?? "");
const dom = (host: string) => encodeURIComponent(host);

/** Anexa o domínio ao projeto. Idempotente: se já está neste projeto, conta como sucesso. */
export async function addDomainToProject(host: string): Promise<{ ok: boolean; error?: string }> {
  const r = await vercel("POST", `/v10/projects/${proj()}/domains`, { name: host });
  if (r.ok) return { ok: true };
  if (r.status === 409) {
    const g = await vercel("GET", `/v9/projects/${proj()}/domains/${dom(host)}`);
    if (g.ok) return { ok: true }; // já estava neste projeto
  }
  return { ok: false, error: r.error };
}

export async function verifyDomainOnProject(host: string) {
  return vercel("POST", `/v9/projects/${proj()}/domains/${dom(host)}/verify`);
}

/** Remove do projeto. 404 (já não existe) conta como sucesso. */
export async function removeDomainFromProject(host: string): Promise<boolean> {
  const r = await vercel("DELETE", `/v9/projects/${proj()}/domains/${dom(host)}`);
  return r.ok || r.status === 404;
}

export type DomainStatus = {
  /** posse confirmada (TXT, quando exigido). null = não foi possível consultar */
  verified: boolean | null;
  /** DNS ainda não aponta para a Vercel. null = não foi possível consultar */
  misconfigured: boolean | null;
  /** registros TXT exigidos para provar a posse (quando verified = false) */
  verification: { type: string; domain: string; value: string }[];
  cname: string;
  ipv4: string;
  error?: string;
};

/** Situação ao vivo do domínio (nunca lança). */
export async function getDomainStatus(host: string): Promise<DomainStatus> {
  const out: DomainStatus = {
    verified: null, misconfigured: null, verification: [], cname: DEFAULT_CNAME, ipv4: DEFAULT_IPV4,
  };
  if (!cfg()) return { ...out, error: "not_configured" };
  const [d, c] = await Promise.all([
    vercel("GET", `/v9/projects/${proj()}/domains/${dom(host)}`),
    vercel("GET", `/v6/domains/${dom(host)}/config`),
  ]);
  if (d.ok && d.data) {
    out.verified = Boolean(d.data.verified);
    const v = Array.isArray(d.data.verification) ? d.data.verification : [];
    out.verification = v
      .filter((x: any) => x && x.type && x.domain && x.value)
      .map((x: any) => ({ type: String(x.type), domain: String(x.domain), value: String(x.value) }));
  } else {
    out.error = d.error ?? "unknown";
  }
  if (c.ok && c.data) {
    if (typeof c.data.misconfigured === "boolean") out.misconfigured = c.data.misconfigured;
    const cn = c.data.recommendedCNAME?.[0]?.value;
    const ip = c.data.recommendedIPv4?.[0]?.value?.[0];
    if (typeof cn === "string" && cn) out.cname = cn.replace(/\.$/, "");
    if (typeof ip === "string" && ip) out.ipv4 = ip;
  }
  return out;
}
