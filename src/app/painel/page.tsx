import { getTenant } from "@/lib/tenant";
import { getDashboard } from "@/lib/data";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const org = await getTenant();
  const d = await getDashboard(org.id);

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
