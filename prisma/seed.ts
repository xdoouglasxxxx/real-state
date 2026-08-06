/* Seed inicial: cria a organização demo com imóveis, corretor e domínio.
   Rodar: npm run db:seed (com DATABASE_URL configurada) */
import { PrismaClient } from "@prisma/client";
import { DEMO_PROPERTIES } from "../src/lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "maison" },
    update: {},
    create: {
      name: "Maison Estate",
      slug: "maison",
      creci: "CRECI-SP 45.120-J",
      phone: "(11) 3040-8800",
      city: "São Paulo",
    },
  });

  const agent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: "Helena Duarte",
      creci: "CRECI 98.541",
      phone: "(11) 99812-4455",
      isFeatured: true,
    },
  });

  for (const p of DEMO_PROPERTIES) {
    await prisma.property.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: p.slug } },
      update: {},
      create: {
        organizationId: org.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        type: p.type as any,
        status: p.status as any,
        price: p.price,
        neighborhood: p.neighborhood,
        city: p.city,
        state: p.state,
        latitude: p.latitude,
        longitude: p.longitude,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaM2: p.areaM2,
        parkingSpaces: p.parkingSpaces,
        features: p.features,
        isFeatured: p.isFeatured,
        publishedAt: new Date(),
        agentId: agent.id,
        media: {
          create: p.images.map((url, i) => ({ kind: "PHOTO", url, sortOrder: i })),
        },
      },
    });
  }

  console.log("Seed concluído ✔ — organização:", org.slug);
}

main().finally(() => prisma.$disconnect());
