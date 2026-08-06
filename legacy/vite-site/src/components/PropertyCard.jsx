import { Link } from "react-router-dom";
import { formatBRL } from "@/lib/utils";
import { statusLabel } from "@/lib/badgeUtils";

export default function PropertyCard({ property, light = false }) {
  return (
    <Link className={"card" + (light ? " light" : "")} to={`/imovel/${property.id}`}>
      <div className="card-media">
        <img src={property.images?.[0]} alt={property.title} loading="lazy" />
        <span className="badge">{statusLabel(property.status)}</span>
      </div>
      <div className="card-body">
        <p className="card-loc">{property.neighborhood}</p>
        <h3>{property.title}</h3>
        <p className="card-price">{formatBRL(property.price)}</p>
        <p className="card-specs">
          {property.bedrooms} quartos · {property.bathrooms} banheiros · {property.area_m2} m²
        </p>
      </div>
    </Link>
  );
}
