import type { Metadata } from "next";
import { requirePanel } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import PropertyMap, { type MapItem, type MapGroup } from "@/components/painel/PropertyMap";

export const metadata: Metadata = { title: "Mapa dos imóveis" };
export const dynamic = "force-dynamic";

const DAY = 86400000;
const OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const GROUP: Record<string, MapGroup> = {
  FOR_SALE: "disp", EXCLUSIVE: "disp", RESERVED: "res", SOLD: "vend", RENTED: "vend",
};
const LABEL: Record<string, string> = {
  FOR_SALE: "À venda", EXCLUSIVE: "Exclusivo", RESERVED: "Reservado", SOLD: "Vendido", RENTED: "Alugado",
};

export default async function Mapa() {
  const { org } = await requirePanel();

  let items: MapItem[] = [];
  if (process.env.DATABASE_URL) {
    try {
      const now = Date.now();
      const rows = await prisma.property.findMany({
        where: { organizationId: org.id, status: { notIn: ["DRAFT", "ARCHIVED"] } },
        select: {
          id: true, title: true, neighborhood: true, city: true, status: true, price: true,
          bedrooms: true, areaM2: true, latitude: true, longitude: true, createdAt: true,
          visits: { orderBy: { scheduledAt: "desc" }, take: 1, select: { scheduledAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      items = rows.map((p) => {
        const group = GROUP[p.status] ?? "vend";
        // Mesma regra do alerta do dashboard: disponível, cadastrado há 90+ dias e sem visita nos últimos 90.
        const ref = p.visits[0]?.scheduledAt ?? p.createdAt;
        const noVisitDays = Math.max(0, Math.floor((now - +new Date(ref)) / DAY));
        const stale = group === "disp" && now - +new Date(p.createdAt) > 90 * DAY && noVisitDays >= 90;
        return {
          id: p.id,
          title: p.title,
          hood: [p.neighborhood, p.city].filter(Boolean).join(" · ") || "—",
          price: Number(p.price),
          group,
          statusLabel: LABEL[p.status] ?? p.status,
          beds: p.bedrooms,
          area: p.areaM2,
          lat: p.latitude,
          lng: p.longitude,
          noVisitDays,
          stale,
        };
      });
    } catch (e) {
      console.error("painel/mapa:", e);
    }
  }

  return (
    <>
      <div className="phead">
        <h1>Mapa dos imóveis</h1>
      </div>
      <PropertyMap
        items={items}
        tileTemplate={process.env.NEXT_PUBLIC_MAP_TILE_URL || OSM}
        attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "© OpenStreetMap contributors"}
      />
    </>
  );
}
