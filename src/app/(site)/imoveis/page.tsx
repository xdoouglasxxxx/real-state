import type { Metadata } from "next";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { searchProperties, getMapPins } from "@/lib/data";
import { loadSiteSummary } from "@/lib/site-summary";
import { PRICE_BANDS, parseSearchParams } from "@/lib/search";
import { TYPE_LABEL } from "@/lib/format";
import { plural } from "@/lib/site";
import PropertyCard from "@/components/site/PropertyCard";
import PublicMap from "@/components/site/PublicMap";

export const metadata: Metadata = { title: "Imóveis à venda" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Mantém os filtros da URL e troca só a visão (lista/mapa). URLSearchParams codifica tudo. */
function viewHref(sp: SP, view: "lista" | "mapa") {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) { const x = first(v); if (x && k !== "visao") q.set(k, x); }
  if (view === "mapa") q.set("visao", "mapa");
  const s = q.toString();
  return s ? `/imoveis?${s}` : "/imoveis";
}

export default async function Imoveis({ searchParams }: { searchParams: SP }) {
  const org = await getTenant();
  const f = parseSearchParams(searchParams);
  const view = first(searchParams.visao) === "mapa" ? "mapa" : "lista";
  const [results, summary, pins] = await Promise.all([
    searchProperties(org.id, f),
    loadSiteSummary(org.id),
    view === "mapa" ? getMapPins(org.id, f) : Promise.resolve([]),
  ]);
  const filtered = Boolean(f.type || f.location || f.min !== undefined || f.max !== undefined || f.q || f.beds || f.exclusive);

  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Portfólio completo</p>
        <h1>Encontre o <em>seu</em> imóvel</h1>
      </div>

      <form method="GET" className="s-search" role="search" style={{ marginBottom: "1rem" }}>
        {view === "mapa" && <input type="hidden" name="visao" value="mapa" />}
        <label className="s-field wide">Buscar
          <input name="q" defaultValue={f.q ?? ""} maxLength={60} placeholder="Bairro ou nome do imóvel" />
        </label>
        <label className="s-field">Tipo
          <select name="type" defaultValue={f.type ?? ""}>
            <option value="">Todos</option>
            {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="s-field">Região
          <select name="location" defaultValue={f.location ?? ""}>
            <option value="">Todas</option>
            {summary.hoods.map((h) => <option key={h.name} value={h.name}>{h.name}</option>)}
            {f.location && !summary.hoods.some((h) => h.name === f.location) && <option value={f.location}>{f.location}</option>}
          </select>
        </label>
        <label className="s-field">Preço
          <select name="price" defaultValue={first(searchParams.price) ?? ""}>
            <option value="">Qualquer</option>
            {PRICE_BANDS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </label>
        <label className="s-field">Quartos
          <select name="beds" defaultValue={f.beds ? String(f.beds) : ""}>
            <option value="">Qualquer</option>
            {[1, 2, 3, 4, 5].map((q) => <option key={q} value={q}>{q}+</option>)}
          </select>
        </label>
        <label className="s-field" style={{ flex: "0 0 auto", flexDirection: "row", alignItems: "center", height: 50, gap: ".5rem", fontWeight: 500 }}>
          <input type="checkbox" name="excl" value="1" defaultChecked={Boolean(f.exclusive)} style={{ width: 18, height: 18 }} /> Só exclusivos
        </label>
        <button className="s-submit" type="submit">Filtrar</button>
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem" }}>
        <div className="view-toggle" role="group" aria-label="Forma de exibição" style={{ marginBottom: 0 }}>
          <Link className={"s-chip" + (view === "lista" ? " on" : "")} href={viewHref(searchParams, "lista")} aria-current={view === "lista" ? "true" : undefined}>Lista</Link>
          <Link className={"s-chip" + (view === "mapa" ? " on" : "")} href={viewHref(searchParams, "mapa")} aria-current={view === "mapa" ? "true" : undefined}>Mapa</Link>
        </div>
        {filtered && <Link className="s-more" href={view === "mapa" ? "/imoveis?visao=mapa" : "/imoveis"}>Limpar filtros</Link>}
        <span className="filter-count" role="status">{results.length} {plural(results.length, "imóvel", "imóveis")}</span>
      </div>

      {view === "mapa" && (
        pins.length > 0
          ? <div style={{ marginBottom: "1.75rem" }}>
              <PublicMap pins={pins} height={520}
                tileTemplate={process.env.NEXT_PUBLIC_MAP_TILE_URL || OSM}
                attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "© OpenStreetMap contributors"} />
              <p style={{ fontSize: ".8rem", color: "var(--stone)", marginTop: ".5rem" }}>A posição é aproximada: o endereço exato é informado na visita.</p>
            </div>
          : <p style={{ color: "var(--stone)", marginBottom: "1.5rem" }}>Nenhum destes imóveis tem localização no mapa. Veja a lista abaixo.</p>
      )}

      {results.length === 0 ? (
        <div className="empty">
          <h3>Nenhum imóvel com esses filtros.</h3>
          <p>Ajuste o tipo, a região, o preço ou a busca para ver mais opções.</p>
          <Link className="btn-outline" href="/imoveis">Limpar filtros</Link>
        </div>
      ) : (
        <div className="pc-grid">
          {results.map((p: any) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}
