import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HERO_VIDEO, HERO_FALLBACK } from "@/api/mockData";
import { PRICE_RANGES } from "@/components/PropertyFilters";

export default function HeroSection({ neighborhoods = [] }) {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState(0);

  const search = () => {
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    if (location) qs.set("location", location);
    if (price) qs.set("price", String(price));
    navigate("/imoveis" + (qs.toString() ? `?${qs}` : ""));
  };

  return (
    <header className="hero">
      <img className="hero-img" src={HERO_FALLBACK} alt="" aria-hidden="true" />
      <video
        className="hero-img hero-video"
        src={HERO_VIDEO}
        autoPlay muted loop playsInline
        aria-label="Casa de alto padrão iluminada ao entardecer"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div className="hero-veil" />
      <div className="hero-content">
        <p className="eyebrow">Imóveis de alto padrão · São Paulo</p>
        <h1>Bem-vindo ao seu<br /><em>próximo</em> lar</h1>

        <div className="search-sentence">
          <span>Procuro</span>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo de imóvel">
            <option value="">Qualquer tipo</option>
            <option value="house">Casa</option>
            <option value="apartment">Apartamento</option>
          </select>
          <span>em</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Região">
            <option value="">Qualquer região</option>
            {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>por</span>
          <select value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-label="Faixa de preço">
            {PRICE_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
          </select>
        </div>

        <button className="btn-solid" onClick={search}>Buscar imóveis</button>
      </div>
    </header>
  );
}
