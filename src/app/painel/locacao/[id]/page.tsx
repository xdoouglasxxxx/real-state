import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/perm";
import { getRentalDetail, RENTAL_TYPE, GUARANTEE_LABEL } from "@/lib/data";
import { brl, brlCompact } from "@/lib/format";
import { markRentPaid, transferRent, closeRentalContract } from "../actions";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");
const DOT: Record<string, { bg: string; title: string }> = {
  PAGO: { bg: "#8fbb7d", title: "Pago" },
  ATRASADO: { bg: "#e57373", title: "Atrasado" },
  PREVISTO: { bg: "#4a443c", title: "Previsto" },
  CANCELADO: { bg: "#2c2823", title: "Cancelado" },
};

export default async function ContratoLocacao({
  params, searchParams,
}: { params: { id: string }; searchParams: { ok?: string; pago?: string; repasse?: string; encerrado?: string } }) {
  const ctx = await requireAdmin();
  const c = await getRentalDetail(ctx.org.id, params.id);
  if (!c) notFound();

  const monthlyFee = Number(c.rentValue) * Number(c.adminFeePct) / 100
    + (c.guaranteeType === "PROPRIA" ? Number(c.rentValue) * Number(c.guaranteeFeePct) / 100 : 0);
  const paid = c.payments.filter((p: any) => p.status === "PAGO");
  const toTransfer = paid.filter((p: any) => !p.repasseAt);

  return (
    <>
      <Link className="back" href="/painel/locacao">← Voltar à locação</Link>
      <div className="phead">
        <h1>{c.property?.title}</h1>
        <span className="pill">{c.status === "ATIVO" ? "Contrato ativo" : c.status === "ENCERRADO" ? "Encerrado" : "Rescindido"}</span>
      </div>

      {searchParams.ok && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Contrato criado — régua de cobrança gerada até {fmtD(c.endDate)}.</p>}
      {searchParams.pago && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Pagamento registrado — aluguel entrou no caixa; repasse liberado.</p>}
      {searchParams.repasse && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Repasse registrado — saída no caixa com a taxa já retida.</p>}
      {searchParams.encerrado && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Contrato encerrado — parcelas futuras canceladas.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem", marginBottom: "1.4rem" }}>
        <section className="ficha-box">
          <h2>Partes e condições</h2>
          <p style={{ marginBottom: ".3rem" }}><span style={{ color: "var(--stone)" }}>Proprietário:</span> {c.owner?.name}{c.owner?.phone ? ` · ${c.owner.phone}` : ""}</p>
          <p style={{ marginBottom: ".3rem" }}><span style={{ color: "var(--stone)" }}>Inquilino:</span> <strong>{c.tenant?.name}</strong>{c.tenant?.phone ? ` · ${c.tenant.phone}` : ""}</p>
          {c.agent && <p style={{ marginBottom: ".3rem" }}><span style={{ color: "var(--stone)" }}>Corretor:</span> {c.agent.name}</p>}
          <p style={{ marginBottom: ".3rem" }}><span style={{ color: "var(--stone)" }}>Tipo:</span> {RENTAL_TYPE[c.type] ?? c.type} · <span style={{ color: "var(--stone)" }}>Garantia:</span> {GUARANTEE_LABEL[c.guaranteeType]}</p>
          <p style={{ marginBottom: ".3rem" }}><span style={{ color: "var(--stone)" }}>Vigência:</span> {fmtD(c.startDate)} → {fmtD(c.endDate)} · vence dia {c.dueDay} · reajuste {c.reajusteIndex}</p>
        </section>

        <section className="ficha-box">
          <h2>💰 Números do contrato</h2>
          <div className="kpi" style={{ border: "none", padding: 0, marginBottom: ".6rem" }}>
            <strong>{brl(Number(c.rentValue))}</strong><span>aluguel mensal{c.guaranteeType === "PROPRIA" ? ` (+${Number(c.guaranteeFeePct)}% garantia = ${brl(Number(c.rentValue) * (1 + Number(c.guaranteeFeePct) / 100))} cobrados)` : ""}</span>
          </div>
          <div className="kpi" style={{ border: "none", padding: 0, marginBottom: ".6rem" }}>
            <strong style={{ color: "var(--brass)" }}>{brl(monthlyFee)}</strong><span>receita mensal da imobiliária ({Number(c.adminFeePct)}%{c.guaranteeType === "PROPRIA" ? ` + ${Number(c.guaranteeFeePct)}%` : ""})</span>
          </div>
          <div className="kpi" style={{ border: "none", padding: 0 }}>
            <strong>{brl(Number(c.rentValue) - Number(c.rentValue) * Number(c.adminFeePct) / 100)}</strong><span>repasse mensal ao proprietário</span>
          </div>
        </section>

        <section className="ficha-box" style={toTransfer.length ? { borderColor: "var(--brass)" } : undefined}>
          <h2>Régua de pagamentos</h2>
          <p style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", margin: ".5rem 0 .8rem" }}>
            {c.payments.map((p: any) => {
              const d = DOT[p.status] ?? DOT.PREVISTO;
              return (
                <span key={p.id} title={`${p.referenceMonth} · ${d.title}${p.repasseAt ? " · repassado" : ""}`}
                      style={{
                        width: 18, height: 18, borderRadius: 999, background: d.bg, display: "inline-block",
                        border: p.repasseAt ? "2px solid var(--brass)" : "2px solid transparent",
                      }} />
              );
            })}
          </p>
          <p style={{ color: "var(--stone)", fontSize: ".76rem" }}>
            🟢 pago · 🔴 atrasado · ⚫ previsto · aro dourado = repassado ao proprietário.
            {toTransfer.length > 0 && <strong style={{ color: "var(--brass)" }}> {toTransfer.length} repasse(s) pendente(s) — {brlCompact(toTransfer.reduce((s: number, p: any) => s + Number(p.rentValue) - Number(p.adminFee), 0))}.</strong>}
          </p>
        </section>
      </div>

      {/* ---- Tabela de parcelas ---- */}
      <h2 style={{ marginBottom: ".8rem" }}>Parcelas</h2>
      <table className="table">
        <thead><tr><th>Ref.</th><th>Vencimento</th><th>Cobrança</th><th>Status</th><th>Repasse</th><th></th></tr></thead>
        <tbody>
          {c.payments.map((p: any) => {
            const overdue = p.status === "ATRASADO";
            return (
              <tr key={p.id} style={{ opacity: p.status === "CANCELADO" ? 0.45 : 1 }}>
                <td>{p.referenceMonth}</td>
                <td style={overdue ? { color: "#e57373" } : undefined}>{fmtD(p.dueDate)}{overdue ? " ⚠" : ""}</td>
                <td style={{ whiteSpace: "nowrap" }}>{brl(p.totalBilled)}</td>
                <td>
                  <span className={"badge-status " + (p.status === "PAGO" ? "badge-pago" : overdue ? "badge-vencido" : "badge-previsto")}>
                    {p.status === "PAGO" ? "Pago" : overdue ? "Atrasado" : p.status === "CANCELADO" ? "Cancelado" : "Previsto"}
                  </span>
                </td>
                <td style={{ fontSize: ".85rem" }}>
                  {p.repasseAt ? <span style={{ color: "var(--brass)" }}>✔ {brl(p.repasseValue)} · {fmtD(p.repasseAt)}</span>
                    : p.status === "PAGO" ? <span style={{ color: "var(--stone)" }}>pendente</span> : "—"}
                </td>
                <td>
                  {["PREVISTO", "ATRASADO"].includes(p.status) && c.status === "ATIVO" && (
                    <form action={markRentPaid} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="pill" type="submit" style={{ cursor: "pointer", background: "none" }}>Marcar pago</button>
                    </form>
                  )}
                  {p.status === "PAGO" && !p.repasseAt && (
                    <form action={transferRent} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="pill" type="submit" style={{ cursor: "pointer", background: "none", borderColor: "var(--brass)", color: "var(--brass)" }}>Repassar</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {c.status === "ATIVO" && (
        <div style={{ display: "flex", gap: ".8rem", marginTop: "1.4rem", flexWrap: "wrap" }}>
          <form action={closeRentalContract}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="kind" value="ENCERRADO" />
            <button className="btn-outline" type="submit">Encerrar contrato (fim normal)</button>
          </form>
          <form action={closeRentalContract}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="kind" value="RESCINDIDO" />
            <button className="btn-outline" type="submit" style={{ borderColor: "#7a4640", color: "#e57373" }}>Rescindir (antes do prazo)</button>
          </form>
        </div>
      )}
      <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: "1rem" }}>
        Reajuste anual, multa rescisória proporcional (Lei 8.245), vistorias e portais do proprietário/inquilino: Fase 2 do módulo.
        Contrato assinado e vistorias: anexe em Documentos, vinculados ao imóvel.
      </p>
    </>
  );
}
