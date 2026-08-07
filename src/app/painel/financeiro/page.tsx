import { requireAdmin } from "@/lib/perm";
import { getFinance, FIN_CATEGORY } from "@/lib/data";
import { brl, brlCompact } from "@/lib/format";
import { createFinanceEntry, toggleFinancePaid, payCommission } from "./actions";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function Financeiro({ searchParams }: { searchParams: { mes?: string; salvo?: string; erro?: string; comissao?: string } }) {
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

  const f = await getFinance(ctx.org.id, year, month);
  const maxFlow = Math.max(1, ...f.flow.map((x) => Math.max(x.inn, x.out)));
  const pendingCms = f.commissions.filter((c: any) => c.status === "PENDING");
  const paidCms = f.commissions.filter((c: any) => c.status === "PAID");
  const dreIn = f.dre.filter((r) => r.direction === "IN");
  const dreOut = f.dre.filter((r) => r.direction === "OUT");

  return (
    <>
      <div className="phead">
        <h1>Financeiro</h1>
        <span style={{ display: "flex", gap: ".6rem", alignItems: "baseline" }}>
          <a className="pill" href={`/painel/financeiro?mes=${toMes(prev)}`} style={{ textDecoration: "none" }}>←</a>
          <strong style={{ textTransform: "capitalize" }}>{mesLabel}</strong>
          <a className="pill" href={`/painel/financeiro?mes=${toMes(next)}`} style={{ textDecoration: "none" }}>→</a>
        </span>
      </div>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Lançamento registrado.</p>}
      {searchParams.comissao && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Comissão paga — o repasse já entrou como saída no fluxo de caixa.</p>}
      {searchParams.erro && <p className="pform-error">Confira os campos: direção, categoria, descrição, valor e vencimento são obrigatórios.</p>}

      {/* ---- KPIs do mês ---- */}
      <div className="kpis">
        <div className="kpi"><strong>{brlCompact(f.kpis.inPaid)}</strong><span>recebido no mês</span></div>
        <div className="kpi"><strong>{brlCompact(f.kpis.outPaid)}</strong><span>pago no mês</span></div>
        <div className="kpi">
          <strong style={{ color: f.kpis.result >= 0 ? "var(--brass)" : "#c67a6b" }}>{brlCompact(f.kpis.result)}</strong>
          <span>resultado do mês (caixa)</span>
        </div>
        <div className="kpi"><strong>{brlCompact(f.kpis.toReceive)}</strong><span>a receber no mês</span></div>
        <div className="kpi"><strong>{brlCompact(f.kpis.toPay)}</strong><span>a pagar no mês</span></div>
        <div className="kpi">
          <strong style={{ color: f.kpis.overdue > 0 ? "#c67a6b" : "var(--brass)" }}>{brlCompact(f.kpis.overdue)}</strong>
          <span>vencidos em aberto (total)</span>
        </div>
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
            <p key={r.category} style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".3rem" }}>
              <span>{FIN_CATEGORY[r.category] ?? r.category}</span><span>{brl(r.total)}</span>
            </p>
          ))}
          {dreOut.map((r) => (
            <p key={r.category} style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".3rem", color: "var(--stone)" }}>
              <span>{FIN_CATEGORY[r.category] ?? r.category}</span><span>−{brl(r.total)}</span>
            </p>
          ))}
          <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--line)", paddingTop: ".5rem", marginTop: ".5rem" }}>
            <span>Resultado</span>
            <span style={{ color: f.kpis.result >= 0 ? "var(--brass)" : "#c67a6b" }}>{brl(f.kpis.result)}</span>
          </p>
        </section>

        {/* ---- Comissões ---- */}
        <section className="ficha-box" style={pendingCms.length ? { borderColor: "var(--brass)" } : undefined}>
          <h2>Comissões a pagar ({pendingCms.length})</h2>
          {pendingCms.length === 0 && <p style={{ color: "var(--stone)" }}>Nenhuma comissão pendente. ✨</p>}
          {pendingCms.slice(0, 8).map((c: any) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: ".6rem", marginBottom: ".45rem", fontSize: ".9rem" }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <strong>{c.agent?.name}</strong>
                <span style={{ color: "var(--stone)" }}> · {c.contract?.proposal?.property?.title ?? "—"} · {brl(c.amount)}</span>
              </span>
              <form action={payCommission}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="mes" value={mesStr} />
                <button className="pill" type="submit" style={{ cursor: "pointer", background: "none", whiteSpace: "nowrap" }}>Pagar</button>
              </form>
            </div>
          ))}
          {paidCms.length > 0 && (
            <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".5rem" }}>
              Pagas no mês: {paidCms.length} · {brl(paidCms.reduce((s: number, c: any) => s + Number(c.amount), 0))}
            </p>
          )}
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
            <label>Valor (R$)*<input name="amount" required inputMode="decimal" placeholder="2.500,00" /></label>
            <label>Vencimento*<input name="dueDate" type="date" required /></label>
            <label style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: "1.4rem" }}>
              <input type="checkbox" name="alreadyPaid" style={{ width: "auto" }} /> Já pago/recebido
            </label>
          </div>
          <div className="pform-footer"><button className="btn-solid" type="submit">Lançar</button></div>
        </section>
      </form>

      {/* ---- Lançamentos do mês ---- */}
      <h2 style={{ marginBottom: ".8rem" }}>Lançamentos de {mesLabel} ({f.entries.length})</h2>
      {f.entries.length === 0 ? (
        <p style={{ color: "var(--stone)" }}>Nenhum lançamento com vencimento neste mês — use "Novo lançamento" acima ou navegue entre os meses.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Venc.</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {f.entries.map((e: any) => {
              const overdue = !e.paidAt && +new Date(e.dueDate) < Date.now();
              return (
                <tr key={e.id} style={{ opacity: e.paidAt ? 0.55 : 1 }}>
                  <td>{fmtD(e.dueDate)}</td>
                  <td>{e.description}{e.contract?.proposal?.property?.title ? <span style={{ color: "var(--stone)" }}> · {e.contract.proposal.property.title}</span> : null}</td>
                  <td><span className="pill">{FIN_CATEGORY[e.category] ?? e.category}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>{e.direction === "IN" ? "+" : "−"}{brl(e.amount)}</td>
                  <td>
                    <span className="pill" style={overdue ? { borderColor: "#c67a6b", color: "#c67a6b" } : undefined}>
                      {e.paidAt ? (e.direction === "IN" ? "Recebido" : "Pago") : overdue ? "Vencido" : "Em aberto"}
                    </span>
                  </td>
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
    </>
  );
}
