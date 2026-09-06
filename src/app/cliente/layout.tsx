import type { Metadata } from "next";
import { requireClientPortal } from "@/lib/perm";
import { logout } from "@/app/auth-actions";

export const metadata: Metadata = { title: "Área do cliente", robots: { index: false, follow: false } };

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  // Clientes e proprietários deste tenant entram aqui; time da imobiliária usa o /painel
  const { org } = await requireClientPortal();

  const [first, ...rest] = org.name.toUpperCase().split(" ");
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "1.6rem 1.2rem 4rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", marginBottom: "1.6rem", flexWrap: "wrap" }}>
        <span className="logo">{first} <em>{rest.join(" ") || "ESTATE"}</em></span>
        <nav style={{ display: "flex", gap: "1.2rem", alignItems: "baseline", flexWrap: "wrap" }}>
          <a href="/cliente" className="panel-link" style={{ padding: 0 }}>Início</a>
          <a href="/cliente/portal/favoritos" className="panel-link" style={{ padding: 0 }}>Favoritos</a>
          <a href="/cliente/portal/propostas" className="panel-link" style={{ padding: 0 }}>Propostas</a>
          <a href="/cliente/portal/visitas" className="panel-link" style={{ padding: 0 }}>Visitas</a>
          <a href="/cliente/portal/contratos" className="panel-link" style={{ padding: 0 }}>Contratos</a>
          <a href="/cliente/portal/configuracoes" className="panel-link" style={{ padding: 0 }}>Configurações</a>
          <a href="/" className="panel-link" style={{ padding: 0 }}>← Ver imóveis</a>
          <form action={logout} style={{ display: "inline" }}>
            <button className="panel-link panel-logout" type="submit" style={{ padding: 0 }}>Sair</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
