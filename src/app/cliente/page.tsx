import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { getClientPortal, CLIENT_STAGE, RENTAL_TYPE, GUARANTEE_LABEL } from "@/lib/data";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const VISIT_LABEL: Record<string, string> = {
  SCHEDULED: "Agendada", DONE: "Realizada", NO_SHOW: "Não realizada", CANCELED: "Cancelada",
};
const PROPOSAL_LABEL: Record<string, string> = {
  SENT: "Enviada — em análise", COUNTER: "Contraproposta recebida",
  ACCEPTED: "Aceita ✔", REJECTED: "Não aceita", EXPIRED: "Expirada",
};
const CONTRACT_LABEL: Record<string, string> = {
  AWAITING_SIGNATURE: "Aguardando sua assinatura", SIGNED: "Assinado — em andamento",
  FINANCING: "Financiamento em processamento", CLOSED: "Concluído 🎉", CANCELED: "Cancelado",
};

const fmtDT = (x: Date | string) =>
  new Date(x).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtD = (x: Date | string) =>
  new Date(x).toLocaleDateString("pt-BR");

export default async function ClientePortal() {
  const org = await getTenant();
  const session = getSession();
  const data = await getClientPortal(org.id, session?.email ?? "");
  const name = data.contacts[0]?.name?.split(" ")[0];

  const upcoming = data.visits.filter((v: any) => v.status === "SCHEDULED" && +new Date(v.scheduledAt) >= Date.now() - 3600000);
  const pastVisits = data.visits.filter((v: any) => !upcoming.includes(v)).slice(0, 6);

  return (
    <>
      <h1>{name ? `Olá, ${name}!` : "Área do cliente"}</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.6rem" }}>
        Acompanhe aqui, em tempo real, cada passo da sua negociação com a {org.name}.
      </p>

      {data.journeys.length === 0 && (
        <section className="ficha-box">
          <h2>Nenhuma negociação em andamento</h2>
          <p style={{ color: "var(--stone)" }}>
            Assim que você demonstrar interesse em um imóvel, sua jornada aparece aqui.
            Explore os imóveis disponíveis no site — seu corretor recebe o interesse na hora.
          </p>
        </section>
      )}

      {/* ---- Jornadas (uma por negociação) ---- */}
      {data.journeys.map((j: any) => {
        const st = CLIENT_STAGE[j.stage] ?? { label: j.stage, pct: 0 };
        const activeContract = j.proposals.map((p: any) => p.contract).find(Boolean);
        return (
          <section className="ficha-box" key={j.id} style={{ marginBottom: "1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "baseline" }}>
              <h2>{j.property?.title ?? "Busca personalizada"}</h2>
              <span className="pill">{st.label}</span>
            </div>
            {j.property && (
              <p style={{ color: "var(--stone)", fontSize: ".88rem", margin: ".3rem 0 .8rem" }}>
                {j.property.neighborhood}{j.property.city ? ` · ${j.property.city}` : ""} · {brl(j.property.price)}
              </p>
            )}
            <div className="meta-bar" style={{ marginBottom: ".9rem" }}><i style={{ width: `${st.pct}%` }} /></div>

            {j.agent && (
              <p style={{ fontSize: ".9rem", marginBottom: ".9rem" }}>
                Seu corretor: <strong>{j.agent.name}</strong>
                {j.agent.phone && (
                  <>
                    {" · "}
                    <a href={`https://wa.me/55${String(j.agent.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener"
                       style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
                      falar no WhatsApp
                    </a>
                  </>
                )}
              </p>
            )}

            {/* Propostas desta negociação */}
            {j.proposals.length > 0 && (
              <div style={{ marginBottom: ".9rem" }}>
                <h3 style={{ fontSize: ".95rem", marginBottom: ".4rem" }}>Propostas</h3>
                {j.proposals.map((pr: any) => (
                  <p key={pr.id} style={{ fontSize: ".88rem", color: "var(--stone)", marginBottom: ".25rem" }}>
                    {brl(pr.amount)} · {PROPOSAL_LABEL[pr.status] ?? pr.status} · {fmtD(pr.createdAt)}
                  </p>
                ))}
              </div>
            )}

            {/* Contrato + documentos */}
            {activeContract && (
              <div style={{ marginBottom: ".9rem" }}>
                <h3 style={{ fontSize: ".95rem", marginBottom: ".4rem" }}>
                  Contrato: <span className="pill">{CONTRACT_LABEL[activeContract.status] ?? activeContract.status}</span>
                </h3>
                {activeContract.documents.length > 0 ? (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".3rem" }}>
                    {activeContract.documents.map((doc: any) => (
                      <li key={doc.id} style={{ fontSize: ".88rem" }}>
                        📄 <a href={doc.fileUrl.startsWith("http") ? doc.fileUrl : `/cliente/doc/${doc.id}`} target="_blank" rel="noopener" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{doc.name}</a>
                        <span style={{ color: "var(--stone)" }}> · {fmtD(doc.uploadedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>Os documentos aparecem aqui assim que forem anexados pela imobiliária.</p>
                )}
              </div>
            )}

            {/* Linha do tempo segura (só marcos) */}
            {j.activities.length > 0 && (
              <details>
                <summary style={{ cursor: "pointer", color: "var(--stone)", fontSize: ".85rem" }}>Histórico da negociação</summary>
                <ul className="timeline" style={{ marginTop: ".7rem" }}>
                  {j.activities.map((a: any) => (
                    <li key={a.id}>
                      <span className="tl-when">{fmtDT(a.createdAt)}</span>
                      <p>{CLIENT_STAGE[a.payload?.to]?.label ?? "Atualização da negociação"}</p>
                    </li>
                  ))}
                  <li><span className="tl-when">{fmtDT(j.createdAt)}</span><p>Recebemos seu interesse</p></li>
                </ul>
              </details>
            )}
          </section>
        );
      })}

      {/* ---- Visitas ---- */}
      {(upcoming.length > 0 || pastVisits.length > 0) && (
        <section className="ficha-box" style={{ marginBottom: "1.4rem" }}>
          <h2>Minhas visitas</h2>
          {upcoming.map((v: any) => (
            <p key={v.id} style={{ marginBottom: ".35rem" }}>
              📅 <strong>{fmtDT(v.scheduledAt)}</strong> — {v.property?.title}
              {v.agent?.name ? ` · com ${v.agent.name}` : ""} <span className="pill">Agendada</span>
            </p>
          ))}
          {pastVisits.map((v: any) => (
            <p key={v.id} style={{ marginBottom: ".35rem", color: "var(--stone)", fontSize: ".9rem" }}>
              {fmtDT(v.scheduledAt)} — {v.property?.title} · {VISIT_LABEL[v.status] ?? v.status}
            </p>
          ))}
        </section>
      )}

      {/* ---- Locação ativa ---- */}
      {data.rental && (() => {
        const r = data.rental;
        const PAY_LABEL: Record<string, string> = { PAGO: "Pago", PREVISTO: "Previsto", ATRASADO: "Atrasado", CANCELADO: "Cancelado" };
        const PAY_COLOR: Record<string, string> = { PAGO: "#8fbb7d", ATRASADO: "#e57373", PREVISTO: "var(--stone)", CANCELADO: "var(--stone)" };
        return (
          <section className="ficha-box" style={{ marginBottom: "1.4rem" }}>
            <h2>Minha locação</h2>
            <p style={{ marginBottom: ".3rem" }}><strong>{r.property?.title}</strong>{r.property?.neighborhood ? ` · ${r.property.neighborhood}` : ""}</p>
            <p style={{ color: "var(--stone)", fontSize: ".88rem", marginBottom: ".6rem" }}>
              {RENTAL_TYPE[r.type] ?? r.type} · Garantia: {GUARANTEE_LABEL[r.guaranteeType]} · vence todo dia {r.dueDay}
            </p>
            <div className="kpi" style={{ border: "none", padding: 0, marginBottom: ".8rem" }}>
              <strong>{brl(Number(r.rentValue))}</strong><span>aluguel mensal · vigência até {fmtD(r.endDate)}</span>
            </div>
            {r.payments.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".88rem" }}>
                <thead>
                  <tr style={{ color: "var(--stone)", textAlign: "left" }}>
                    <th style={{ paddingBottom: ".4rem", fontWeight: 500 }}>Referência</th>
                    <th style={{ paddingBottom: ".4rem", fontWeight: 500 }}>Vencimento</th>
                    <th style={{ paddingBottom: ".4rem", fontWeight: 500 }}>Valor</th>
                    <th style={{ paddingBottom: ".4rem", fontWeight: 500 }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {r.payments.map((p: any) => (
                    <tr key={p.referenceMonth} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: ".35rem 0" }}>{p.referenceMonth}</td>
                      <td style={{ padding: ".35rem 0" }}>{fmtD(p.dueDate)}</td>
                      <td style={{ padding: ".35rem 0", whiteSpace: "nowrap" }}>{brl(Number(p.totalBilled))}</td>
                      <td style={{ padding: ".35rem 0", color: PAY_COLOR[p.status] ?? "var(--stone)" }}>{PAY_LABEL[p.status] ?? p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: ".7rem" }}>
              Dúvidas sobre pagamentos? Entre em contato com a imobiliária.
            </p>
          </section>
        );
      })()}

      {/* ---- Favoritos ---- */}
      {data.favorites.length > 0 && (
        <section className="ficha-box">
          <h2>Meus favoritos</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".4rem" }}>
            {data.favorites.map((f: any) => (
              <li key={f.id} style={{ fontSize: ".92rem" }}>
                ♥ <a href={`/imoveis/${f.property.slug}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{f.property.title}</a>
                <span style={{ color: "var(--stone)" }}> · {f.property.neighborhood} · {brl(f.property.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p style={{ color: "var(--stone)", fontSize: ".8rem", marginTop: "1.6rem" }}>
        Dúvidas? Fale com seu corretor ou com a {org.name}
        {org.phone ? ` · ${org.phone}` : ""}. Para trocar sua senha, peça ao seu corretor.
      </p>
    </>
  );
}
