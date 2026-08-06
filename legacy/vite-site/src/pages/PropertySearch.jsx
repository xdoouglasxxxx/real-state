import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters, { PRICE_RANGES } from "@/components/PropertyFilters";

export default function PropertySearch() {
  const [params] = useSearchParams();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: params.get("type") ?? "",
    location: params.get("location") ?? "",
    price: Number(params.get("price") ?? 0),
  });

  useEffect(() => {
    base44.entities.Property.list("-created_date").then((rows) => {
      setAll(rows);
      setLoading(false);
    });
  }, []);

  const neighborhoods = useMemo(
    () => [...new Set(all.map((p) => p.neighborhood))],
    [all]
  );

  const range = PRICE_RANGES[filters.price] ?? PRICE_RANGES[0];
  const results = all.filter(
    (p) =>
      (!filters.type || p.property_type === filters.type) &&
      (!filters.location || p.neighborhood === filters.location) &&
      p.price >= range.min && p.price <= range.max
  );

  if (loading) return <div className="spinner" aria-label="Carregando" />;

  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Portfólio completo</p>
        <h1>Encontre o <em>seu</em> imóvel</h1>
      </div>

      <PropertyFilters
        filters={filters}
        setFilters={setFilters}
        neighborhoods={neighborhoods}
        count={results.length}
      />

      {results.length === 0 ? (
        <div className="empty">
          <h3>Nenhum imóvel com esses filtros.</h3>
          <p>Ajuste o tipo, a região ou a faixa de preço para ver mais opções.</p>
          <button
            className="btn-outline"
            onClick={() => setFilters({ type: "", location: "", price: 0 })}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {results.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </main>
  );
}
