import Link from "next/link";
import { requireManagerUp } from "@/lib/perm";
import { getAgents } from "@/lib/data";
import PropertyForm from "@/components/painel/PropertyForm";

export const dynamic = "force-dynamic";

export default async function NovoImovel({ searchParams }: { searchParams: { erro?: string } }) {
  const { org } = await requireManagerUp();
  const agents = await getAgents(org.id);
  return (
    <>
      <Link className="back" href="/painel/imoveis">← Voltar aos imóveis</Link>
      <h1>Novo imóvel</h1>
      <PropertyForm agents={agents as any} erro={searchParams.erro} />
    </>
  );
}
