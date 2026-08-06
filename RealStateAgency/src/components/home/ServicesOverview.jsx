const SERVICES = [
  { title: "Compra assessorada", desc: "Curadoria de imóveis dentro do seu perfil, visitas acompanhadas e negociação em seu nome." },
  { title: "Venda estratégica", desc: "Precificação por análise comparativa, produção visual profissional e divulgação segmentada." },
  { title: "Avaliação de mercado", desc: "Estudo de valor em 48 h, com base em transações reais da região — sem custo e sem compromisso." },
  { title: "Assessoria jurídica", desc: "Due diligence, contratos e escritura conduzidos por equipe jurídica própria, do início ao fim." },
];

export default function ServicesOverview() {
  return (
    <section className="section cream">
      <div className="section-head">
        <p className="eyebrow dark">Como trabalhamos</p>
        <h2 className="dark">Serviço completo, <em>do começo ao fim</em></h2>
      </div>
      <div className="grid-4">
        {SERVICES.map((s) => (
          <div className="service" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
