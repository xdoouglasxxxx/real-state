import Link from "next/link";
import { brl, STATUS_LABEL } from "@/lib/format";
import { MCMV_TETO_IMOVEL } from "@/lib/financing";

const BED = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 19V7M3 14h18v5M21 14v-3a3 3 0 0 0-3-3h-7v6" /></svg>;
const BATH = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" /></svg>;
const AREA = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;

/** Cartão de imóvel (vitrine escura). Mostra só o que o imóvel realmente tem: sem "0 quartos" nem "null m²". */
export default function PropertyCard({ p }: { p: any; light?: boolean }) {
  const isMcmv = Number(p.price) <= MCMV_TETO_IMOVEL && !["RENTED", "SOLD"].includes(p.status);
  const where = [p.neighborhood, p.city].filter(Boolean).join(" · ");
  const img = p.images?.[0];
  return (
    <Link className="pc" href={`/imovel/${p.slug}`}>
      <div className="pc-media">
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={img} alt={p.title} loading="lazy" />
          : <span className="pc-noimg" aria-hidden="true">Sem foto</span>}
        <span className="pc-badge">{STATUS_LABEL[p.status] ?? p.status}</span>
        {isMcmv && <span className="pc-badge pc-mcmv">Financiável · MCMV</span>}
      </div>
      <div className="pc-body">
        <p className="pc-price">{brl(p.price)}</p>
        <h3>{p.title}</h3>
        {where && <p className="pc-loc">{where}</p>}
        <p className="pc-specs">
          {p.bedrooms > 0 && <span>{BED}{p.bedrooms} {p.bedrooms === 1 ? "quarto" : "quartos"}</span>}
          {p.bathrooms > 0 && <span>{BATH}{p.bathrooms} {p.bathrooms === 1 ? "banheiro" : "banheiros"}</span>}
          {p.areaM2 > 0 && <span>{AREA}{p.areaM2} m²</span>}
        </p>
      </div>
    </Link>
  );
}
