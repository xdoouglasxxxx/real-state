import Link from "next/link";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
  const [first, ...rest] = org.name.toUpperCase().split(" ");
  return (
    <div className="panel">
      <aside className="panel-side">
        <Link className="logo" href="/painel">{first} <em>{rest.join(" ") || "ESTATE"}</em></Link>
        <Link className="panel-link" href="/painel">Dashboard</Link>
        <Link className="panel-link" href="/painel/leads">Leads</Link>
        <Link className="panel-link" href="/painel/imoveis">Imóveis</Link>
        <Link className="panel-link" href="/" style={{ marginTop: "auto" }}>← Ver site</Link>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
