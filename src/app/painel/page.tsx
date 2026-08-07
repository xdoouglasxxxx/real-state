import { requirePanel } from "@/lib/perm";
import { getDashboard, getAgentDashboard } from "@/lib/data";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { negado?: string; bemvindo?: string } }) {
  const ctx = await requirePanel();

  // -------- Portal do Corretor: números só DELE (sem vínculo = zeros, nunca os da imobiliária) --------
  if (ctx.isAgent) {
    const d = ctx.agentId
      ? await getAgentDashboard(ctx.org.id, ctx.agentId)
      : { activeLeads: 0, newLeadsMonth: 0, scheduledVisits: 0, myProperties: 0,
          commissionPending: 0, commissionPaidMonth: 0, meta: 0, realizado: 0, goalPct: 0 };
    const KPIS: [string, string][] = [
      [String(d.activeLeads), "leads ativos comigo"],
      [String(d.newLeadsMonth), "novos leads no mês"],
      [String(d.scheduledVisits), "visitas agendadas"],
      [String(d.myProperties), "imóveis sob minha carteira"],
      [brl(d.commissionPending), "comissões a receber"],
      [brl(d.commissionPaidMonth), "comissões pagas no mês"],
    ];
    return (
      <>
        <h1>Meu painel</h1>
        {searchParams.negado && <p className="pform-error">Você não tem permissão para acessar aquela área.</p>}
        {!ctx.agentId && <p className="pform-error">Seu usuário ainda não está vinculado a um perfil de corretor — peça ao administrador (Usuários → seu cadastro).</p>}
        <div className="kpis">
          {KPIS.map(([n, l]) => (
            <div className="kpi" key={l}><strong>{n}</strong><span>{l}</span></div>
          ))}
          {d.meta > 0 && (
            <div className="kpi">
              <strong>{d.goalPct}%</strong>
              <span>minha meta do mês · {brl(d.realizado)} de {brl(d.meta)}</span>
              <div className="meta-bar"><i style={{ width: `${d.goalPct}%` }} /></div>
            </div>
          )}
        </div>
        <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>
          Estes números são só seus: leads atribuídos a você, sua agenda e suas comissões.
        </p>
      </>
    );
  }

  // -------- Dashboard da imobiliária (admin/gerente) --------
  const d = await getDashboard(ctx.org.id);

  const KPIS: [string, string][] = [
    [brl(d.availableValue), `em imóveis disponíveis (${d.availableCount})`],
    [String(d.newLeads), "novos leads no mês"],
    [String(d.visits), "visitas marcadas"],
    [String(d.awaitingContracts), "contratos aguardando assinatura"],
    [String(d.proposals), "propostas em aberto"],
    [String(d.soldMonth), "imóveis vendidos este mês"],
    [`${d.conversion}%`, "conversão (leads → ganho)"],
  ];

  return (
    <>
      <h1>Hoje</h1>
      {searchParams.negado && <p className="pform-error">Você não tem permissão para acessar aquela área.</p>}
      <div className="kpis">
        {KPIS.map(([n, l]) => (
          <div className="kpi" key={l}><strong>{n}</strong><span>{l}</span></div>
        ))}
        <div className="kpi">
          <strong>{d.goalPct}%</strong>
          <span>meta do mês · {brl(d.realizado)} de {brl(d.meta)}</span>
          <div className="meta-bar"><i style={{ width: `${d.goalPct}%` }} /></div>
        </div>
      </div>
      <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>
        Os números vêm direto do Supabase (contratos, leads, visitas, metas).
        Sem banco conectado, valores de demonstração são exibidos.
      </p>
    </>
  );
}
