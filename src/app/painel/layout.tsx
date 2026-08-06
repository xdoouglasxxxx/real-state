import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/auth-actions";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();

  // Guarda de sessão: precisa estar logado NESTE tenant (ou ser master)
  const session = getSession();
  const authorized = session && (session.master || session.orgId === org.id);
  if (!authorized && process.env.DATABASE_URL) redirect("/login");

  const [first, ...rest] = org.name.toUpperCase().split(" ");
  return (
    <div className="panel">
      <aside className="panel-side">
        <Link className="logo" href="/painel">{first} <em>{rest.join(" ") || "ESTATE"}</em></Link>
        <Link className="panel-link" href="/painel">Dashboard</Link>
        <Link className="panel-link" href="/painel/leads">Leads</Link>
        <Link className="panel-link" href="/painel/imoveis">Imóveis</Link>
        <Link className="panel-link" href="/painel/configuracoes">Configurações</Link>
        <Link className="panel-link" href="/" style={{ marginTop: "auto" }}>← Ver site</Link>
        <form action={logout}>
          <button className="panel-link panel-logout" type="submit">Sair</button>
        </form>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
