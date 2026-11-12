/**
 * Endereço público de um tenant, em ordem de prioridade:
 *   1) domínio próprio principal (Domain.isPrimary)
 *   2) subdomínio <slug>.<ROOT> — SÓ quando a plataforma tem domínio próprio
 *      com wildcard. Em *.vercel.app subdomínios curinga não existem, então
 *      montar <slug>.maisonstate.vercel.app gera link morto.
 *   3) raiz da plataforma
 */
export function tenantBaseUrl(slug: string, primaryHost?: string | null): string {
  if (primaryHost) return `https://${primaryHost}`;
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").trim().toLowerCase();
  const real = root && !root.includes("localhost");
  if (real && !root.endsWith(".vercel.app")) return `https://${slug}.${root}`;
  if (real) return `https://${root}`;
  return "https://maisonstate.vercel.app";
}
