import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { getPropertyBySlug, getSimilar } from "@/lib/data";
import { submitVisitInquiry } from "@/app/actions";
import { brl, STATUS_LABEL, TYPE_LABEL } from "@/lib/format";
import Gallery from "@/components/site/Gallery";
import PropertyCard from "@/components/site/PropertyCard";

type Props = { params: { slug: string }; searchParams: { enviado?: string; erro?: string } };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const org = await getTenant();
  const p = await getPropertyBySlug(org.id, params.slug);
  if (!p) return {};
  const title = p.seoTitle ?? `${p.title} · ${p.neighborhood}, ${p.city}`;
  const description = p.seoDescription ??
    `${p.bedrooms} quartos · ${p.areaM2} m² · ${brl(p.price)}. ${(p.description ?? "").slice(0, 120)}`;
  return {
    title, description,
    openGraph: { title, description, images: p.images?.slice(0, 1) },
    alternates: { canonical: `/imovel/${params.slug}` },
  };
}

export default async function PropertyPage({ params, searchParams }: Props) {
  const org = await getTenant();
  const p = await getPropertyBySlug(org.id, params.slug);
  if (!p) notFound();
  const similar = await getSimilar(org.id, p.type, p.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description,
    image: p.images,
    offers: { "@type": "Offer", price: p.price, priceCurrency: "BRL" },
    address: { "@type": "PostalAddress", addressLocality: p.city, addressRegion: p.state ?? "SP", addressCountry: "BR" },
    ...(p.latitude ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } } : {}),
  };

  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link className="back" href="/imoveis">← Voltar aos imóveis</Link>

      <div className="detail-grid">
        <div>
          <Gallery images={p.images} title={p.title} badge={STATUS_LABEL[p.status] ?? p.status} />

          {p.tourUrl && (
            <div style={{ marginTop: "1.5rem" }}>
              <p className="eyebrow">Tour virtual</p>
              <iframe src={p.tourUrl} title={`Tour virtual — ${p.title}`}
                style={{ width: "100%", aspectRatio: "16/9", border: "1px solid var(--line)", borderRadius: 4 }}
                allow="fullscreen; vr" />
            </div>
          )}

          {p.latitude && p.longitude && (
            <div style={{ marginTop: "1.5rem" }}>
              <p className="eyebrow">Localização</p>
              <iframe
                src={`https://www.google.com/maps?q=${p.latitude},${p.longitude}&z=15&output=embed`}
                title={`Mapa — ${p.neighborhood}`}
                style={{ width: "100%", height: 320, border: "1px solid var(--line)", borderRadius: 4 }}
                loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <p style={{ fontSize: ".8rem", color: "var(--stone)", marginTop: ".4rem" }}>
                Região aproximada — o endereço exato é informado na visita.
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow">{p.neighborhood} · {p.city}</p>
          <h1>{p.title}</h1>
          <p className="detail-price">{brl(p.price)}</p>
          <p className="card-specs big">
            {p.bedrooms} quartos · {p.bathrooms} banheiros · {p.areaM2} m² · {TYPE_LABEL[p.type] ?? p.type}
          </p>
          <p className="detail-desc">{p.description}</p>
          {p.features?.length > 0 && (
            <ul className="features">{p.features.map((f: string) => <li key={f}>{f}</li>)}</ul>
          )}

          <div className="inquiry">
            {(() => {
              const negotiated = ["SOLD", "RESERVED"].includes(p.status);
              return (
                <>
                  <h3>{negotiated ? "Este imóvel já foi negociado" : "Agendar visita"}</h3>
                  {negotiated && (
                    <p style={{ color: "var(--stone)", fontSize: ".9rem", marginBottom: "1rem" }}>
                      Deixe seu contato e enviaremos oportunidades parecidas — muitas vezes antes de irem ao site.
                    </p>
                  )}
                  {searchParams.enviado ? (
                    <p className="ok">Recebemos seu interesse! Um consultor entra em contato em até 2 horas úteis.</p>
                  ) : (
                    <form action={submitVisitInquiry} className="form">
                      <input type="hidden" name="propertyId" value={p.id} />
                      <input type="hidden" name="slug" value={p.slug} />
                      {negotiated && <input type="hidden" name="wantSimilar" value="1" />}
                      <input name="name" placeholder="Seu nome" required />
                      <input name="phone" placeholder="Telefone / WhatsApp" required />
                      <textarea name="message" placeholder="Mensagem (opcional)" rows={3} />
                      {searchParams.erro && <p style={{ color: "#d88" }}>Preencha nome e telefone.</p>}
                      <button className="btn-solid" type="submit">
                        {negotiated ? "Quero um imóvel como este" : "Enviar interesse"}
                      </button>
                    </form>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="section tight" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h2>Você também pode <em>gostar</em></h2>
          <div className="grid-3" style={{ marginTop: "2rem" }}>
            {similar.map((s: any) => <PropertyCard key={s.id} p={s} />)}
          </div>
        </section>
      )}
    </main>
  );
}
