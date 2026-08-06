import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { PARALLAX_IMG } from "@/api/mockData";
import HeroSection from "@/components/home/HeroSection";
import HighPriorityListings from "@/components/home/HighPriorityListings";
import NeighborhoodExpertise from "@/components/home/NeighborhoodExpertise";
import ServicesOverview from "@/components/home/ServicesOverview";
import MarketInsights from "@/components/home/MarketInsights";
import AgentHighlights from "@/components/home/AgentHighlights";
import ClientStories from "@/components/home/ClientStories";
import { Link } from "react-router-dom";

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, a, t, all] = await Promise.all([
        base44.entities.Property.filter({ is_featured: true }, "-created_date", 6),
        base44.entities.Agent.filter({ is_featured: true }, "-created_date", 3),
        base44.entities.Testimonial.list("-created_date", 5),
        base44.entities.Property.list(),
      ]);
      setProperties(p.slice(0, 3));
      setAgents(a);
      setTestimonials(t.slice(0, 3));
      setNeighborhoods([...new Set(all.map((x) => x.neighborhood))]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="spinner" aria-label="Carregando" />;

  return (
    <div>
      <HeroSection neighborhoods={neighborhoods} />
      <HighPriorityListings properties={properties} />
      <NeighborhoodExpertise />
      <ServicesOverview />
      <MarketInsights />
      <AgentHighlights agents={agents} />
      <ClientStories testimonials={testimonials} />

      <section className="cta">
        <div>
          <h2>Pensando em <em>vender</em>?</h2>
          <p>Avaliamos seu imóvel sem custo e apresentamos um plano de venda em até 48 horas.</p>
        </div>
        <Link className="btn-solid" to="/vender">Solicitar avaliação</Link>
      </section>

      <ParallaxFinale />
    </div>
  );
}

function ParallaxFinale() {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      setOffset(progress * -15);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={ref} className="parallax">
      <img
        src={PARALLAX_IMG}
        alt="Casa moderna de madeira e pedra com piscina ao entardecer"
        style={{ transform: `translateY(${offset}%)` }}
        loading="lazy"
      />
    </section>
  );
}
