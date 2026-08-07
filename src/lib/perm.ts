/**
 * PERMISSÕES DO PAINEL — fonte única da verdade para papéis.
 *
 * Papéis (enum Role do banco, subconjunto usado no painel):
 *   ORG_ADMIN → dono da imobiliária: vê e faz tudo (usuários, assinatura, config)
 *   MANAGER   → gerente: opera todo o CRM/imóveis/corretores, sem área administrativa
 *   AGENT     → corretor: portal próprio — só os SEUS leads, visitas e números
 *   master    → acesso PAINEL_USER/PASS da plataforma: equivale a ORG_ADMIN
 *
 * Sessões antigas (criadas antes desta etapa) não têm role no cookie:
 * são tratadas como ORG_ADMIN, porque antes só o admin conseguia logar.
 */
import { redirect } from "next/navigation";
import { getTenant, type Tenant } from "./tenant";
import { getSession, type SessionRole } from "./auth";
import { prisma } from "./prisma";

export type PanelContext = {
  org: Tenant;
  email: string;
  userId: string | null;
  role: SessionRole;
  /** id do Agent vinculado (só quando role = AGENT e o vínculo existe) */
  agentId: string | null;
  master: boolean;
  isAdmin: boolean; // ORG_ADMIN ou master
  isManagerUp: boolean; // MANAGER, ORG_ADMIN ou master
  isAgent: boolean; // portal restrito do corretor
};

/** Resolve tenant + sessão. Retorna null se não autenticado neste tenant. */
export async function getPanelContext(): Promise<PanelContext | null> {
  const org = await getTenant();
  const session = getSession();
  if (!session || (!session.master && session.orgId !== org.id)) return null;

  const master = Boolean(session.master);
  const role: SessionRole = master ? "ORG_ADMIN" : session.role ?? "ORG_ADMIN";
  const isAgent = role === "AGENT";

  // Vínculo corretor↔usuário sempre fresco do banco: o admin pode ter
  // vinculado DEPOIS do login, e o cookie não sabe disso.
  let agentId: string | null = null;
  if (isAgent) {
    agentId = session.agentId ?? null;
    if (session.userId && process.env.DATABASE_URL) {
      try {
        const a = await prisma.agent.findFirst({
          where: { organizationId: org.id, userId: session.userId },
          select: { id: true },
        });
        agentId = a?.id ?? agentId;
      } catch (e) { console.error("getPanelContext(agent):", e); }
    }
  }

  return {
    org,
    email: session.email,
    userId: session.userId ?? null,
    role,
    agentId,
    master,
    isAdmin: master || role === "ORG_ADMIN",
    isManagerUp: master || role === "ORG_ADMIN" || role === "MANAGER",
    isAgent,
  };
}

/** Exige login neste tenant (qualquer papel). */
export async function requirePanel(): Promise<PanelContext> {
  const ctx = await getPanelContext();
  // Sem banco configurado o painel roda em modo demonstração (mesma regra do layout)
  if (!ctx && !process.env.DATABASE_URL) {
    const org = await getTenant();
    return {
      org, email: "demo", userId: null, role: "ORG_ADMIN", agentId: null,
      master: false, isAdmin: true, isManagerUp: true, isAgent: false,
    };
  }
  if (!ctx) redirect("/login");
  if (ctx!.role === "CLIENT") redirect("/cliente"); // cliente tem portal próprio
  return ctx!;
}

/** Exige GERENTE ou acima (corretor não passa). */
export async function requireManagerUp(): Promise<PanelContext> {
  const ctx = await requirePanel();
  if (!ctx.isManagerUp) redirect("/painel?negado=1");
  return ctx;
}

/** Exige ADMIN da imobiliária (ou master). */
export async function requireAdmin(): Promise<PanelContext> {
  const ctx = await requirePanel();
  if (!ctx.isAdmin) redirect("/painel?negado=1");
  return ctx;
}

export const ROLE_LABEL: Record<string, string> = {
  ORG_ADMIN: "Administrador",
  MANAGER: "Gerente",
  AGENT: "Corretor",
  PLATFORM_ADMIN: "Plataforma",
  CLIENT: "Cliente",
  OWNER: "Proprietário",
};
