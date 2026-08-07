import Link from "next/link";
import { requirePanel } from "@/lib/perm";
import { getDashboard, getAgentDashboard, getDashboardIntel } from "@/lib/data";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Variação vs. mesmo período do mês passado (▲ bom, ▼ atenção) */
function Delta({ v }: { v: number }) {
  if (v === 0) return <small style={{ fontSize: ".72rem", color: "var(--stone)" }}> — estável</small>;
  const up = v > 0;
  return (
    <small style={{ fontSize: ".72rem", color: up ? "#8fbb7d" : "#c67a6b", whiteSpace: "nowrap" }}>
      {" "}{up ? "▲" : "▼"} {Math.abs(v)}% vs mês passado
    </small>
  );
}

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

  // -------- Dashboard 2.0 da imobiliária (admin/gerente) --------
  const [d, intel] = await Promise.all([getDashboard(ctx.org.id), getDashboardIntel(ctx.org.id)]);

  // Projeção da meta pelo ritmo do mês + pipeline ponderado
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const paceProjection = d.realizado > 0 ? Math.round((d.realizado / now.getDate()) * daysInMonth) : 0;
  const pacePct = d.meta > 0 ? Math.round((100 * paceProjection) / d.meta) : 0;
  const gap = Math.max(0, d.meta - d.realizado);

  const maxFunnel = Math.max(1, ...intel.funnel.map((f: any) => f.count));
  const maxSource = Math.max(1, ...intel.sources.map((s: any) => s.count));

  return (
    <>
      <h1>Hoje</h1>
      {searchParams.negado && <p className="pform-error">Você não tem permissão para acessar aquela área.</p>}

      {/* ---- Requer sua atenção hoje ---- */}
      <section className="ficha-box" style={{ marginBottom: "1.4rem", borderColor: intel.alerts.length ? "var(--brass)" : undefined }}>
        <h2>⚡ Requer sua atenção hoje</h2>
        {intel.alerts.length === 0 && (
          <p style={{ color: "var(--stone)" }}>Tudo em dia — nenhum contrato parado, lead esfriando ou imóvel encalhado. ✨</p>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".45rem" }}>
          {intel.alerts.map((a: any) => (
            <li key={a.text}>
              <Link href={a.href} style={{ display: "flex", gap: ".55rem", alignItems: "baseline" }}>
                <span>{a.icon}</span><span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{a.text}</span>
              </Link>
            </li>
          ))}
          {gap > 0 && d.meta > 0 && (
            <li style={{ display: "flex", gap: ".55rem", alignItems: "baseline", color: "var(--stone)" }}>
              <span>🎯</span>
              <span>
                Faltam {brl(gap)} para a meta. No ritmo atual o mês fecha em ~{pacePct}% ({brl(paceProjection)});
                pipeline ponderado cobre {brl(intel.pipeline)}{intel.pipeline < gap ? " — abaixo do necessário: priorize propostas e assinaturas" : " — dá para bater, é fechar o que está na mesa"}.
              </span>
            </li>
          )}
        </ul>
      </section>

      {/* ---- KPIs com variação ---- */}
      <div className="kpis">
        <div className="kpi">
          <strong>{brl(d.availableValue)}</strong>
          <span>em imóveis disponíveis ({d.availableCount})</span>
        </div>
        <div className="kpi">
          <strong>{d.newLeads}</strong>
          <span>novos leads no mês{intel.deltas && <Delta v={intel.deltas.newLeads} />}</span>
        </div>
        <div className="kpi">
          <strong>{d.visits}</strong>
          <span>visitas marcadas · {intel.visitsDoneMonth} realizadas no mês{intel.deltas && <Delta v={intel.deltas.visitsDone} />}</span>
        </div>
        <div className="kpi">
          <strong>{d.awaitingContracts}</strong>
          <span>contratos aguardando assinatura</span>
        </div>
        <div className="kpi">
          <strong>{d.proposals}</strong>
          <span>propostas em aberto</span>
        </div>
        <div className="kpi">
          <strong>{d.soldMonth}</strong>
          <span>vendidos este mês{intel.deltas && <Delta v={intel.deltas.sold} />}</span>
        </div>
        <div className="kpi">
          <strong>{d.conversion}%</strong>
          <span>conversão (leads → ganho)</span>
        </div>
        <div className="kpi">
          <strong>{d.goalPct}%</strong>
          <span>meta do mês · {brl(d.realizado)} de {brl(d.meta)}</span>
          <div className="meta-bar"><i style={{ width: `${d.goalPct}%` }} /></div>
        </div>
      </div>

      {/* ---- Funil + Origem + Ranking ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", marginTop: "1.4rem" }}>
        <section className="ficha-box">
          <h2>Funil ativo</h2>
          {intel.funnel.map((f: any) => (
            <div key={f.stage} style={{ marginBottom: ".55rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: ".2rem" }}>
                <span>{f.label}</span><span style={{ color: "var(--stone)" }}>{f.count}</span>
              </div>
              <div className="meta-bar"><i style={{ width: `${Math.round((100 * f.count) / maxFunnel)}%` }} /></div>
            </div>
          ))}
          <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".6rem" }}>Leads ativos por estágio (perdidos e ganhos fora).</p>
        </section>

        <section className="ficha-box">
          <h2>Origem dos leads · 90 dias</h2>
          {intel.sources.length === 0 && <p style={{ color: "var(--stone)" }}>Sem leads no período.</p>}
          {intel.sources.map((s: any) => (
            <div key={s.source} style={{ marginBottom: ".55rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: ".2rem" }}>
                <span>{s.source}</span>
                <span style={{ color: "var(--stone)" }}>{s.count} lead{s.count > 1 ? "s" : ""}{s.won > 0 ? ` · ${s.won} venda${s.won > 1 ? "s" : ""}` : ""}</span>
              </div>
              <div className="meta-bar"><i style={{ width: `${Math.round((100 * s.count) / maxSource)}%` }} /></div>
            </div>
          ))}
          <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".6rem" }}>Onde investir: volume + vendas por canal.</p>
        </section>

        <section className="ficha-box">
          <h2>Ranking do mês</h2>
          {intel.ranking.length === 0 && <p style={{ color: "var(--stone)" }}>Sem visitas realizadas ou vendas registradas ainda neste mês.</p>}
          {intel.ranking.length > 0 && (
            <table className="table" style={{ fontSize: ".85rem" }}>
              <thead><tr><th></th><th>Corretor</th><th>Visitas</th><th>Vendas</th></tr></thead>
              <tbody>
                {intel.ranking.map((r: any, i: number) => (
                  <tr key={r.name}>
                    <td>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</td>
                    <td>{r.name}</td><td>{r.visits}</td><td>{r.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".6rem" }}>Visitas realizadas e negócios ganhos no mês.</p>
        </section>
      </div>

      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1.2rem" }}>
        Os números vêm direto do Supabase, em tempo real. Variações comparam com o mesmo período do mês anterior.
      </p>
    </>
  );
}
