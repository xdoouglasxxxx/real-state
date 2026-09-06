/** Feed XML de imóveis para portais (ZAP/VivaReal/OLX via VRSync + genérico).
 *  Rota PÚBLICA autenticada por token secreto na URL (Organization.feedToken):
 *  /api/feed/vrsync?token=...  ·  /api/feed/generic?token=...
 *  O portal consome a URL periodicamente; nada de sessão/cookie aqui. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PORTALS = ["vrsync", "generic"] as const;

/** Mapeamento PropertyType → tipologia VRSync (padrão Grupo OLX/ZAP). */
const VRSYNC_TYPE: Record<string, string> = {
  HOUSE: "Residential / Home",
  APARTMENT: "Residential / Apartment",
  LAND: "Residential / Land Lot",
  COMMERCIAL: "Commercial / Building",
  FARM: "Residential / Farm Ranch",
};

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Base pública do tenant p/ links do anúncio: domínio próprio > subdomínio > raiz. */
function siteBase(org: { slug: string }, primaryHost?: string | null) {
  if (primaryHost) return `https://${primaryHost}`;
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (root && !root.includes("localhost")) return `https://${org.slug}.${root}`;
  return "https://maisonstate.vercel.app";
}

export async function GET(req: Request, { params }: { params: { portal: string } }) {
  const portal = params.portal as (typeof PORTALS)[number];
  if (!PORTALS.includes(portal)) return new NextResponse("portal desconhecido", { status: 404 });

  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 16) return new NextResponse("não autorizado", { status: 401 });

  try {
    const org = await prisma.organization.findUnique({
      where: { feedToken: token },
      select: {
        id: true, name: true, slug: true, email: true, phone: true,
        domains: { where: { isPrimary: true }, take: 1, select: { host: true } },
      },
    });
    if (!org) return new NextResponse("não autorizado", { status: 401 });

    const base = siteBase(org, org.domains[0]?.host);
    const properties = await prisma.property.findMany({
      where: { organizationId: org.id, status: { in: ["FOR_SALE", "EXCLUSIVE"] } },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 500,
      select: {
        id: true, slug: true, title: true, description: true, type: true,
        price: true, condoFee: true, iptuYearly: true,
        neighborhood: true, city: true, state: true, zipcode: true,
        latitude: true, longitude: true,
        bedrooms: true, bathrooms: true, suites: true, parkingSpaces: true,
        areaM2: true, features: true, isFeatured: true,
        publishedAt: true, updatedAt: true,
        media: {
          where: { kind: "PHOTO" },
          orderBy: { sortOrder: "asc" }, take: 30,
          select: { url: true, caption: true },
        },
      },
    });

    const xml = portal === "vrsync"
      ? buildVrsync(org, base, properties)
      : buildGeneric(org, base, properties);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // portais releem a cada poucas horas; 1h de cache na borda é suficiente
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("feed:", e);
    return new NextResponse("erro interno", { status: 500 });
  }
}

type FeedOrg = { name: string; slug: string; email: string | null; phone: string | null };

function buildVrsync(org: FeedOrg, base: string, properties: any[]) {
  const now = new Date().toISOString();
  const listings = properties.map((p) => {
    const media = p.media
      .map((m: any, i: number) =>
        `        <Item medium="image"${i === 0 ? ' primary="true"' : ""} caption="${esc(m.caption ?? "")}">${esc(m.url)}</Item>`)
      .join("\n");
    const features = (p.features ?? [])
      .map((f: string) => `          <Feature>${esc(f)}</Feature>`).join("\n");
    return `    <Listing>
      <ListingID>${esc(p.id)}</ListingID>
      <Title>${esc(p.title)}</Title>
      <TransactionType>For Sale</TransactionType>
      <Featured>${p.isFeatured ? "true" : "false"}</Featured>
      ${p.publishedAt ? `<ListDate>${new Date(p.publishedAt).toISOString()}</ListDate>` : ""}
      <LastUpdateDate>${new Date(p.updatedAt).toISOString()}</LastUpdateDate>
      <DetailViewUrl>${esc(`${base}/imovel/${p.slug}`)}</DetailViewUrl>
      <Media>
${media}
      </Media>
      <Details>
        <UsageType>${p.type === "COMMERCIAL" ? "Commercial" : "Residential"}</UsageType>
        <PropertyType>${VRSYNC_TYPE[p.type] ?? "Residential / Home"}</PropertyType>
        <Description><![CDATA[${String(p.description ?? p.title).slice(0, 3000)}]]></Description>
        <ListPrice currency="BRL">${Number(p.price).toFixed(0)}</ListPrice>
        ${p.condoFee ? `<PropertyAdministrationFee currency="BRL">${Number(p.condoFee).toFixed(0)}</PropertyAdministrationFee>` : ""}
        ${p.iptuYearly ? `<YearlyTax currency="BRL">${Number(p.iptuYearly).toFixed(0)}</YearlyTax>` : ""}
        ${p.areaM2 ? `<LivingArea unit="square metres">${p.areaM2}</LivingArea>` : ""}
        ${p.bedrooms != null ? `<Bedrooms>${p.bedrooms}</Bedrooms>` : ""}
        ${p.bathrooms != null ? `<Bathrooms>${p.bathrooms}</Bathrooms>` : ""}
        ${p.suites != null ? `<Suites>${p.suites}</Suites>` : ""}
        ${p.parkingSpaces != null ? `<Garage type="Parking Space">${p.parkingSpaces}</Garage>` : ""}
        <Features>
${features}
        </Features>
      </Details>
      <Location displayAddress="Neighborhood">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${esc(p.state ?? "SP")}">${esc(p.state ?? "SP")}</State>
        <City>${esc(p.city ?? "")}</City>
        <Neighborhood>${esc(p.neighborhood ?? "")}</Neighborhood>
        ${p.zipcode ? `<PostalCode>${esc(p.zipcode)}</PostalCode>` : ""}
        ${p.latitude != null ? `<Latitude>${p.latitude}</Latitude>` : ""}
        ${p.longitude != null ? `<Longitude>${p.longitude}</Longitude>` : ""}
      </Location>
      <ContactInfo>
        <Name>${esc(org.name)}</Name>
        ${org.email ? `<Email>${esc(org.email)}</Email>` : ""}
        <Website>${esc(base)}</Website>
        ${org.phone ? `<Telephone>${esc(org.phone)}</Telephone>` : ""}
      </ContactInfo>
    </Listing>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>${esc(org.name)}</Provider>
    ${org.email ? `<Email>${esc(org.email)}</Email>` : ""}
    <ContactName>${esc(org.name)}</ContactName>
    <PublishDate>${now}</PublishDate>
  </Header>
  <Listings>
${listings}
  </Listings>
</ListingDataFeed>
`;
}

function buildGeneric(org: FeedOrg, base: string, properties: any[]) {
  const items = properties.map((p) => `  <property>
    <id>${esc(p.id)}</id>
    <url>${esc(`${base}/imovel/${p.slug}`)}</url>
    <title>${esc(p.title)}</title>
    <type>${esc(p.type)}</type>
    <price>${Number(p.price).toFixed(2)}</price>
    <neighborhood>${esc(p.neighborhood ?? "")}</neighborhood>
    <city>${esc(p.city ?? "")}</city>
    <state>${esc(p.state ?? "")}</state>
    <bedrooms>${p.bedrooms ?? ""}</bedrooms>
    <bathrooms>${p.bathrooms ?? ""}</bathrooms>
    <parking>${p.parkingSpaces ?? ""}</parking>
    <area_m2>${p.areaM2 ?? ""}</area_m2>
    <description><![CDATA[${String(p.description ?? "").slice(0, 3000)}]]></description>
    <photos>
${p.media.map((m: any) => `      <photo>${esc(m.url)}</photo>`).join("\n")}
    </photos>
  </property>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<properties agency="${esc(org.name)}" site="${esc(base)}" generated="${new Date().toISOString()}">
${items}
</properties>
`;
}
