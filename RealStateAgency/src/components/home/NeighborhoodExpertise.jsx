import { useNavigate } from "react-router-dom";

const NEIGHBORHOODS = [
  { name: "Jardins", tag: "Clássico e arborizado", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80" },
  { name: "Itaim Bibi", tag: "Skyline e conveniência", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80" },
  { name: "Alphaville", tag: "Espaço e privacidade", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80" },
  { name: "Riviera", tag: "Pé na areia", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80" },
];

export default function NeighborhoodExpertise() {
  const navigate = useNavigate();
  return (
    <section className="section">
      <div className="section-head">
        <p className="eyebrow">Especialistas de bairro</p>
        <h2>Conhecemos cada <em>esquina</em></h2>
      </div>
      <div className="grid-4">
        {NEIGHBORHOODS.map((n) => (
          <button className="hood" key={n.name} onClick={() => navigate("/imoveis")}>
            <img src={n.img} alt={n.name} loading="lazy" />
            <div className="hood-label"><h3>{n.name}</h3><span>{n.tag}</span></div>
          </button>
        ))}
      </div>
    </section>
  );
}
