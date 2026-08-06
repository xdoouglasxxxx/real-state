const STATS = [
  ["14 anos", "de mercado"],
  ["R$ 2,1 bi", "em vendas"],
  ["640+", "famílias atendidas"],
  ["31 dias", "tempo médio de venda"],
];

export default function MarketInsights() {
  return (
    <section className="section stats-strip">
      {STATS.map(([n, l]) => (
        <div className="stat" key={l}><strong>{n}</strong><span>{l}</span></div>
      ))}
    </section>
  );
}
