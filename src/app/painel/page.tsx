import { requirePanel } from "@/lib/perm";
import { getDashboard, getAgentDashboard, getDashboardIntel, getAgentCopilot, leadTemp } from "@/lib/data";
import Link from "next/link";
import { brl, brlCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Variação vs. mesmo período do mês passado (▲ bom, ▼ atenção) */
function Delta({ v }: { v: number }) {
  if (v === 0) return <small className="delta" style={{ color: "var(--stone)" }}>— estável vs mês passado</small>;
  const up = v > 0;
  return (
    <small className="delta" style={{ color: up ? "#8fbb7d" : "#c67a6b" }}>
      {up ? "▲" : "▼"} {Math.abs(v) > 400 ? ">400" : Math.abs(v)}% vs mês passado
    </small>
  );
}

const NEGADO_MSG: Record<string, string> = {
  "1": "Você não tem permissão para acessar aquela área.",
  gerente: "Aquela área é para gerentes e administradores. Seus leads, agenda e imóveis continuam aqui — se precisar do acesso, fale com o administrador da imobiliária.",
  admin: "Aquela área é exclusiva do administrador (assinatura, configurações e usuários). Se precisar de algo lá, fale com quem administra a conta.",
};

export default async function Dashboard({ searchParams }: { searchParams: { negado?: string; bemvindo?: string } }) {
  const ctx = await requirePanel();

  // -------- Portal do Corretor: números só DELE (sem vínculo = zeros, nunca os da imobiliária) --------
  if (ctx.isAgent) {
    const [d, pilot] = ctx.agentId
      ? await Promise.all([getAgentDashboard(ctx.org.id, ctx.agentId), getAgentCopilot(ctx.org.id, ctx.agentId)])
      : [{ activeLeads: 0, newLeadsMonth: 0, scheduledVisits: 0, myProperties: 0,
          commissionPending: 0, commissionPaidMonth: 0, meta: 0, realizado: 0, goalPct: 0 },
         { top: [], cooling: [], coolingCount: 0, hotCommission: 0 }];
    const KPIS: [string, string][] = [
      [String(d.activeLeads), "leads ativos comigo"],
      [String(d.newLeadsMonth), "novos leads no mês"],
      [String(d.scheduledVisits), "visitas agendadas"],
      [String(d.myProperties), "imóveis sob minha carteira"],
      [brl(d.commissionPending), "comissões a receber"],
      [brl(d.commissionPaidMonth), "comissões pagas no mês"],
    ];
    const waPilot = (phone?: string | null, name?: string | null) =>
      `https://wa.me/55${String(phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${String(name ?? "").split(" ")[0]}! Tudo bem? 😊`)}`;
    return (
      <>
        <h1>Meu painel</h1>
        {searchParams.negado && <p className="pform-error">{NEGADO_MSG[searchParams.negado] ?? NEGADO_MSG["1"]}</p>}
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
        {(pilot.top.length > 0 || pilot.coolingCount > 0 || pilot.hotCommission > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", margin: "1.4rem 0" }}>
            <section className="ficha-box">
              <h2>⚡ Para atacar hoje</h2>
              {pilot.top.length === 0 && <p style={{ color: "var(--stone)" }}>Sem leads ativos na carteira.</p>}
              {pilot.top.map((l: any) => {
                const t = leadTemp(l.score);
                return (
                  <p key={l.id} style={{ marginBottom: ".5rem", fontSize: ".92rem" }}>
                    {t.icon} <Link href={`/painel/leads/${l.id}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                      <strong>{l.contact?.name}</strong>
                    </Link>
                    <span style={{ color: "var(--stone)" }}> · score {l.score}{l.property?.title ? ` · ${l.property.title}` : ""}</span>
                    {l.contact?.phone && <> · <a href={waPilot(l.contact.phone, l.contact.name)} target="_blank" rel="noopener">💬</a></>}
                  </p>
                );
              })}
              <p style={{ color: "var(--stone)", fontSize: ".78rem" }}>Seus leads mais quentes, por score — comece o dia por eles.</p>
            </section>

            <section className="ficha-box" style={pilot.coolingCount > 0 ? { borderColor: "var(--brass)" } : undefined}>
              <h2>🥶 Esfriando ({pilot.coolingCount})</h2>
              {pilot.coolingCount === 0 && <p style={{ color: "var(--stone)" }}>Ninguém esfriando — carteira em dia. ✨</p>}
              {pilot.cooling.map((l: any) => (
                <p key={l.id} style={{ marginBottom: ".5rem", fontSize: ".92rem" }}>
                  <Link href={`/painel/leads/${l.id}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{l.contact?.name}</Link>
                  <span style={{ color: "var(--stone)" }}> · {Math.floor((Date.now() - +new Date(l.updatedAt)) / 86400000)} dias sem movimento</span>
                  {l.contact?.phone && <> · <a href={waPilot(l.contact.phone, l.contact.name)} target="_blank" rel="noopener">💬</a></>}
                </p>
              ))}
              <p style={{ color: "var(--stone)", fontSize: ".78rem" }}>Leads novos/contatados parados há 72h+ — cada hora custa conversão.</p>
            </section>

            <section className="ficha-box">
              <h2>💰 Em jogo agora</h2>
              <div className="kpi" style={{ border: "none", padding: 0 }}>
                <strong>{brlCompact(pilot.hotCommission)}</strong>
                <span>comissão potencial em negociação</span>
              </div>
              <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".6rem" }}>
                Estimativa: imóveis dos seus leads em proposta/financiamento/contrato × sua comissão. Fechar é embolsar.
              </p>
            </section>
          </div>
        )}
        <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>
          Estes números são só seus: leads atribuídos a você, sua agenda e suas comissões.
        </p>
      </>
    );
  }

  // -------- Dashboard 2.0 da imobiliária (admin/gerente) --------
  const [d, intel] = await Promise.all([getDashboard(ctx.org.id), getDashboardIntel(ctx.org.id, { finance: ctx.isAdmin })]);

  // Projeção da meta pelo ritmo do mês + pipeline ponderado
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const paceProjection = d.realizado > 0 ? Math.round((d.realizado / now.getDate()) * daysInMonth) : 0;
  const pacePct = d.meta > 0 ? Math.round((100 * paceProjection) / d.meta) : 0;
  const paceLabel = pacePct > 200 ? "bem acima de 100%" : `~${pacePct}%`;
  const earlyMonth = now.getDate() < 8; // poucos dias fechados distorcem a projeção linear
  const gap = Math.max(0, d.meta - d.realizado);

  const maxFunnel = Math.max(1, ...intel.funnel.map((f: any) => f.count));
  const maxSource = Math.max(1, ...intel.sources.map((s: any) => s.count));

  return (
    <>
      <h1>Hoje</h1>
      {searchParams.negado && <p className="pform-error">{NEGADO_MSG[searchParams.negado] ?? NEGADO_MSG["1"]}</p>}

      {/* ---- Requer sua atenção hoje ---- */}
      <section className="ficha-box" style={{ marginBottom: "1.4rem", borderColor: intel.alerts.length ? "var(--brass)" : undefined }}>
        <h2>⚡ Requer sua atenção hoje</h2>
        {intel.alerts.length === 0 && (
          <p style={{ color: "var(--stone)" }}>Tudo em dia — nenhum contrato parado, lead esfriando ou imóvel encalhado. ✨</p>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".45rem" }}>
          {intel.alerts.map((a: any) => (
            <li key={a.text}>
              <Link href={a.href} className="alert-li">
                <span>{a.icon}</span><span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{a.text}</span>
              </Link>
            </li>
          ))}
          {gap > 0 && d.meta > 0 && (
            <li className="alert-li" style={{ color: "var(--stone)" }}>
              <span>🎯</span>
              <span>
                Faltam {brl(gap)} para a meta. No ritmo atual o mês fecha em {paceLabel}{earlyMonth ? " (início de mês — projeção ainda instável)" : ` (${brl(paceProjection)})`};
                pipeline ponderado cobre {brl(intel.pipeline)}{intel.pipeline < gap ? " — abaixo do necessário: priorize propostas e assinaturas" : " — dá para bater, é fechar o que está na mesa"}.
              </span>
            </li>
          )}
        </ul>
      </section>

      {/* ---- KPIs com variação ---- */}
      <div className="kpis">
        <div className="kpi">
          <strong>{brlCompact(d.availableValue)}</strong>
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
          <span>meta do mês · {brlCompact(d.realizado)} de {brlCompact(d.meta)}</span>
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
