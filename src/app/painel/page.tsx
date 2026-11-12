import { requirePanel } from "@/lib/perm";
import { getAgentDashboard, getDashboardIntel, getAgentCopilot, getTasksDue, leadTemp } from "@/lib/data";
import Link from "next/link";
import { brl, brlCompact, SOURCE_LABEL } from "@/lib/format";
import { toggleTask } from "./leads/actions";
import AlertIcon from "@/components/painel/AlertIcon";
import DashFilters from "@/components/painel/DashFilters";
import FunnelCard from "@/components/painel/FunnelCard";
import SourceDonut from "@/components/painel/SourceDonut";
import styles from "@/components/painel/DashParts.module.css";
import { prisma } from "@/lib/prisma";
import { getAgentOptions, getDashboardPeriod } from "@/lib/dashboard";
import { dashHref, parsePeriod } from "@/lib/periods";
import { paceProjection, pctChange } from "@/lib/dash-calc";

/** Lista de tarefas do dia/atrasadas — usada no painel do gestor e do corretor. */
function TasksBox({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return null;
  return (
    <section className="ficha-box" style={{ marginBottom: "1.4rem", borderColor: "var(--brass)" }}>
      <h2>Tarefas de hoje e atrasadas</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".45rem" }}>
        {tasks.map((t: any) => {
          const overdue = +new Date(t.dueAt) < Date.now();
          return (
            <li key={t.id} style={{ display: "flex", gap: ".5rem", alignItems: "baseline", fontSize: ".92rem" }}>
              <form action={toggleTask} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="back" value="painel" />
                <button type="submit" className="panel-link" style={{ padding: 0 }} title="Concluir tarefa">☐</button>
              </form>
              <span>
                {t.title} —{" "}
                <Link href={`/painel/leads/${t.lead.id}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                  {t.lead.contact?.name}
                </Link>
                <span style={{ color: overdue ? "#e57373" : "var(--stone)", fontSize: ".8rem" }}>
                  {" "}· {new Date(t.dueAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  {overdue ? " · atrasada" : ""}{t.agent?.name ? ` · ${t.agent.name}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export const dynamic = "force-dynamic";

/** Variação vs. o mesmo tempo decorrido do período anterior (▲ bom, ▼ atenção) */
function Delta({ v, cmp = "vs mês anterior" }: { v: number; cmp?: string }) {
  if (v === 0) return <small className="delta" style={{ color: "var(--stone)" }}>— estável {cmp}</small>;
  const up = v > 0;
  return (
    <small className="delta" style={{ color: up ? "#8fbb7d" : "#c67a6b" }}>
      {up ? "▲" : "▼"} {Math.abs(v) > 400 ? ">400" : Math.abs(v)}% {cmp}
    </small>
  );
}

const NEGADO_MSG: Record<string, string> = {
  "1": "Você não tem permissão para acessar aquela área.",
  gerente: "Aquela área é para gerentes e administradores. Seus leads, agenda e imóveis continuam aqui — se precisar do acesso, fale com o administrador da imobiliária.",
  admin: "Aquela área é exclusiva do administrador (assinatura, configurações e usuários). Se precisar de algo lá, fale com quem administra a conta.",
};

export default async function Dashboard({ searchParams }: { searchParams: { negado?: string; bemvindo?: string; periodo?: string; corretor?: string } }) {
  const ctx = await requirePanel();

  // -------- Portal do Corretor: números só DELE (sem vínculo = zeros, nunca os da imobiliária) --------
  if (ctx.isAgent) {
    const [d, pilot, myTasks] = ctx.agentId
      ? await Promise.all([
          getAgentDashboard(ctx.org.id, ctx.agentId),
          getAgentCopilot(ctx.org.id, ctx.agentId),
          getTasksDue(ctx.org.id, ctx.agentId),
        ])
      : [{ activeLeads: 0, newLeadsMonth: 0, scheduledVisits: 0, myProperties: 0,
          commissionPending: 0, commissionPaidMonth: 0, meta: 0, realizado: 0, goalPct: 0 },
         { top: [], cooling: [], coolingCount: 0, hotCommission: 0 }, [] as any[]];
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
        <TasksBox tasks={myTasks} />
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
              <h2>Para atacar hoje</h2>
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
              <h2>Esfriando ({pilot.coolingCount})</h2>
              {pilot.coolingCount === 0 && <p style={{ color: "var(--stone)" }}>Ninguém esfriando — carteira em dia.</p>}
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
              <h2>Em jogo agora</h2>
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

  // -------- Dashboard 2.0 da imobiliária (admin/gerente): período e corretor na URL --------
  const periodo = parsePeriod(searchParams.periodo);
  const agents = process.env.DATABASE_URL
    ? await getAgentOptions(prisma, ctx.org.id).catch((e) => { console.error("dashboard agentes:", e); return [] as { id: string; name: string }[]; })
    : [];
  const corretor = agents.some((a) => a.id === searchParams.corretor) ? (searchParams.corretor as string) : null;
  const corretorNome = agents.find((a) => a.id === corretor)?.name ?? null;

  const [dash, intel, tasksDue] = await Promise.all([
    process.env.DATABASE_URL
      ? getDashboardPeriod(prisma, ctx.org.id, { period: periodo, agentId: corretor }).catch((e) => { console.error("dashboard:", e); return null; })
      : Promise.resolve(null),
    getDashboardIntel(ctx.org.id, { finance: ctx.isAdmin }),
    getTasksDue(ctx.org.id),
  ]);

  // Projeção da meta pelo ritmo do período + (só sem filtro de corretor) pipeline ponderado da imobiliária
  const periodoNome = { mes: "mês", tri: "trimestre", ano: "ano" }[periodo];
  const projected = dash ? paceProjection(dash.realizado, dash.elapsedFraction) : 0;
  const pacePct = dash && dash.meta > 0 ? Math.round((100 * projected) / dash.meta) : 0;
  const paceLabel = pacePct > 200 ? "bem acima de 100%" : `~${pacePct}%`;
  const earlyPeriod = !!dash && dash.elapsedFraction < 0.25; // pouco tempo decorrido distorce a projeção linear
  const gap = dash ? Math.max(0, dash.meta - dash.realizado) : 0;

  return (
    <>
      <div className="phead">
        <h1>Hoje</h1>
        <DashFilters period={periodo} agent={corretor} agents={agents} />
      </div>
      {corretorNome && (
        <p className={styles.filterNote}>
          Mostrando só os números de <strong>{corretorNome}</strong> · <Link href={dashHref(periodo, null)}>ver todos</Link>.
          Tarefas e alertas continuam sendo da imobiliária toda.
        </p>
      )}
      {searchParams.negado && <p className="pform-error">{NEGADO_MSG[searchParams.negado] ?? NEGADO_MSG["1"]}</p>}

      <TasksBox tasks={tasksDue} />

      {/* ---- Requer sua atenção hoje ---- */}
      <section className="ficha-box" style={{ marginBottom: "1.4rem", borderColor: intel.alerts.length ? "var(--brass)" : undefined }}>
        <h2>Requer sua atenção hoje</h2>
        {intel.alerts.length === 0 && (
          <p style={{ color: "var(--stone)" }}>Tudo em dia — nenhum contrato parado, lead esfriando ou imóvel encalhado.</p>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".45rem" }}>
          {intel.alerts.map((a: any) => (
            <li key={a.text}>
              <Link href={a.href} className="alert-li">
                <span className="alert-ic"><AlertIcon emoji={a.icon} /></span><span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{a.text}</span>
              </Link>
            </li>
          ))}
          {dash && gap > 0 && dash.meta > 0 && (
            <li className="alert-li" style={{ color: "var(--stone)" }}>
              <span className="alert-ic"><AlertIcon emoji="🎯" /></span>
              <span>
                Faltam {brl(gap)} para a meta {corretorNome ? `de ${corretorNome} ` : ""}do {periodoNome}. No ritmo atual o {periodoNome} fecha em {paceLabel}{earlyPeriod ? ` (início de ${periodoNome} — projeção ainda instável)` : ` (${brl(projected)})`}
                {corretor ? "." : <>; pipeline ponderado cobre {brl(intel.pipeline)}{intel.pipeline < gap ? " — abaixo do necessário: priorize propostas e assinaturas" : " — dá para bater, é fechar o que está na mesa"}.</>}
              </span>
            </li>
          )}
        </ul>
      </section>

      {!dash && (
        <p className="pform-error">
          {process.env.DATABASE_URL ? "Não foi possível carregar os números agora. Tente de novo em instantes." : "Modo demonstração: conecte o banco para ver os números do período."}
        </p>
      )}

      {dash && (
        <>
          <p style={{ color: "var(--stone)", fontSize: ".85rem", margin: "-.4rem 0 1rem" }}>
            {dash.label}, até agora · comparado {dash.cmp.replace(/^vs /, "com o ")}
          </p>

          {/* ---- KPIs com variação ---- */}
          <div className="kpis">
            <div className="kpi">
              <strong>{brlCompact(dash.availableValue)}</strong>
              <span>em imóveis disponíveis ({dash.availableCount})</span>
            </div>
            <div className="kpi">
              <strong>{dash.newLeads}</strong>
              <span>novos leads {dash.noun}<Delta v={pctChange(dash.newLeads, dash.newLeadsPrev)} cmp={dash.cmp} /></span>
            </div>
            <div className="kpi">
              <strong>{dash.scheduledVisits}</strong>
              <span>visitas marcadas · {dash.visitsDone} realizadas {dash.noun}<Delta v={pctChange(dash.visitsDone, dash.visitsDonePrev)} cmp={dash.cmp} /></span>
            </div>
            <div className="kpi">
              <strong>{dash.awaitingContracts}</strong>
              <span>contratos aguardando assinatura</span>
            </div>
            <div className="kpi">
              <strong>{dash.openProposals}</strong>
              <span>propostas em aberto</span>
            </div>
            <div className="kpi">
              <strong>{dash.sold}</strong>
              <span>vendidos {dash.noun}<Delta v={pctChange(dash.sold, dash.soldPrev)} cmp={dash.cmp} /></span>
            </div>
            <div className="kpi">
              <strong>{dash.conversion}%</strong>
              <span>conversão (leads {dash.noun} → venda)</span>
            </div>
            <div className="kpi">
              <strong>{dash.goalPct}%</strong>
              <span>meta do {periodoNome} · {brlCompact(dash.realizado)} de {brlCompact(dash.meta)}</span>
              <div className="meta-bar"><i style={{ width: `${dash.goalPct}%` }} /></div>
              {dash.meta === 0 && <Link href="/painel/metas" style={{ color: "var(--brass)", fontSize: ".8rem" }}>Definir meta</Link>}
            </div>
          </div>

          {/* ---- Funil + Origem + Por corretor ---- */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem", marginTop: "1.4rem", alignItems: "start" }}>
            <FunnelCard
              steps={dash.funnel}
              worstIndex={dash.worst ? dash.worst.toIndex : null}
              worstText={dash.worst ? `Maior perda: ${dash.funnel[dash.worst.fromIndex].label} → ${dash.funnel[dash.worst.toIndex].label} (${dash.worst.pct}% avançam)` : null}
            />
            <SourceDonut
              total={dash.newLeads}
              items={dash.sources.map((x) => ({ label: SOURCE_LABEL[x.source] ?? x.source, count: x.count, won: x.won, share: x.share }))}
            />

            <section className="ficha-box">
              <h2>Por corretor</h2>
              {dash.ranking.length === 0 && <p style={{ color: "var(--stone)" }}>Sem leads, visitas ou vendas de corretores neste período.</p>}
              {dash.ranking.length > 0 && (
                <table className="table" style={{ fontSize: ".85rem" }}>
                  <thead><tr><th></th><th>Corretor</th><th>Leads</th><th>Visitas</th><th>Vendas</th></tr></thead>
                  <tbody>
                    {dash.ranking.map((r, i) => (
                      <tr key={r.id} className={r.id === corretor ? styles.rowOn : undefined}>
                        <td>{`${i + 1}º`}</td>
                        <td>
                          <Link className={styles.rankLink} href={dashHref(periodo, r.id === corretor ? null : r.id)} aria-current={r.id === corretor ? "true" : undefined}>{r.name}</Link>
                        </td>
                        <td>{r.leads}</td><td>{r.visits}</td><td>{r.won}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".6rem" }}>
                Leads criados, visitas realizadas e vendas {dash.noun}. Clique no nome para filtrar o painel.
              </p>
            </section>
          </div>
        </>
      )}

      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1.2rem" }}>
        Os números vêm direto do banco, em tempo real. Variações comparam o mesmo tempo decorrido do período anterior.
        Imóveis disponíveis, visitas marcadas, contratos aguardando e propostas em aberto são a situação de agora, não do período.
      </p>
      {dash && (
        <details style={{ color: "var(--stone)", fontSize: ".8rem", marginTop: ".6rem" }}>
          <summary style={{ cursor: "pointer" }}>Conferir estes números no SQL</summary>
          <p style={{ marginTop: ".4rem" }}>
            Horários usados (UTC): período {dash.range.ini} → {dash.range.fim}; anterior {dash.range.pini} → {dash.range.pfim}.
            As consultas prontas estão no DASHBOARD.md.
          </p>
        </details>
      )}
    </>
  );
}
