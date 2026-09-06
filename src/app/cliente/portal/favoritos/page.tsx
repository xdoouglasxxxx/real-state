import { prisma } from "@/lib/prisma";
import { requireClientPortal } from "@/lib/perm";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");

export default async function FavoritosPage() {
  const ctx = await requireClientPortal();

  let favorites: any[] = [];
  try {
    if (ctx.contactIds.length > 0) {
      favorites = await prisma.favorite.findMany({
        where: { contactId: { in: ctx.contactIds }, property: { organizationId: ctx.org.id } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, createdAt: true,
          property: { select: { title: true, slug: true, neighborhood: true, city: true, price: true, status: true } },
        },
      });
    }
  } catch (e) { console.error("portal/favoritos:", e); }

  return (
    <>
      <h1>Meus favoritos</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.6rem" }}>
        {favorites.length === 1 ? "1 imóvel salvo" : `${favorites.length} imóveis salvos`}
      </p>

      {favorites.length === 0 ? (
        <section className="ficha-box">
          <h2>Nenhum favorito ainda</h2>
          <p style={{ color: "var(--stone)", marginBottom: ".9rem" }}>
            Explore os imóveis disponíveis e salve os que mais gostar — eles aparecem aqui.
          </p>
          <a href="/imoveis" className="btn-outline">Ver imóveis</a>
        </section>
      ) : (
        favorites.map((f) => (
          <section className="ficha-box" key={f.id} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "baseline" }}>
              <h2>♥ {f.property.title}</h2>
              <span style={{ color: "var(--brass)", fontWeight: 500 }}>{brl(f.property.price)}</span>
            </div>
            <p style={{ color: "var(--stone)", fontSize: ".88rem", margin: ".3rem 0 .8rem" }}>
              {f.property.neighborhood}{f.property.city ? ` · ${f.property.city}` : ""} · salvo em {fmtD(f.createdAt)}
            </p>
            <a href={`/imovel/${f.property.slug}`} className="btn-outline">Ver imóvel</a>
          </section>
        ))
      )}
    </>
  );
}
