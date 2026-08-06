import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { searchProperties, getNeighborhoods } from "@/lib/data";
import PropertyCard from "@/components/site/PropertyCard";

export const metadata: Metadata = { title: "Imóveis à venda" };

type SP = { type?: string; location?: string; price?: string };

export default async function Imoveis({ searchParams }: { searchParams: SP }) {
  const org = await getTenant();
  const [min, max] = (searchParams.price ?? "").split("-").map((v) => (v ? Number(v) : undefined));
  const [results, hoods] = await Promise.all([
    searchProperties(org.id, { type: searchParams.type || undefined, location: searchParams.location || undefined, min, max }),
    getNeighborhoods(org.id),
  ]);

  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Portfólio completo</p>
        <h1>Encontre o <em>seu</em> imóvel</h1>
      </div>

      <form method="GET" className="filter-bar" role="search">
        <select name="type" defaultValue={searchParams.type ?? ""} aria-label="Tipo">
          <option value="">Qualquer tipo</option>
          <option value="HOUSE">Casa</option>
          <option value="APARTMENT">Apartamento</option>
        </select>
        <select name="location" defaultValue={searchParams.location ?? ""} aria-label="Região">
          <option value="">Qualquer região</option>
          {hoods.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select name="price" defaultValue={searchParams.price ?? ""} aria-label="Preço">
          <option value="">Qualquer preço</option>
          <option value="0-1000000">Até R$ 1 mi</option>
          <option value="1000000-3000000">R$ 1 – 3 mi</option>
          <option value="3000000-6000000">R$ 3 – 6 mi</option>
          <option value="6000000-">Acima de R$ 6 mi</option>
        </select>
        <button className="btn-outline" type="submit">Filtrar</button>
        <span className="filter-count">{results.length} {results.length === 1 ? "imóvel" : "imóveis"}</span>
      </form>

      {results.length === 0 ? (
        <div className="empty">
          <h3>Nenhum imóvel com esses filtros.</h3>
          <p>Ajuste o tipo, a região ou a faixa de preço para ver mais opções.</p>
          <a className="btn-outline" href="/imoveis">Limpar filtros</a>
        </div>
      ) : (
        <div className="grid-3">
          {results.map((p: any) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}
