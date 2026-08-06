import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getFeaturedProperties, getNeighborhoods, getAgents, getTestimonials } from "@/lib/data";
import { HERO_VIDEO, HERO_FALLBACK, PARALLAX_IMG } from "@/lib/demo-data";
import PropertyCard from "@/components/site/PropertyCard";
import Parallax from "@/components/site/Parallax";

const HOODS = [
  { name: "Jardins", tag: "Clássico e arborizado", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80" },
  { name: "Itaim Bibi", tag: "Skyline e conveniência", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80" },
  { name: "Alphaville", tag: "Espaço e privacidade", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80" },
  { name: "Riviera de São Lourenço", tag: "Pé na areia", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80" },
];

const SERVICES = [
  { title: "Compra assessorada", desc: "Curadoria de imóveis dentro do seu perfil, visitas acompanhadas e negociação em seu nome." },
  { title: "Venda estratégica", desc: "Precificação por análise comparativa, produção visual profissional e divulgação segmentada." },
  { title: "Avaliação de mercado", desc: "Estudo de valor em 48 h com base em transações reais da região — sem custo." },
  { title: "Assessoria jurídica", desc: "Due diligence, contratos e escritura conduzidos por equipe própria, do início ao fim." },
];

export default async function Home() {
  const org = await getTenant();
  const [featured, hoods, agents, testimonials] = await Promise.all([
    getFeaturedProperties(org.id),
    getNeighborhoods(org.id),
    getAgents(org.id),
    getTestimonials(org.id),
  ]);

  return (
    <main>
      {/* HERO com vídeo + busca em frase (form GET puro, zero JS) */}
      <header className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-img" src={HERO_FALLBACK} alt="" aria-hidden="true" />
        <video className="hero-img hero-video" src={HERO_VIDEO} autoPlay muted loop playsInline
          aria-label="Casa de alto padrão iluminada ao entardecer" />
        <div className="hero-veil" />
        <div className="hero-content">
          <p className="eyebrow">{org.name} · Imóveis de alto padrão</p>
          <h1>Bem-vindo ao seu<br /><em>próximo</em> lar</h1>

          <form action="/imoveis" method="GET">
            <div className="search-sentence">
              <span>Procuro</span>
              <select name="type" defaultValue="" aria-label="Tipo de imóvel">
                <option value="">Qualquer tipo</option>
                <option value="HOUSE">Casa</option>
                <option value="APARTMENT">Apartamento</option>
              </select>
              <span>em</span>
              <select name="location" defaultValue="" aria-label="Região">
                <option value="">Qualquer região</option>
                {hoods.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>por</span>
              <select name="price" defaultValue="" aria-label="Faixa de preço">
                <option value="">Qualquer preço</option>
                <option value="0-1000000">Até R$ 1 mi</option>
                <option value="1000000-3000000">R$ 1 – 3 mi</option>
                <option value="3000000-6000000">R$ 3 – 6 mi</option>
                <option value="6000000-">Acima de R$ 6 mi</option>
              </select>
            </div>
            <button className="btn-solid" type="submit">Buscar imóveis</button>
          </form>
        </div>
      </header>

      {/* DESTAQUES */}
      <section className="section cream">
        <div className="section-head">
          <p className="eyebrow dark">Seleção da semana</p>
          <h2 className="dark">Imóveis em <em>destaque</em></h2>
        </div>
        <div className="grid-3">
          {featured.map((p: any) => <PropertyCard key={p.id} p={p} light />)}
        </div>
        <div className="center"><Link className="btn-dark" href="/imoveis">Ver todos os imóveis</Link></div>
      </section>

      {/* BAIRROS */}
      <section className="section">
        <div className="section-head">
          <p className="eyebrow">Especialistas de bairro</p>
          <h2>Conhecemos cada <em>esquina</em></h2>
        </div>
        <div className="grid-4">
          {HOODS.map((n) => (
            <Link className="hood" key={n.name} href={`/imoveis?location=${encodeURIComponent(n.name)}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.img} alt={n.name} loading="lazy" />
              <div className="hood-label"><h3>{n.name}</h3><span>{n.tag}</span></div>
            </Link>
          ))}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="section cream">
        <div className="section-head">
          <p className="eyebrow dark">Como trabalhamos</p>
          <h2 className="dark">Serviço completo, <em>do começo ao fim</em></h2>
        </div>
        <div className="grid-4">
          {SERVICES.map((s) => (
            <div className="service" key={s.title}><h3>{s.title}</h3><p>{s.desc}</p></div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="section stats-strip">
        {[["14 anos", "de mercado"], ["R$ 2,1 bi", "em vendas"], ["640+", "famílias atendidas"], ["31 dias", "tempo médio de venda"]].map(([n, l]) => (
          <div className="stat" key={l}><strong>{n}</strong><span>{l}</span></div>
        ))}
      </section>

      {/* EQUIPE */}
      <section className="section tight">
        <div className="section-head">
          <p className="eyebrow">Quem atende você</p>
          <h2>Nossa <em>equipe</em></h2>
        </div>
        <div className="grid-3">
          {agents.map((a: any) => (
            <article className="agent" key={a.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photoUrl} alt={a.name} loading="lazy" />
              <h3>{a.name}</h3>
              <p>{a.creci}</p>
              <span className="agent-phone">{a.phone}</span>
            </article>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="section tight">
        <div className="section-head">
          <p className="eyebrow">Quem confia</p>
          <h2>Histórias de quem <em>chegou em casa</em></h2>
        </div>
        <div className="grid-3">
          {testimonials.map((t: any) => (
            <figure className="quote" key={t.id}>
              <blockquote>“{t.text}”</blockquote>
              <figcaption><strong>{t.author}</strong><span>{t.context}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA + PARALLAX */}
      <section className="cta">
        <div>
          <h2>Pensando em <em>vender</em>?</h2>
          <p>Avaliamos seu imóvel sem custo e apresentamos um plano de venda em até 48 horas.</p>
        </div>
        <Link className="btn-solid" href="/vender">Solicitar avaliação</Link>
      </section>

      <Parallax src={PARALLAX_IMG} alt="Casa moderna de madeira e pedra com piscina ao entardecer" />
    </main>
  );
}
