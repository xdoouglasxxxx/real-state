import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarBadges } from "@/lib/data";
import { logout } from "@/app/auth-actions";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();

  // Guarda de sessão: precisa estar logado NESTE tenant (ou ser master)
  const session = getSession();
  const authorized = session && (session.master || session.orgId === org.id);
  if (!authorized && process.env.DATABASE_URL) redirect("/login");

  // Usuário desativado perde o acesso mesmo com cookie válido
  if (session?.userId && process.env.DATABASE_URL) {
    try {
      const u = await prisma.user.findFirst({
        where: { id: session.userId, organizationId: session.orgId },
        select: { isActive: true },
      });
      if (!u?.isActive) redirect("/login?erro=1");
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e) throw e; // relança o redirect
    }
  }

  // Papel: sessões antigas (sem role) eram sempre do admin
  const role = session?.master ? "ORG_ADMIN" : session?.role ?? "ORG_ADMIN";
  if (role === "CLIENT") redirect("/cliente"); // comprador tem portal próprio
  const isAdmin = session?.master || role === "ORG_ADMIN";
  const isAgent = !session?.master && role === "AGENT";

  // Badges de pendência (escopo do corretor quando for AGENT)
  let badges = { coldLeads: 0, visitsToday: 0 };
  if (process.env.DATABASE_URL) {
    try {
      const agentScope = isAgent && session?.userId
        ? (await prisma.agent.findFirst({ where: { organizationId: org.id, userId: session.userId }, select: { id: true } }))?.id ?? "-"
        : null;
      badges = await getSidebarBadges(org.id, agentScope);
    } catch {}
  }
  const Badge = ({ n, title }: { n: number; title: string }) =>
    n > 0 ? <span className="nav-badge" title={title}>{n}</span> : null;

  const [first, ...rest] = org.name.toUpperCase().split(" ");
  return (
    <div className="panel">
      <aside className="panel-side">
        <Link className="logo" href="/painel">{first} <em>{rest.join(" ") || "ESTATE"}</em></Link>
        <span className="panel-slug">{org.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? ""}</span>

        <Link className="panel-link" href="/painel">{isAgent ? "Meu painel" : "Dashboard"}</Link>
        <Link className="panel-link" href="/painel/leads">{isAgent ? "Meus leads" : "Leads"}<Badge n={badges.coldLeads} title="Leads esfriando (72h sem contato)" /></Link>
        <Link className="panel-link" href="/painel/agenda">{isAgent ? "Minha agenda" : "Agenda"}<Badge n={badges.visitsToday} title="Visitas hoje" /></Link>
        <Link className="panel-link" href="/painel/imoveis">Imóveis</Link>
        {!isAgent && <Link className="panel-link" href="/painel/corretores">Corretores</Link>}
        {isAdmin && <Link className="panel-link" href="/painel/usuarios">Usuários</Link>}
        {isAdmin && <Link className="panel-link" href="/painel/assinatura">Assinatura</Link>}
        {isAdmin && <Link className="panel-link" href="/painel/configuracoes">Configurações</Link>}
        <Link className="panel-link" href="/painel/conta">Minha conta</Link>

        <Link className="panel-link" href="/" style={{ marginTop: "auto" }}>← Ver site</Link>
        <form action={logout}>
          <button className="panel-link panel-logout" type="submit">Sair</button>
        </form>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
