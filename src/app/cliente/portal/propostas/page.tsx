import { prisma } from "@/lib/prisma";
import { requireClientPortal } from "@/lib/perm";
import { CLIENT_STAGE, PROPOSAL_LABEL } from "@/lib/data";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function PropostasPage() {
  const ctx = await requireClientPortal();

  let journeys: any[] = [];
  try {
    if (ctx.contactIds.length > 0) {
      journeys = await prisma.lead.findMany({
        where: { organizationId: ctx.org.id, contactId: { in: ctx.contactIds } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true, stage: true,
          property: { select: { title: true, slug: true, neighborhood: true, city: true, price: true } },
          proposals: {
            orderBy: { createdAt: "desc" },
            select: { id: true, amount: true, conditions: true, status: true, createdAt: true, respondedAt: true },
          },
        },
      });
    }
  } catch (e) { console.error("portal/propostas:", e); }

  return (
    <>
      <h1>Minhas propostas</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.6rem" }}>
        Acompanhe as propostas de cada negociação com a {ctx.org.name}.
      </p>

      {journeys.length === 0 && (
        <section className="ficha-box">
          <h2>Nenhuma negociação em andamento</h2>
          <p style={{ color: "var(--stone)" }}>
            Assim que você demonstrar interesse em um imóvel, a negociação e as propostas aparecem aqui.
          </p>
        </section>
      )}

      {journeys.map((j) => {
        const st = CLIENT_STAGE[j.stage] ?? { label: j.stage, pct: 0 };
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

            {j.proposals.length === 0 ? (
              <p style={{ color: "var(--stone)", fontSize: ".9rem" }}>Nenhuma proposta enviada nesta negociação ainda.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".55rem" }}>
                {j.proposals.map((pr: any) => (
                  <li key={pr.id} style={{ borderTop: "1px solid var(--line)", paddingTop: ".55rem" }}>
                    <p style={{ marginBottom: ".15rem" }}>
                      <strong>{brl(Number(pr.amount))}</strong> <span className="pill">{PROPOSAL_LABEL[pr.status] ?? pr.status}</span>
                    </p>
                    <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>
                      Enviada em {fmtD(pr.createdAt)}
                      {pr.respondedAt ? ` · respondida em ${fmtD(pr.respondedAt)}` : ""}
                      {pr.conditions ? ` · ${pr.conditions}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
