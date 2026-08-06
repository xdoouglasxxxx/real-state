export const PRICE_RANGES = [
  { label: "Qualquer preço", min: 0, max: Infinity },
  { label: "Até R$ 1 mi", min: 0, max: 1_000_000 },
  { label: "R$ 1 – 3 mi", min: 1_000_000, max: 3_000_000 },
  { label: "R$ 3 – 6 mi", min: 3_000_000, max: 6_000_000 },
  { label: "Acima de R$ 6 mi", min: 6_000_000, max: Infinity },
];

export default function PropertyFilters({ filters, setFilters, neighborhoods, count }) {
  return (
    <div className="filter-bar" role="search">
      <select
        value={filters.type}
        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        aria-label="Tipo"
      >
        <option value="">Qualquer tipo</option>
        <option value="house">Casa</option>
        <option value="apartment">Apartamento</option>
      </select>
      <select
        value={filters.location}
        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        aria-label="Região"
      >
        <option value="">Qualquer região</option>
        {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <select
        value={filters.price}
        onChange={(e) => setFilters({ ...filters, price: Number(e.target.value) })}
        aria-label="Preço"
      >
        {PRICE_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
      </select>
      <span className="filter-count">{count} {count === 1 ? "imóvel" : "imóveis"}</span>
    </div>
  );
}
