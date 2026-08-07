import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerUp } from "@/lib/perm";
import { getAgents, getPanelProperty } from "@/lib/data";
import { setPropertyStatus } from "@/app/painel/actions";
import PropertyForm from "@/components/painel/PropertyForm";
import FinancingSimulator from "@/components/painel/FinancingSimulator";

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
    </>
  );
}
