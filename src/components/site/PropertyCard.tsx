import Link from "next/link";
import { brl, STATUS_LABEL } from "@/lib/format";

export default function PropertyCard({ p, light = false }: { p: any; light?: boolean }) {
  return (
    <Link className={"card" + (light ? " light" : "")} href={`/imovel/${p.slug}`}>
      <div className="card-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images?.[0]} alt={p.title} loading="lazy" />
        <span className="badge">{STATUS_LABEL[p.status] ?? p.status}</span>
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
