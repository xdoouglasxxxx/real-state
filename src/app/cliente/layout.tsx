import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/auth-actions";

export const metadata: Metadata = { title: "Área do cliente", robots: { index: false, follow: false } };

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
  const session = getSession();

  // Clientes e proprietários deste tenant entram aqui; time da imobiliária usa o /painel
  if (!session || session.orgId !== org.id) redirect("/login");
  if (session.role !== "CLIENT" && session.role !== "OWNER") redirect("/painel");

  const [first, ...rest] = org.name.toUpperCase().split(" ");
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "1.6rem 1.2rem 4rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", marginBottom: "1.6rem", flexWrap: "wrap" }}>
        <span className="logo">{first} <em>{rest.join(" ") || "ESTATE"}</em></span>
        <nav style={{ display: "flex", gap: "1.2rem", alignItems: "baseline" }}>
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
