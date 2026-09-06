import { prisma } from "@/lib/prisma";
import { requireClientPortal } from "@/lib/perm";
import { CONTRACT_LABEL } from "@/lib/data";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function ContratosPage() {
  const ctx = await requireClientPortal();

  let contracts: any[] = [];
  try {
    if (ctx.contactIds.length > 0) {
      // Só o que o cliente pode ver — nunca comissões, forma de pagamento ou COAF
      contracts = await prisma.contract.findMany({
        where: { organizationId: ctx.org.id, proposal: { contactId: { in: ctx.contactIds } } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, status: true, totalAmount: true, signedAt: true, closedAt: true, createdAt: true,
          proposal: {
            select: {
              amount: true,
              property: { select: { title: true, slug: true, neighborhood: true } },
            },
          },
          documents: { select: { id: true, name: true, fileUrl: true, uploadedAt: true } },
        },
      });
    }
  } catch (e) { console.error("portal/contratos:", e); }

  return (
    <>
      <h1>Meus contratos</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.6rem" }}>
        Situação e documentos dos seus contratos com a {ctx.org.name}.
      </p>

      {contracts.length === 0 && (
        <section className="ficha-box">
          <h2>Nenhum contrato ainda</h2>
          <p style={{ color: "var(--stone)" }}>
            Quando uma proposta for aceita e o contrato for gerado, ele aparece aqui com os documentos.
          </p>
        </section>
      )}

      {contracts.map((c) => (
        <section className="ficha-box" key={c.id} style={{ marginBottom: "1.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "baseline" }}>
            <h2>{c.proposal?.property?.title ?? "Contrato"}</h2>
            <span className="pill">{CONTRACT_LABEL[c.status] ?? c.status}</span>
          </div>
          <p style={{ color: "var(--stone)", fontSize: ".88rem", margin: ".3rem 0 .8rem" }}>
            {c.proposal?.property?.neighborhood ? `${c.proposal.property.neighborhood} · ` : ""}
            {brl(Number(c.totalAmount ?? c.proposal?.amount ?? 0))}
            {c.signedAt ? ` · assinado em ${fmtD(c.signedAt)}` : ` · criado em ${fmtD(c.createdAt)}`}
            {c.closedAt ? ` · concluído em ${fmtD(c.closedAt)}` : ""}
          </p>

          {c.documents.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".3rem" }}>
              {c.documents.map((doc: any) => (
                <li key={doc.id} style={{ fontSize: ".88rem" }}>
                  📄 <a href={doc.fileUrl.startsWith("http") ? doc.fileUrl : `/cliente/doc/${doc.id}`} target="_blank" rel="noopener"
                        style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{doc.name}</a>
                  <span style={{ color: "var(--stone)" }}> · {fmtD(doc.uploadedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>
              Os documentos aparecem aqui assim que forem anexados pela imobiliária.
            </p>
          )}
        </section>
      ))}
    </>
  );
}
