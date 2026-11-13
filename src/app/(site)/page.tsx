import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getFeaturedProperties, getAgents, getTestimonials, getMapPins } from "@/lib/data";
import { loadSiteSummary } from "@/lib/site-summary";
import { PRICE_BANDS } from "@/lib/search";
import { TYPE_LABEL } from "@/lib/format";
import { plural, whatsappHref } from "@/lib/site";
import PropertyCard from "@/components/site/PropertyCard";
import PublicMap from "@/components/site/PublicMap";

const OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Check = () => <svg width="18" height="18" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>;
const House = () => <svg width="18" height="18" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h14V10" /></svg>;
const Plus = () => <svg width="18" height="18" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M12 3v18M3 12h18" /></svg>;
const Chat = () => <svg width="18" height="18" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.2A8 8 0 1 1 21 12z" /></svg>;
const Star = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 7 7 .6-5.3 4.7L18.2 22 12 18.3 5.8 22l1.5-7.7L2 9.6 9 9z" /></svg>;

const STEPS = [
  { t: "Conte o que você procura", d: "Diga o tipo, a região e a faixa de preço. Selecionamos opções dentro do seu perfil." },
  { t: "Visite com acompanhamento", d: "Agendamos as visitas e acompanhamos você em cada uma." },
  { t: "Negocie com segurança", d: "Negociação em seu nome e assessoria jurídica até a escritura." },
];

export default async function Home() {
  const org = await getTenant();
  const [featured, summary, pins, agents, testimonials] = await Promise.all([
    getFeaturedProperties(org.id, 4),
    loadSiteSummary(org.id),
    getMapPins(org.id),
    getAgents(org.id),
    getTestimonials(org.id),
  ]);
  const wa = whatsappHref(org.phone, `Olá! Vim pelo site da ${org.name}.`);
  const n = summary.availableCount;

  return (
    <main>
      {/* BUSCA (form GET puro, zero JS) */}
      <section className="s-hero">
        <div className="wrap s-hero-in">
          <nav className="s-tabs" aria-label="O que você quer fazer">
            <span className="s-tab on" aria-current="true">Comprar</span>
            <Link className="s-tab" href="/vender">Vender</Link>
            <Link className="s-tab" href="/vender">Avaliar meu imóvel</Link>
          </nav>
          <h1>Encontre o imóvel certo, com quem conhece <em>cada bairro</em></h1>
          <p className="s-sub">Curadoria de imóveis de alto padrão, visitas acompanhadas e negociação em seu nome.</p>

          <form className="s-search" action="/imoveis" method="GET" role="search">
            <label className="s-field">Tipo
              <select name="type" defaultValue="">
                <option value="">Qualquer imóvel</option>
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="s-field">Região
              <select name="location" defaultValue="">
                <option value="">Todas as regiões</option>
                {summary.hoods.map((h) => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
            </label>
            <label className="s-field">Preço
              <select name="price" defaultValue="">
                <option value="">Qualquer preço</option>
                {PRICE_BANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <label className="s-field">Quartos
              <select name="beds" defaultValue="">
                <option value="">Qualquer</option>
                {[1, 2, 3, 4, 5].map((q) => <option key={q} value={q}>{q}+</option>)}
              </select>
            </label>
            <button className="s-submit" type="submit">Buscar imóveis</button>
          </form>

          <div className="s-chips">
            <Link className="s-chip" href="/imoveis?type=HOUSE">Casas</Link>
            <Link className="s-chip" href="/imoveis?type=APARTMENT">Apartamentos</Link>
            <Link className="s-chip" href="/imoveis?price=1000000-3000000">R$ 1 – 3 mi</Link>
            <Link className="s-chip" href="/imoveis?price=3000000-6000000">R$ 3 – 6 mi</Link>
            <Link className="s-chip" href="/imoveis?excl=1">Exclusivos</Link>
          </div>

          <div className="s-trust">
            {org.creci && <span><Check />{org.creci}</span>}
            {n > 0 && <span><House />{n} {plural(n, "imóvel disponível", "imóveis disponíveis")}</span>}
            <span><Plus />Visitas acompanhadas</span>
            {wa && <span><Chat />Atendimento por WhatsApp</span>}
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      {featured.length > 0 && (
        <section className="wrap s-sec">
          <div className="s-sec-head">
            <h2>Imóveis em <em>destaque</em></h2>
            <div className="s-links">
              <Link className="s-chip on" href="/imoveis">Todos</Link>
              <Link className="s-chip" href="/imoveis?type=HOUSE">Casas</Link>
              <Link className="s-chip" href="/imoveis?type=APARTMENT">Apartamentos</Link>
              <Link className="s-more" href="/imoveis">Ver todos →</Link>
            </div>
          </div>
          <div className="pc-grid">
            {featured.map((p: any) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* MAPA */}
      {pins.length > 0 && (
        <section className="wrap s-sec">
          <div className="s-map">
            <div className="s-map-copy">
              <h2>Veja os imóveis <em>no mapa</em></h2>
              <p>Explore por região. Toque num pin para ver o imóvel. A posição é aproximada: o endereço exato é informado na visita.</p>
              <Link className="s-cta" href="/imoveis?visao=mapa">Abrir o mapa</Link>
            </div>
            <div className="s-map-map">
              <PublicMap pins={pins} height={380}
                tileTemplate={process.env.NEXT_PUBLIC_MAP_TILE_URL || OSM}
                attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "© OpenStreetMap contributors"} />
            </div>
          </div>
        </section>
      )}

      {/* COMO FUNCIONA */}
      <section className="wrap s-sec">
        <div className="s-sec-head"><h2>Como <em>funciona</em></h2></div>
        <div className="s-steps">
          {STEPS.map((s, i) => (
            <div className="s-step" key={s.t}><div className="s-step-n" aria-hidden="true">{i + 1}</div><h3>{s.t}</h3><p>{s.d}</p></div>
          ))}
        </div>
      </section>

      {/* BAIRROS (só os que têm imóvel disponível agora) */}
      {summary.hoods.length > 0 && (
        <section className="wrap s-sec">
          <div className="s-sec-head"><h2>Bairros com imóveis <em>disponíveis</em></h2></div>
          <div className="s-hoods">
            {summary.hoods.map((h) => (
              <Link className="s-chip" key={h.name} href={`/imoveis?location=${encodeURIComponent(h.name)}`}>{h.name}<small>{h.count}</small></Link>
            ))}
          </div>
        </section>
      )}

      {/* EQUIPE */}
      {agents.length > 0 && (
        <section className="wrap s-sec">
          <div className="s-sec-head"><h2>Fale com quem <em>atende você</em></h2></div>
          <div className="s-team">
            {agents.map((a: any) => {
              const first = String(a.name ?? "").split(" ")[0];
              const link = whatsappHref(a.phone, `Olá, ${first}! Vim pelo site da ${org.name}.`);
              return (
                <article className="s-agent" key={a.id}>
                  {a.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img className="s-avatar" src={a.photoUrl} alt="" loading="lazy" />
                    : <span className="s-avatar" aria-hidden="true">{first.charAt(0)}</span>}
                  <div className="s-agent-txt"><h3>{a.name}</h3>{a.creci && <p>{a.creci}</p>}</div>
                  {link && <a className="s-wa-sm" href={link} target="_blank" rel="noopener noreferrer" aria-label={`Falar com ${a.name} no WhatsApp`}>WhatsApp</a>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* DEPOIMENTOS */}
      {testimonials.length > 0 && (
        <section className="wrap s-sec">
          <div className="s-sec-head"><h2>Quem já <em>chegou em casa</em></h2></div>
          <div className="s-quotes">
            {testimonials.map((t: any) => (
              <figure className="s-quote" key={t.id}>
                {t.rating > 0 && <div className="s-stars" role="img" aria-label={`${t.rating} de 5 estrelas`}>{Array.from({ length: Math.min(5, t.rating) }, (_, i) => <Star key={i} />)}</div>}
                <blockquote>“{t.text}”</blockquote>
                <figcaption><strong>{t.author}</strong>{t.context ? ` · ${t.context}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* VENDER */}
      <section className="wrap s-sec">
        <div className="s-panel">
          <div><h2>Pensando em <em>vender</em>?</h2><p>Avaliamos seu imóvel e apresentamos um plano de venda.</p></div>
          <Link className="s-cta" href="/vender">Solicitar avaliação</Link>
        </div>
      </section>
    </main>
  );
}
