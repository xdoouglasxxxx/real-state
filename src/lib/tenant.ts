import { headers } from "next/headers";
import { prisma } from "./prisma";
import { DEMO_ORG } from "./demo-data";
import { getTenantPreview } from "./auth";

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
 * Resolução do tenant, em ordem de prioridade:
 * 1) Domínio próprio (tabela Domain)          — produção com domínio do cliente
 * 2) Subdomínio <slug>.ROOT_DOMAIN            — produção com domínio da plataforma
 * 3) Cookie de preview (setado no cadastro)   — funciona já no *.vercel.app
 * 4) Primeira organização / demo              — fallback
 */
export async function getTenant(): Promise<Tenant> {
  const host = (headers().get("x-tenant-host") ?? "").toLowerCase().split(":")[0];

  try {
    if (host && !host.includes("localhost")) {
      const byDomain = await prisma.domain.findUnique({
        where: { host },
        include: { organization: true },
      });
      if (byDomain) return byDomain.organization;

      if (host.endsWith(`.${ROOT}`)) {
        const slug = host.replace(`.${ROOT}`, "");
        const bySlug = await prisma.organization.findUnique({ where: { slug } });
        if (bySlug) return bySlug;
      }
    }

    const preview = getTenantPreview();
    if (preview) {
      const byPreview = await prisma.organization.findUnique({ where: { slug: preview } });
      if (byPreview) return byPreview;
    }

    const first = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (first) return first;
  } catch { /* sem banco -> demo */ }
  return DEMO_ORG;
}
