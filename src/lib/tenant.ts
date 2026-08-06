import { headers } from "next/headers";
import { prisma } from "./prisma";
import { DEMO_ORG } from "./demo-data";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  themeInk: string;
  themeBrass: string;
  themeCream: string;
  creci?: string | null;
  phone?: string | null;
};

/**
 * Resolve o tenant a partir do host da requisição.
 * 1) domínio próprio  -> tabela Domain
 * 2) subdomínio       -> Organization.slug
 * 3) sem banco / dev  -> tenant demo (permite rodar sem Postgres)
 */
export async function getTenant(): Promise<Tenant> {
  const host = (headers().get("x-tenant-host") ?? "").toLowerCase();

  try {
    if (host && !host.includes("localhost")) {
      const byDomain = await prisma.domain.findUnique({
        where: { host },
        include: { organization: true },
      });
      if (byDomain) return byDomain.organization;

      if (host.endsWith(ROOT)) {
        const slug = host.replace(`.${ROOT}`, "");
        const bySlug = await prisma.organization.findUnique({ where: { slug } });
        if (bySlug) return bySlug;
      }
    }
    const first = await prisma.organization.findFirst();
    if (first) return first;
  } catch {
    // banco indisponível -> demo
  }
  return DEMO_ORG;
}
