import Link from "next/link";
import { brl, STATUS_LABEL } from "@/lib/format";
import { MCMV_TETO_IMOVEL } from "@/lib/financing";

export default function PropertyCard({ p, light = false }: { p: any; light?: boolean }) {
  const isMcmv = Number(p.price) <= MCMV_TETO_IMOVEL && !["RENTED", "SOLD"].includes(p.status);
  return (
    <Link className={"card" + (light ? " light" : "")} href={`/imovel/${p.slug}`}>
      <div className="card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images?.[0]} alt={p.title} loading="lazy" />
        <span className="badge">{STATUS_LABEL[p.status] ?? p.status}</span>
        {isMcmv && (
          <span className="badge" style={{ top: "3.2rem", background: "#2c6e49", color: "#e8f5e9" }}>
            Financiável · MCMV
          </span>
        )}
      </div>
      <div className="card-body">
        <p className="card-loc">{p.neighborhood} · {p.city}</p>
        <h3>{p.title}</h3>
        <p className="card-price">{brl(p.price)}</p>
        <p className="card-specs">{p.bedrooms} quartos · {p.bathrooms} banheiros · {p.areaM2} m²</p>
      </div>
    </Link>
  );
}
