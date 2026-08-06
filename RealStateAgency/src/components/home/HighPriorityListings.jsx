import { Link } from "react-router-dom";
import PropertyCard from "@/components/PropertyCard";

export default function HighPriorityListings({ properties = [] }) {
  return (
    <section className="section cream">
      <div className="section-head">
        <p className="eyebrow dark">Seleção da semana</p>
        <h2 className="dark">Imóveis em <em>destaque</em></h2>
      </div>
      <div className="grid-3">
        {properties.map((p) => <PropertyCard key={p.id} property={p} light />)}
      </div>
      <div className="center">
        <Link className="btn-dark" to="/imoveis">Ver todos os imóveis</Link>
      </div>
    </section>
  );
}
