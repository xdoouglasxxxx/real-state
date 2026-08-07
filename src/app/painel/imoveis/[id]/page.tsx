import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerUp } from "@/lib/perm";
import { getAgents, getPanelProperty } from "@/lib/data";
import { setPropertyStatus } from "@/app/painel/actions";
import PropertyForm from "@/components/painel/PropertyForm";
import FinancingSimulator from "@/components/painel/FinancingSimulator";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarImovel({
  params, searchParams,
}: { params: { id: string }; searchParams: { erro?: string; salvo?: string } }) {
  const { org } = await requireManagerUp();
  const [property, agents] = await Promise.all([
    getPanelProperty(org.id, params.id),
    getAgents(org.id),
  ]);
  if (!property) notFound();

  const StatusBtn = ({ status, label }: { status: string; label: string }) => (
    <form action={setPropertyStatus}>
      <input type="hidden" name="id" value={property.id} />
      <input type="hidden" name="status" value={status} />
      <button className="btn-outline" type="submit">{label}</button>
    </form>
  );

  return (
    <>
      <Link className="back" href="/painel/imoveis">← Voltar aos imóveis</Link>
      <h1>{property.title}</h1>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Alterações salvas — o site já foi atualizado.</p>}

      <div className="pstatus-bar">
        <a className="btn-outline" href={`/imovel/${property.slug}`} target="_blank">Ver no site ↗</a>
        {property.status !== "FOR_SALE" && <StatusBtn status="FOR_SALE" label="Publicar / Reativar" />}
        {property.status === "FOR_SALE" && <StatusBtn status="RESERVED" label="Marcar reservado" />}
        {property.status !== "SOLD" && <StatusBtn status="SOLD" label="Marcar vendido" />}
        {property.status !== "ARCHIVED" && <StatusBtn status="ARCHIVED" label="Arquivar" />}
      </div>

      <PropertyForm property={property} agents={agents as any} erro={searchParams.erro} />

      <FinancingSimulator price={Number((property as any).price ?? 0)} />

      <JuridicalDocs propertyId={(property as any).id} />
    </>
  );
}


/** Documentação jurídica do imóvel: badges de presença + lista dos arquivos. */
async function JuridicalDocs({ propertyId }: { propertyId: string }) {
  let docs: any[] = [];
  if (process.env.DATABASE_URL) {
    try {
      docs = await prisma.document.findMany({
        where: { propertyId },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, name: true, kind: true, fileUrl: true, uploadedAt: true },
      });
    } catch {}
  }
  const has = (k: string) => docs.some((d) => d.kind === k);
  const CORE: [string, string][] = [["MATRICULA", "Matrícula"], ["IPTU", "IPTU"], ["ESCRITURA", "Escritura"], ["ONUS", "Certidão de ônus"]];
  const missing = CORE.filter(([k]) => !has(k));

  return (
    <section className="ficha-box" style={{ marginTop: "1.4rem" }}>
      <h2>📁 Documentação jurídica</h2>
      <p style={{ display: "flex", gap: ".45rem", flexWrap: "wrap", margin: ".6rem 0 .8rem" }}>
        {CORE.map(([k, label]) => (
          <span key={k} className="pill" style={has(k) ? { borderColor: "#425c3c", color: "#8fbb7d" } : { borderColor: "#7a6538", color: "#d0a94e" }}>
            {label} {has(k) ? "✅" : "🟡"}
          </span>
        ))}
      </p>
      {missing.length > 0 && (
        <p style={{ color: "var(--stone)", fontSize: ".85rem", marginBottom: ".8rem" }}>
          ⚠ Pendente: {missing.map(([, l]) => l).join(", ")} — não inicie negociação sem regularizar; anexe em Documentos.
        </p>
      )}
      {docs.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".35rem" }}>
          {docs.map((d) => (
            <li key={d.id} style={{ fontSize: ".88rem" }}>
              📄 <a href={d.fileUrl.startsWith("http") ? d.fileUrl : `/painel/documentos/${d.id}/baixar`} target="_blank" rel="noopener"
                    style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{d.name}</a>
              <span style={{ color: "var(--stone)" }}> · {new Date(d.uploadedAt).toLocaleDateString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: ".8rem" }}>
        <Link className="btn-outline" href="/painel/documentos">Gerenciar documentos</Link>
      </p>
    </section>
  );
}
