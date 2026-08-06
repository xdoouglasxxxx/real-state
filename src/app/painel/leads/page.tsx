import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getLeadsBoardFull } from "@/lib/data";
import LeadsBoard from "@/components/painel/LeadsBoard";

export const dynamic = "force-dynamic";

export default async function Leads() {
  const org = await getTenant();
  const leads = await getLeadsBoardFull(org.id);

  return (
    <>
      <div className="phead">
        <h1>Funil de leads</h1>
        <Link className="btn-solid" href="/painel/leads/novo">＋ Novo lead</Link>
      </div>
      <LeadsBoard initial={leads as any} />
      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1rem" }}>
        Arraste os cartões entre as colunas para atualizar o estágio — salva sozinho.
        💬 abre o WhatsApp do cliente · ↗ abre a ficha completa.
      </p>
    </>
  );
}
