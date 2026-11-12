import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSidebarBadges } from "@/lib/data";
import { logout } from "@/app/auth-actions";
import NavLink from "@/components/painel/NavLink";
import { readableAccent } from "@/lib/contrast";
import "./painel-theme.css";

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
  if (role === "OWNER") redirect("/login?erro=perfil"); // proprietário não tem painel ainda
  const isAdmin = session?.master || role === "ORG_ADMIN";
  const isAgent = !session?.master && role === "AGENT";

  // Badges de pendência (escopo do corretor quando for AGENT)
  let badges = { coldLeads: 0, visitsToday: 0, tasksDue: 0 };
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
    <div className="panel" style={{ "--brass": readableAccent(org.themeBrass) } as React.CSSProperties}>
      <aside className="panel-side">
        <Link className="logo" href="/painel">{first} <em>{rest.join(" ") || "ESTATE"}</em></Link>
        <span className="panel-slug">{org.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? ""}</span>

        <NavLink href="/painel">{isAgent ? "Meu painel" : "Dashboard"}<Badge n={badges.tasksDue} title="Tarefas de hoje e atrasadas" /></NavLink>
        <NavLink href="/painel/agente">Agente do dia</NavLink>
        <NavLink href="/painel/leads">{isAgent ? "Meus leads" : "Leads"}<Badge n={badges.coldLeads} title="Leads esfriando (72h sem contato)" /></NavLink>
        <NavLink href="/painel/agenda">{isAgent ? "Minha agenda" : "Agenda"}<Badge n={badges.visitsToday} title="Visitas hoje" /></NavLink>
        <NavLink href="/painel/imoveis">Imóveis</NavLink>
        <NavLink href="/painel/mapa">Mapa</NavLink>
        {!isAgent && <NavLink href="/painel/corretores">Corretores</NavLink>}
        {!isAgent && <NavLink href="/painel/metas">Metas</NavLink>}
        {!isAgent && <NavLink href="/painel/documentos">Documentos</NavLink>}
        {!isAgent && <NavLink href="/painel/locacao">Locação</NavLink>}
        {isAdmin && <NavLink href="/painel/financeiro">Financeiro</NavLink>}
        {isAdmin && <NavLink href="/painel/usuarios">Usuários</NavLink>}
        {isAdmin && <NavLink href="/painel/assinatura">Assinatura</NavLink>}
        {isAdmin && <NavLink href="/painel/modelos">Modelos</NavLink>}
        {isAdmin && <NavLink href="/painel/configuracoes">Configurações</NavLink>}
        <NavLink href="/painel/conta">Minha conta</NavLink>

        <Link className="panel-link" href="/" style={{ marginTop: "auto" }}>← Ver site</Link>
        <form action={logout}>
          <button className="panel-link panel-logout" type="submit">Sair</button>
        </form>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
