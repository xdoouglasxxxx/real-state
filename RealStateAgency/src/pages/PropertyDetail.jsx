import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatBRL } from "@/lib/utils";
import { statusLabel, typeLabel } from "@/lib/badgeUtils";
import PropertyCard from "@/components/PropertyCard";
import InquiryForm from "@/components/InquiryForm";

export default function PropertyDetail() {
  const { id } = useParams();
  const [prop, setProp] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [mainImg, setMainImg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const p = await base44.entities.Property.get(id);
      setProp(p);
      setMainImg(p?.images?.[0] ?? "");
      if (p) {
        const sim = await base44.entities.Property.filter({ property_type: p.property_type });
        setSimilar(sim.filter((s) => s.id !== p.id).slice(0, 2));
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="spinner" aria-label="Carregando" />;

  if (!prop) {
    return (
      <main className="page narrow center-page">
        <p className="eyebrow">Imóvel não encontrado</p>
        <h1>Este anúncio não está mais <em>disponível</em></h1>
        <Link className="btn-solid inline-btn" to="/imoveis">Ver imóveis disponíveis</Link>
      </main>
    );
  }

  return (
    <main className="page">
      <Link className="back" to="/imoveis">← Voltar aos imóveis</Link>

      <div className="detail-grid">
        <div>
          <div className="detail-main-img">
            <img src={mainImg} alt={prop.title} />
            <span className="badge">{statusLabel(prop.status)}</span>
          </div>
          <div className="thumbs">
            {prop.images.map((g) => (
              <button
                key={g}
                className={"thumb" + (g === mainImg ? " on" : "")}
                onClick={() => setMainImg(g)}
                aria-label="Ver foto"
              >
                <img src={g} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <p className="eyebrow">{prop.neighborhood}</p>
          <h1>{prop.title}</h1>
          <p className="detail-price">{formatBRL(prop.price)}</p>
          <p className="card-specs big">
            {prop.bedrooms} quartos · {prop.bathrooms} banheiros · {prop.area_m2} m² · {typeLabel(prop.property_type)}
          </p>
          <p className="detail-desc">{prop.description}</p>
          <ul className="features">
            {prop.features?.map((f) => <li key={f}>{f}</li>)}
          </ul>

          <div className="inquiry">
            <h3>Agendar visita</h3>
            <InquiryForm propertyId={prop.id} kind="visit" />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="section tight" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h2>Você também pode <em>gostar</em></h2>
          <div className="grid-3" style={{ marginTop: "2rem" }}>
            {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}
