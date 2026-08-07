/**
 * Camada de dados. Postgres (Supabase) via Prisma; sem banco -> demo.
 * TODA query filtra por organizationId.
 */
import { prisma } from "./prisma";
import { DEMO_PROPERTIES } from "./demo-data";

const hasDb = () => Boolean(process.env.DATABASE_URL);

const mapProperty = (p: any) => ({
  ...p,
  price: Number(p.price),
  images: p.media?.length ? p.media.filter((m: any) => m.kind === "PHOTO").map((m: any) => m.url) : p.images ?? [],
  tourUrl: p.media?.find((m: any) => m.kind === "VIRTUAL_TOUR")?.url ?? null,
});

export async function getFeaturedProperties(orgId: string) {
  if (hasDb()) {
    try {
      const rows = await prisma.property.findMany({
        where: { organizationId: orgId, isFeatured: true, status: { in: ["FOR_SALE", "EXCLUSIVE"] } },
        orderBy: { createdAt: "desc" }, take: 3,
        include: { media: { orderBy: { sortOrder: "asc" } } },
      });
      return rows.map(mapProperty); // vazio É a resposta certa p/ tenant novo
    } catch {}
  }
  return DEMO_PROPERTIES.filter((p) => p.isFeatured).slice(0, 3);
}

export type SearchFilters = { type?: string; location?: string; min?: number; max?: number };

export async function searchProperties(orgId: string, f: SearchFilters) {
  if (hasDb()) try {
    const rows = await prisma.property.findMany({
      where: {
        organizationId: orgId,
        status: { in: ["FOR_SALE", "EXCLUSIVE"] },
        ...(f.type ? { type: f.type as any } : {}),
        ...(f.location ? { neighborhood: f.location } : {}),
        price: { gte: f.min ?? 0, ...(f.max ? { lte: f.max } : {}) },
      },
      orderBy: { createdAt: "desc" },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    return rows.map(mapProperty);
  } catch {}
  return DEMO_PROPERTIES.filter((p) =>
    (!f.type || p.type === f.type) &&
    (!f.location || p.neighborhood === f.location) &&
    p.price >= (f.min ?? 0) && (!f.max || p.price <= f.max)
  );
}

export async function getNeighborhoods(orgId: string) {
  if (hasDb()) try {
    const rows = await prisma.property.findMany({
      where: { organizationId: orgId, status: { notIn: ["DRAFT", "ARCHIVED"] } },
      select: { neighborhood: true }, distinct: ["neighborhood"],
    });
    return rows.map((r) => r.neighborhood).filter(Boolean) as string[];
  } catch {}
  return [...new Set(DEMO_PROPERTIES.map((p) => p.neighborhood))];
}

export async function getPropertyBySlug(orgId: string, slug: string) {
  if (hasDb()) try {
    const p = await prisma.property.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug } },
      include: { media: { orderBy: { sortOrder: "asc" } }, agent: true },
    });
    if (p) return mapProperty(p);
  } catch {}
  return DEMO_PROPERTIES.find((p) => p.slug === slug) ?? null;
}

export async function getSimilar(orgId: string, type: string, excludeId: string) {
  if (hasDb()) try {
    const rows = await prisma.property.findMany({
      where: { organizationId: orgId, type: type as any, id: { not: excludeId }, status: { in: ["FOR_SALE", "EXCLUSIVE"] } },
      take: 2, include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    return rows.map(mapProperty);
  } catch {}
  return DEMO_PROPERTIES.filter((p) => p.type === type && p.id !== excludeId).slice(0, 2);
}

export async function getAllPropertySlugs(orgId: string) {
  if (hasDb()) try {
    const rows = await prisma.property.findMany({
      where: { organizationId: orgId, status: { notIn: ["DRAFT", "ARCHIVED"] } },
      select: { slug: true, updatedAt: true },
    });
    if (rows.length) return rows;
  } catch {}
  return DEMO_PROPERTIES.map((p) => ({ slug: p.slug, updatedAt: new Date() }));
}

export async function getAgents(orgId: string) {
  if (hasDb()) {
    try {
      return await prisma.agent.findMany({
        where: { organizationId: orgId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
    } catch {}
  }
  return [
    { id: "a1", name: "Helena Duarte", creci: "CRECI 98.541", phone: "(11) 99812-4455", photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", bio: "Fundadora. 14 anos no alto padrão." },
    { id: "a2", name: "Rafael Moreno", creci: "CRECI 112.030", phone: "(11) 99633-2210", photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", bio: "Especialista em coberturas." },
    { id: "a3", name: "Beatriz Lins", creci: "CRECI 105.877", phone: "(11) 98770-9034", photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80", bio: "Compra assessorada Jardins/Itaim." },
  ];
}

export async function getTestimonials(orgId: string) {
  if (hasDb()) {
    try {
      return await prisma.testimonial.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" }, take: 3 });
    } catch {}
  }
  return [
    { id: "t1", text: "Vendemos nossa casa em 28 dias, acima do valor que esperávamos.", author: "Família Sampaio", context: "Venderam em Alphaville" },
    { id: "t2", text: "A segunda visita já era o imóvel certo. Eles ouvem de verdade.", author: "Carla & Diego M.", context: "Compraram no Itaim" },
    { id: "t3", text: "Acompanhamento jurídico impecável do início ao fim.", author: "Dr. Otávio Ferreira", context: "Comprou nos Jardins" },
  ];
}

export async function getBlogPosts(orgId: string) {
  if (hasDb()) {
    try {
      return await prisma.blogPost.findMany({ where: { organizationId: orgId, published: true }, orderBy: { createdAt: "desc" } });
    } catch {}
  }
  return [{ id: "b1", slug: "vale-a-pena-comprar-na-planta", title: "Vale a pena comprar na planta em 2026?", excerpt: "Os cenários em que ainda faz sentido — e os que não.", content: "Comprar na planta já foi sinônimo de valorização garantida. Hoje, a conta é mais fina.\n\nFaz sentido quando o incorporador tem histórico sólido na região e a tabela está de fato abaixo do metro quadrado dos prontos.\n\nNão faz sentido quando a diferença para o pronto é pequena — o risco de obra não é remunerado.", coverImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80", author: "Helena Duarte", createdAt: new Date() }];
}

export async function getPostBySlug(orgId: string, slug: string) {
  const posts = await getBlogPosts(orgId);
  return posts.find((p: any) => p.slug === slug) ?? null;
}

/* ---------- PAINEL / BI ---------- */

export async function getDashboard(orgId: string) {
  if (hasDb()) try {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [availableAgg, newLeads, visits, awaitingContracts, proposals, soldMonth, byStage, goal, closedAgg] =
      await Promise.all([
        prisma.property.aggregate({ where: { organizationId: orgId, status: { in: ["FOR_SALE", "EXCLUSIVE"] } }, _sum: { price: true }, _count: true }),
        prisma.lead.count({ where: { organizationId: orgId, createdAt: { gte: monthStart } } }),
        prisma.visit.count({ where: { organizationId: orgId, status: "SCHEDULED" } }),
        prisma.contract.count({ where: { organizationId: orgId, status: "AWAITING_SIGNATURE" } }),
        prisma.proposal.count({ where: { organizationId: orgId, status: "SENT" } }),
        prisma.contract.count({ where: { organizationId: orgId, status: "CLOSED", closedAt: { gte: monthStart } } }),
        prisma.lead.groupBy({ by: ["stage"], where: { organizationId: orgId }, _count: true }),
        prisma.goal.findFirst({ where: { organizationId: orgId, agentId: null, year: new Date().getFullYear(), month: new Date().getMonth() + 1 } }),
        prisma.contract.aggregate({ where: { organizationId: orgId, status: "CLOSED", closedAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
      ]);
    const totalLeads = byStage.reduce((s, r) => s + r._count, 0);
    const won = byStage.find((r) => r.stage === "WON")?._count ?? 0;
    const realizado = Number(closedAgg._sum.totalAmount ?? 0);
    const meta = Number(goal?.targetAmount ?? 0);
    return {
      availableValue: Number(availableAgg._sum.price ?? 0),
      availableCount: availableAgg._count,
      newLeads, visits, awaitingContracts, proposals, soldMonth,
      conversion: totalLeads ? Math.round((100 * won) / totalLeads) : 0,
      goalPct: meta ? Math.min(100, Math.round((100 * realizado) / meta)) : 0,
      meta, realizado,
    };
  } catch {}
  return { availableValue: 26500000, availableCount: 5, newLeads: 23, visits: 12, awaitingContracts: 4, proposals: 3, soldMonth: 8, conversion: 18, goalPct: 76, meta: 15000000, realizado: 11400000 };
}

export async function getLeadsBoard(orgId: string) {
  if (hasDb()) try {
    const rows = await prisma.lead.findMany({
      where: { organizationId: orgId, stage: { notIn: ["LOST"] } },
      include: { contact: true, property: true, agent: true },
      orderBy: { updatedAt: "desc" }, take: 200,
    });
    return rows.map((l) => ({
      id: l.id, stage: l.stage, source: l.source,
      name: l.contact?.name ?? "—",
      property: l.property?.title ?? l.interest ?? "—",
      agent: l.agent?.name ?? "Sem corretor",
    }));
  } catch {}
  return [
    { id: "1", stage: "FINANCING", source: "INSTAGRAM", name: "Douglas Ferreira", property: "Loft Jardins", agent: "Beatriz Lins" },
    { id: "2", stage: "VISIT", source: "SITE", name: "Carla Mendes", property: "Penthouse Horizonte", agent: "Rafael Moreno" },
    { id: "3", stage: "NEW", source: "WHATSAPP", name: "Otávio Nunes", property: "Casa em Alphaville", agent: "Helena Duarte" },
  ];
}

export async function getPanelProperties(orgId: string) {
  if (hasDb()) try {
    const rows = await prisma.property.findMany({
      where: { organizationId: orgId },
      include: { agent: true, _count: { select: { visits: true, proposals: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((p) => ({
      id: p.id, title: p.title, neighborhood: p.neighborhood, status: p.status,
      price: Number(p.price), agent: p.agent?.name ?? "—",
      visits: p._count.visits, proposals: p._count.proposals,
      daysOnMarket: p.publishedAt ? Math.floor((Date.now() - +new Date(p.publishedAt)) / 86400000) : 0,
    }));
  } catch {}
  return DEMO_PROPERTIES.map((p) => ({
    id: p.id, title: p.title, neighborhood: p.neighborhood, status: p.status,
    price: p.price, agent: "—", visits: 0, proposals: 0, daysOnMarket: 30,
  }));
}

export async function getPanelProperty(orgId: string, id: string) {
  if (!hasDb()) return null;
  try {
    const p = await prisma.property.findFirst({
      where: { id, organizationId: orgId },
      include: { media: { orderBy: { sortOrder: "asc" } } },
    });
    if (!p) return null;
    return {
      ...p,
      price: Number(p.price),
      condoFee: p.condoFee ? Number(p.condoFee) : null,
      iptuYearly: p.iptuYearly ? Number(p.iptuYearly) : null,
      images: p.media.filter((m) => m.kind === "PHOTO").map((m) => m.url),
      tourUrl: p.media.find((m) => m.kind === "VIRTUAL_TOUR")?.url ?? "",
    };
  } catch { return null; }
}

export async function getSubscriptionInfo(orgId: string) {
  const fallback = {
    plan: "STARTER", status: "TRIALING", trialDaysLeft: 14,
    propertyCount: 0, userCount: 1, createdAt: new Date(),
  };
  if (!hasDb()) return fallback;
  try {
    const [sub, propertyCount, userCount] = await Promise.all([
      prisma.subscription.findUnique({ where: { organizationId: orgId } }),
      prisma.property.count({ where: { organizationId: orgId, status: { not: "ARCHIVED" } } }),
      prisma.user.count({ where: { organizationId: orgId } }),
    ]);
    const createdAt = sub?.createdAt ?? new Date();
    const trialDaysLeft = Math.max(0, 14 - Math.floor((Date.now() - +createdAt) / 86400000));
    return {
      plan: sub?.plan ?? "STARTER",
      status: sub?.status ?? "TRIALING",
      trialDaysLeft,
      propertyCount,
      userCount,
      createdAt,
    };
  } catch { return fallback; }
}

export async function getLeadsBoardFull(orgId: string) {
  if (!hasDb()) {
    return [
      { id: "1", stage: "FINANCING", source: "INSTAGRAM", name: "Douglas Ferreira", phone: "41999003524", property: "Loft Jardins", agent: "Beatriz Lins", createdAt: new Date() },
      { id: "2", stage: "VISIT", source: "SITE", name: "Carla Mendes", phone: "11988887777", property: "Penthouse Horizonte", agent: "Rafael Moreno", createdAt: new Date() },
      { id: "3", stage: "NEW", source: "WHATSAPP", name: "Otávio Nunes", phone: "11977776666", property: "Casa em Alphaville", agent: "Sem corretor", createdAt: new Date() },
    ];
  }
  try {
    const rows = await prisma.lead.findMany({
      where: { organizationId: orgId, stage: { notIn: ["LOST"] } },
      include: { contact: true, property: true, agent: true },
      orderBy: { updatedAt: "desc" }, take: 300,
    });
    return rows.map((l) => ({
      id: l.id, stage: l.stage, source: l.source,
      name: l.contact?.name ?? "—",
      phone: l.contact?.phone ?? "",
      property: l.property?.title ?? l.interest ?? "—",
      agent: l.agent?.name ?? "Sem corretor",
      createdAt: l.createdAt,
    }));
  } catch { return []; }
}

export async function getLeadDetail(orgId: string, id: string) {
  if (!hasDb()) return null;
  try {
    const l = await prisma.lead.findFirst({
      where: { id, organizationId: orgId },
      include: {
        contact: true, property: true, agent: true,
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    return l;
  } catch { return null; }
}

export async function getVisits(orgId: string) {
  if (!hasDb()) return [];
  try {
    const since = new Date(Date.now() - 86400000); // ontem em diante
    return await prisma.visit.findMany({
      where: { organizationId: orgId, scheduledAt: { gte: since } },
      include: { property: { select: { title: true } }, contact: { select: { name: true, phone: true } }, agent: { select: { name: true } }, lead: { select: { id: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 100,
    });
  } catch { return []; }
}
