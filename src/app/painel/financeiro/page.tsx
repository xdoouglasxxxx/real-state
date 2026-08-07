import Link from "next/link";
import { requireAdmin } from "@/lib/perm";
import { getFinance, getAgents, getPanelProperties, FIN_CATEGORY } from "@/lib/data";
import { brl, brlCompact } from "@/lib/format";
import { createFinanceEntry, toggleFinancePaid, payCommission } from "./actions";
import MoneyInput from "@/components/painel/MoneyInput";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function Financeiro({ searchParams }: { searchParams: { mes?: string; salvo?: string; erro?: string; comissao?: string; filtro?: string; cat?: string; q?: string } }) {
  const ctx = await requireAdmin();

  // Mês selecionado (?mes=2026-08); padrão = mês atual
  const now = new Date();
  const [y, m] = (searchParams.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-").map(Number);
  const year = y || now.getFullYear();
  const month = m || now.getMonth() + 1;
  const mesStr = `${year}-${String(month).padStart(2, "0")}`;
  const prev = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const mesLabel = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const toMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const filtro = searchParams.filtro; const cat = searchParams.cat; const q = searchParams.q?.trim();
  const [f, agents, properties] = await Promise.all([
    getFinance(ctx.org.id, year, month, { kpi: filtro, cat, q }),
    getAgents(ctx.org.id),
    getPanelProperties(ctx.org.id),
  ]);
  // link que preserva o mês e alterna filtros (clicar de novo limpa)
  const href = (p: { filtro?: string; cat?: string }) => {
    const u = new URLSearchParams({ mes: mesStr });
    const nf = p.filtro === filtro ? undefined : p.filtro;
    const nc = p.cat === cat ? undefined : p.cat;
    if (nf) u.set("filtro", nf);
    if (nc) u.set("cat", nc);
    if (q) u.set("q", q);
    return `/painel/financeiro?${u.toString()}`;
  };
  const KPI_LABEL: Record<string, string> = {
    recebido: "recebidos no mês", pago: "pagos no mês", resultado: "movimentados no mês",
    a_receber: "a receber no mês", a_pagar: "a pagar no mês", vencidos: "vencidos em aberto",
  };
  const maxFlow = Math.max(1, ...f.flow.map((x) => Math.max(x.inn, x.out)));
  const pendingCms = f.commissions.filter((c: any) => c.status === "PENDING");
  const paidCms = f.commissions.filter((c: any) => c.status === "PAID");
  const dreIn = f.dre.filter((r) => r.direction === "IN");
  const dreOut = f.dre.filter((r) => r.direction === "OUT");

  return (
    <>
      <div className="phead">
        <h1>Financeiro</h1>
        <span className="month-pill">
          <a href={`/painel/financeiro?mes=${toMes(prev)}`}>‹</a>
          <strong>● {mesLabel}</strong>
          <a href={`/painel/financeiro?mes=${toMes(next)}`}>›</a>
        </span>
      </div>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Lançamento registrado.</p>}
      {searchParams.comissao && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Comissão paga — o repasse já entrou como saída no fluxo de caixa.</p>}
      {searchParams.erro && <p className="pform-error">Confira os campos: direção, categoria, descrição, valor e vencimento são obrigatórios.</p>}

      {/* ---- KPIs do mês (clique = filtra o extrato; clique de novo = limpa) ---- */}
      <div className="kpis">
        {([
          ["recebido", brlCompact(f.kpis.inPaid), "recebido no mês", undefined],
          ["pago", brlCompact(f.kpis.outPaid), "pago no mês", undefined],
          ["resultado", brlCompact(f.kpis.result), "resultado do mês (caixa)", f.kpis.result >= 0 ? "var(--brass)" : "#c67a6b"],
          ["a_receber", brlCompact(f.kpis.toReceive), "a receber no mês", undefined],
          ["a_pagar", brlCompact(f.kpis.toPay), "a pagar no mês", undefined],
          ["vencidos", brlCompact(f.kpis.overdue), "vencidos em aberto (total)", f.kpis.overdue > 0 ? "#c67a6b" : "var(--brass)"],
        ] as [string, string, string, string | undefined][]).map(([id, val, label, color]) => (
          <Link key={id} href={href({ filtro: id })} className="kpi"
                style={{ textDecoration: "none", borderColor: filtro === id ? "var(--brass)" : undefined }}>
            <strong style={color ? { color } : undefined}>{val}</strong>
            <span>{label}</span>
            <span className="kpi-hint" style={filtro === id ? { color: "var(--brass)" } : undefined}>
              {filtro === id ? "Filtrando extrato • clique para limpar" : "Clique para filtrar o extrato abaixo"}
            </span>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem", marginBottom: "1.4rem" }}>
        {/* ---- Fluxo de caixa 6 meses ---- */}
        <section className="ficha-box">
          <h2>Fluxo de caixa · 6 meses</h2>
          {f.flow.map((x) => (
            <div key={x.label} style={{ marginBottom: ".6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", marginBottom: ".2rem" }}>
                <span style={{ textTransform: "capitalize" }}>{x.label}</span>
                <span style={{ color: "var(--stone)" }}>+{brlCompact(x.inn)} · −{brlCompact(x.out)}</span>
              </div>
              <div className="meta-bar" style={{ marginBottom: ".2rem" }}><i style={{ width: `${Math.round((100 * x.inn) / maxFlow)}%` }} /></div>
              <div className="meta-bar"><i style={{ width: `${Math.round((100 * x.out) / maxFlow)}%`, background: "#7a5548" }} /></div>
            </div>
          ))}
          <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".5rem" }}>Dourado = entradas · terracota = saídas (pelo que foi efetivamente pago).</p>
        </section>

        {/* ---- DRE simplificado ---- */}
        <section className="ficha-box">
          <h2>DRE simplificado · {mesLabel}</h2>
          {dreIn.length + dreOut.length === 0 && <p style={{ color: "var(--stone)" }}>Sem movimentações pagas neste mês.</p>}
          {dreIn.map((r) => (
            <Link key={r.category} href={href({ cat: r.category })} title="Ver transações"
                  style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".3rem", textDecoration: cat === r.category ? "underline" : "none", textUnderlineOffset: 3 }}>
              <span>{FIN_CATEGORY[r.category] ?? r.category}</span><span>{brl(r.total)}</span>
            </Link>
          ))}
          {dreOut.map((r) => (
            <Link key={r.category} href={href({ cat: r.category })} title="Ver transações"
                  style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".3rem", color: "var(--stone)", textDecoration: cat === r.category ? "underline" : "none", textUnderlineOffset: 3 }}>
              <span>{FIN_CATEGORY[r.category] ?? r.category}</span><span>−{brl(r.total)}</span>
            </Link>
          ))}
          <p className="dre-result">
            <span>RESULTADO</span>
            <span style={{ color: f.kpis.result >= 0 ? "var(--brass)" : "#e57373" }}>{brl(f.kpis.result)}</span>
          </p>
        </section>

        {/* ---- Comissões ---- */}
        <section className="ficha-box" style={pendingCms.length ? { borderColor: "var(--brass)" } : undefined}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: ".6rem", marginBottom: ".7rem" }}>
            <h2 style={{ margin: 0 }}>Comissões a pagar ({pendingCms.length})</h2>
            {pendingCms.length > 0 && <span className="badge-prioridade">PRIORIDADE</span>}
          </div>
          {pendingCms.length === 0 && <p style={{ color: "var(--stone)" }}>Nenhuma comissão pendente. ✨</p>}
          {pendingCms.slice(0, 6).map((c: any) => (
            <div key={c.id} className="subcard" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".7rem" }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <strong>{c.agent?.name}</strong>
                <span style={{ display: "block", color: "var(--stone)", fontSize: ".8rem" }}>{c.contract?.proposal?.property?.title ?? "—"}</span>
                <strong style={{ color: "var(--brass)" }}>{brl(c.amount)}</strong>
              </span>
              <form action={payCommission}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="mes" value={mesStr} />
                <button className="btn-solid" type="submit" style={{ whiteSpace: "nowrap" }}>PAGAR</button>
              </form>
            </div>
          ))}
          {paidCms.length > 0 && (
            <div className="twin-boxes">
              <div><span>Pagas no mês</span><strong>{paidCms.length} • {brl(paidCms.reduce((s: number, c: any) => s + Number(c.amount), 0))}</strong></div>
              <div><span>Ticket médio</span><strong>{brl(paidCms.reduce((s: number, c: any) => s + Number(c.amount), 0) / paidCms.length)}</strong></div>
            </div>
          )}
          <p className="dashed-box">📎 Rastreável: cada pagamento registra autor, data e o repasse no extrato.</p>
        </section>
      </div>

      {/* ---- Novo lançamento ---- */}
      <form action={createFinanceEntry} className="pform" style={{ maxWidth: 980, marginBottom: "1.6rem" }}>
        <input type="hidden" name="mes" value={mesStr} />
        <section>
          <h2>Novo lançamento</h2>
          <div className="pgrid">
            <label>Tipo
              <select name="direction" defaultValue="OUT">
                <option value="IN">Entrada (a receber)</option>
                <option value="OUT">Saída (a pagar)</option>
              </select>
            </label>
            <label>Categoria
              <select name="category" defaultValue="DESPESA_VARIAVEL">
                {Object.entries(FIN_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="span2">Descrição*<input name="description" required placeholder="Ex.: Anúncio ZAP — agosto" /></label>
            <label>Valor (R$)*<MoneyInput name="amount" required placeholder="R$ 2.500,00" /></label>
            <label>Vencimento*<input name="dueDate" type="date" required /></label>
            <label>Imóvel vinculado
              <select name="propertyId" defaultValue="">
                <option value="">— Nenhum —</option>
                {(properties as any[]).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label>Corretor vinculado
              <select name="agentId" defaultValue="">
                <option value="">— Nenhum —</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: "1.4rem" }}>
              <input type="checkbox" name="alreadyPaid" style={{ width: "auto" }} /> Já pago/recebido
            </label>
          </div>
          <div className="pform-footer"><button className="btn-solid" type="submit">Lançar com rastreabilidade</button></div>
        </section>
      </form>

      {/* ---- Extrato / Lançamentos ---- */}
      <div className="phead" style={{ marginBottom: ".8rem" }}>
        <h2>
          Extrato · {filtro ? KPI_LABEL[filtro] : `vencimentos de ${mesLabel}`}
          {cat ? ` · ${FIN_CATEGORY[cat] ?? cat}` : ""} ({f.entries.length})
        </h2>
        <form method="GET" action="/painel/financeiro" style={{ display: "flex", gap: ".5rem" }}>
          <input type="hidden" name="mes" value={mesStr} />
          {filtro && <input type="hidden" name="filtro" value={filtro} />}
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input name="q" defaultValue={q ?? ""} placeholder="Buscar descrição, imóvel, corretor..." style={{ minWidth: 240 }} />
          <button className="btn-outline" type="submit">Buscar</button>
        </form>
      </div>
      {(filtro || cat || q) && (
        <p style={{ marginBottom: ".8rem" }}>
          <Link className="filter-chip" href={`/painel/financeiro?mes=${mesStr}`}>
            Filtro: {[filtro && KPI_LABEL[filtro], cat && (FIN_CATEGORY[cat] ?? cat), q && `"${q}"`].filter(Boolean).join(" · ")} ✕
          </Link>
        </p>
      )}
      {f.entries.length === 0 ? (
        <p style={{ color: "var(--stone)" }}>Nenhum lançamento com vencimento neste mês — use "Novo lançamento" acima ou navegue entre os meses.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Venc.</th><th>Descrição</th><th>Categoria</th><th>Imóvel</th><th>Corretor</th><th>Valor</th><th>Status</th><th>📎</th><th>Criado por</th><th></th></tr></thead>
          <tbody>
            {f.entries.map((e: any) => {
              const overdue = !e.paidAt && +new Date(e.dueDate) < Date.now();
              return (
                <tr key={e.id} style={{ opacity: e.paidAt ? 0.55 : 1 }}>
                  <td>{fmtD(e.dueDate)}</td>
                  <td>{e.description}</td>
                  <td><span className="pill">{FIN_CATEGORY[e.category] ?? e.category}</span></td>
                  <td>
                    {(e.property ?? e.contract?.proposal?.property) ? (
                      <Link href={`/painel/imoveis/${(e.property ?? e.contract?.proposal?.property).id}`}
                            style={{ color: "var(--brass)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                        {(e.property ?? e.contract?.proposal?.property).title}
                      </Link>
                    ) : "—"}
                  </td>
                  <td>
                    {e.agent ? (
                      <Link href={`/painel/corretores/${e.agent.id}`}
                            style={{ color: "var(--brass)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                        {e.agent.name}
                      </Link>
                    ) : "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{e.direction === "IN" ? "+" : "−"}{brl(e.amount)}</td>
                  <td>
                    <span className={"badge-status " + (e.paidAt ? (e.direction === "IN" ? "badge-recebido" : "badge-pago") : overdue ? "badge-vencido" : "badge-previsto")}>
                      {e.paidAt ? (e.direction === "IN" ? "Recebido" : "Pago") : overdue ? "Vencido" : "Previsto"}
                    </span>
                  </td>
                  <td>
                    {e.documents?.[0] ? (
                      <a href={`/painel/documentos/${e.documents[0].id}/baixar`} target="_blank" rel="noopener" title={e.documents[0].name}>📎</a>
                    ) : (
                      <Link href="/painel/documentos" title="Anexar comprovante" style={{ color: "var(--stone)" }}>＋</Link>
                    )}
                  </td>
                  <td style={{ color: "var(--stone)", fontSize: ".8rem" }}>{e.createdBy ?? "—"}</td>
                  <td>
                    <form action={toggleFinancePaid}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="mes" value={mesStr} />
                      <button className="pill" type="submit" style={{ cursor: "pointer", background: "none" }}>
                        {e.paidAt ? "Estornar" : e.direction === "IN" ? "Receber" : "Pagar"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ color: "var(--stone)", fontSize: ".72rem", marginTop: "2rem", textAlign: "center", letterSpacing: ".08em" }}>
        © 2026 {ctx.org.name.toUpperCase()} • Painel financeiro premium dark • BRL formatado com Intl pt-BR
      </p>
    </>
  );
}
