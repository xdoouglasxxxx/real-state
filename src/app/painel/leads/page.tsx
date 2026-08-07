import Link from "next/link";
import { requirePanel } from "@/lib/perm";
import { getLeadsBoardFull } from "@/lib/data";
import LeadsBoard from "@/components/painel/LeadsBoard";

export const dynamic = "force-dynamic";

export default async function Leads() {
  const ctx = await requirePanel();
  // Corretor vê apenas os leads dele; sem vínculo, vê VAZIO (nunca os dos outros)
  const leads = await getLeadsBoardFull(ctx.org.id, ctx.isAgent ? ctx.agentId ?? "-" : null);

  return (
    <>
      <div className="phead">
        <h1>{ctx.isAgent ? "Meus leads" : "Funil de leads"}</h1>
        <Link className="btn-solid" href="/painel/leads/novo">＋ Novo lead</Link>
      </div>
      {ctx.isAgent && !ctx.agentId && (
        <p className="pform-error">Seu usuário ainda não está vinculado a um perfil de corretor — peça ao administrador (Usuários → seu cadastro).</p>
      )}
      <LeadsBoard initial={leads as any} />
      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1rem" }}>
        Arraste os cartões entre as colunas para atualizar o estágio — salva sozinho.
        💬 abre o WhatsApp do cliente · ↗ abre a ficha completa.
      </p>
    </>
  );
}
