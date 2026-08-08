import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireManagerUp } from "@/lib/perm";
import { storageEnabled } from "@/lib/storage";
import DocumentUploader from "@/components/painel/DocumentUploader";
import { deleteDocument } from "./actions";
import { KIND_LABEL } from "@/lib/doc-kinds"; // Q1: fonte única — não duplicar aqui e no uploader

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function Documentos({ searchParams }: { searchParams: { erro?: string } }) {
  const ctx = await requireManagerUp();

  let docs: any[] = [], properties: any[] = [], contracts: any[] = [], finances: any[] = [];
  let loadError = false;
  if (process.env.DATABASE_URL) {
    try {
      [docs, properties, contracts, finances] = await Promise.all([
        prisma.document.findMany({
          where: { organizationId: ctx.org.id },
          orderBy: { uploadedAt: "desc" }, take: 200,
          include: {
            property: { select: { id: true, title: true } },
            contract: { select: { id: true, proposal: { select: { property: { select: { title: true } } } } } },
            financeEntry: { select: { id: true, description: true } },
          },
        }),
        prisma.property.findMany({ where: { organizationId: ctx.org.id }, orderBy: { title: "asc" }, select: { id: true, title: true }, take: 300 }),
        prisma.contract.findMany({
          where: { organizationId: ctx.org.id, status: { notIn: ["CANCELED"] } },
          orderBy: { createdAt: "desc" }, take: 100,
          select: { id: true, status: true, proposal: { select: { property: { select: { title: true } } } } },
        }),
        prisma.financeEntry.findMany({ where: { organizationId: ctx.org.id }, orderBy: { dueDate: "desc" }, take: 60, select: { id: true, description: true } }),
      ]);
    } catch (e) {
      // B7: logar o erro com prefixo identificável; exibir aviso em vez de página silenciosamente vazia.
      console.error("Documentos page — falha ao carregar dados:", e);
      loadError = true;
    }
  }

  return (
    <>
      <div className="phead">
        <h1>Documentos</h1>
        <span className="pill">{docs.length} arquivos</span>
      </div>

      {searchParams.erro === "1" && (
        <p className="pform-error">Erro ao excluir o documento — tente novamente ou contacte o suporte.</p>
      )}
      {loadError && (
        <p className="pform-error">Não foi possível carregar os documentos. Verifique a conexão com o banco e recarregue a página.</p>
      )}
      {!storageEnabled() && (
        <p className="pform-error">
          Storage não configurado — os documentos antigos (por URL) continuam funcionando, mas o upload fica desativado.
          Ativação em 5 minutos: siga o <strong>STORAGE.md</strong> (criar bucket &quot;documentos&quot; + 2 variáveis na Vercel + redeploy).
        </p>
      )}

      <DocumentUploader
        properties={properties.map((p) => ({ id: p.id, label: p.title }))}
        contracts={contracts.map((c) => ({ id: c.id, label: `${c.proposal?.property?.title ?? "Contrato"} · ${c.status}` }))}
        finances={finances.map((f) => ({ id: f.id, label: f.description }))}
      />

      <h2 style={{ margin: "1.6rem 0 .8rem" }}>Arquivos</h2>
      {docs.length === 0 ? (
        <p style={{ color: "var(--stone)" }}>Nenhum documento ainda — envie o primeiro acima. Matrículas, IPTU, contratos e comprovantes ficam organizados e rastreáveis aqui.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Documento</th><th>Tipo</th><th>Vínculo</th><th>Enviado</th><th></th><th></th></tr></thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td><span className="pill">{KIND_LABEL[d.kind] ?? d.kind}</span></td>
                <td style={{ fontSize: ".85rem" }}>
                  {d.property ? <Link href={`/painel/imoveis/${d.property.id}`} style={{ color: "var(--brass)", textDecoration: "underline", textUnderlineOffset: 3 }}>{d.property.title}</Link>
                    : d.contract ? <>Contrato · {d.contract.proposal?.property?.title ?? d.contract.id}</>
                    : d.financeEntry ? <>💰 {d.financeEntry.description}</>
                    : "—"}
                </td>
                <td style={{ color: "var(--stone)", fontSize: ".8rem" }}>
                  {fmtD(d.uploadedAt)}{d.uploadedBy ? ` · ${d.uploadedBy}` : ""}
                </td>
                <td>
                  <a className="pill" style={{ textDecoration: "none" }}
                     href={d.fileUrl.startsWith("http") ? d.fileUrl : `/painel/documentos/${d.id}/baixar`}
                     target="_blank" rel="noopener">Baixar</a>
                </td>
                <td>
                  {ctx.isAdmin && (
                    <form action={deleteDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="pill" type="submit" style={{ cursor: "pointer", background: "none", color: "#c67a6b", borderColor: "#7a4640" }}>Excluir</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
