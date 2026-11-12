import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Origem usada em links enviados por e-mail. Só confia no Host da requisição
 * se for a raiz da plataforma, um *.vercel.app, localhost ou um domínio
 * cadastrado por algum tenant; senão cai na raiz — evita envenenar o link
 * de redefinição de senha com um Host forjado.
 */
export async function getBaseUrl(): Promise<string> {
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000").toLowerCase();
  const rawHost = (headers().get("host") ?? "").toLowerCase();
  const hostname = rawHost.split(":")[0];

  let trusted =
    rawHost === root || rawHost.endsWith(`.${root}`) ||
    hostname.endsWith(".vercel.app") || hostname === "localhost";

  if (!trusted && hostname && process.env.DATABASE_URL) {
    try {
      trusted = Boolean(await prisma.domain.findUnique({ where: { host: hostname }, select: { id: true } }));
    } catch { /* host não confiável */ }
  }

  const host = trusted && rawHost ? rawHost : root;
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  return `${proto}://${host}`;
}
