import Link from "next/link";
import { requireAdmin } from "@/lib/perm";
import { getRentals, RENTAL_TYPE } from "@/lib/data";
import { brl, brlCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function Locacao() {
  const ctx = await requireAdmin();
  const r = await getRentals(ctx.org.id);
  const STATUS_PILL: Record<string, [string, object | undefined]> = {
    ATIVO: ["Ativo", { borderColor: "#425c3c", color: "#8fbb7d" }],
    ENCERRADO: ["Encerrado", undefined],
    RESCINDIDO: ["Rescindido", { borderColor: "#7a4640", color: "#e57373" }],
  };

  return (
    <>
      <div className="phead">
        <h1>Locação</h1>
        <Link className="btn-solid" href="/painel/locacao/novo">+ Novo contrato</Link>
      </div>

      {/* ---- KPIs da carteira ---- */}
      <div className="kpis">
        <div className="kpi"><strong>{brlCompact(r.kpis.portfolio)}</strong><span>carteira mensal ({r.kpis.active} contratos ativos)</span></div>
        <div className="kpi"><strong>{brlCompact(r.kpis.monthlyFees)}</strong><span>receita recorrente da imobiliária / mês</span></div>
        <div className="kpi">
          <strong style={{ color: r.kpis.overdueCount > 0 ? "#e57373" : "var(--brass)" }}>{r.kpis.overdueCount}</strong>
          <span>aluguéis em atraso · {brlCompact(r.kpis.overdueSum)}</span>
        </div>
        <div className="kpi">
          <strong style={{ color: r.kpis.toTransferCount > 0 ? "#d0a94e" : "var(--brass)" }}>{r.kpis.toTransferCount}</strong>
          <span>repasses pendentes · {brlCompact(r.kpis.toTransferSum)}</span>
        </div>
      </div>

      {/* ---- Sugestões de conversão (imóveis encalhados na venda) ---- */}
      {r.suggestions.length > 0 && (
        <section className="ficha-box" style={{ margin: "1.4rem 0" }}>
          <h2>💡 Candidatos a locação</h2>
          <p style={{ color: "var(--stone)", fontSize: ".85rem", marginBottom: ".7rem" }}>
            Imóveis à venda há 100+ dias sem visita — proponha locação ao proprietário e transforme estoque parado em receita recorrente
            (aluguel sugerido pela regra de 0,45% do valor de venda).
          </p>
          {r.suggestions.map((p: any) => (
            <p key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: ".8rem", fontSize: ".9rem", marginBottom: ".35rem", flexWrap: "wrap" }}>
              <span>
                <Link href={`/painel/imoveis/${p.id}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{p.title}</Link>
                <span style={{ color: "var(--stone)" }}> · {p.neighborhood} · venda {brlCompact(p.price)}</span>
              </span>
              <span style={{ color: "var(--brass)", whiteSpace: "nowrap" }}>≈ {brl(p.suggestedRent)}/mês</span>
            </p>
          ))}
        </section>
      )}

      {/* ---- Contratos ---- */}
      <h2 style={{ margin: "1.4rem 0 .8rem" }}>Contratos ({r.contracts.length})</h2>
      {r.contracts.length === 0 ? (
        <p style={{ color: "var(--stone)" }}>
          Nenhum contrato ainda. Comece pelo "+ Novo contrato" — o sistema gera a régua de cobrança completa
          (parcelas mês a mês) e cuida do repasse ao proprietário com a sua taxa já separada.
        </p>
      ) : (
        <table className="table">
          <thead><tr><th>Imóvel</th><th>Inquilino</th><th>Tipo</th><th>Aluguel</th><th>Taxa</th><th>Próx. venc.</th><th>Status</th></tr></thead>
          <tbody>
            {r.contracts.map((c: any) => {
              const next = c.payments[0];
              const [label, style] = STATUS_PILL[c.status] ?? [c.status, undefined];
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/painel/locacao/${c.id}`} style={{ color: "var(--brass)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                      {c.property?.title}
                    </Link>
                  </td>
                  <td>{c.tenant?.name}</td>
                  <td><span className="pill">{RENTAL_TYPE[c.type] ?? c.type}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>{brl(c.rentValue)}</td>
                  <td>{Number(c.adminFeePct)}%{c.guaranteeType === "PROPRIA" ? ` + ${Number(c.guaranteeFeePct)}%` : ""}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {next ? (
                      <span style={next.status === "ATRASADO" ? { color: "#e57373" } : undefined}>
                        {fmtD(next.dueDate)}{next.status === "ATRASADO" ? " ⚠" : ""}
                      </span>
                    ) : "—"}
                  </td>
                  <td><span className="pill" style={style as any}>{label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
