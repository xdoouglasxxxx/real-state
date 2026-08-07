"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerUp } from "@/lib/perm";
import { getPlan } from "@/lib/plans";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
   .slice(0, 60) || "imovel";

const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && String(v).trim() !== "" ? n : null;
};

/** Cria ou atualiza um imóvel (com fotos e tour) e revalida site + painel. */
export async function saveProperty(formData: FormData) {
  const { org } = await requireManagerUp(); // corretor não edita o estoque
  if (!process.env.DATABASE_URL || org.id === "demo") redirect("/painel/imoveis?demo=1");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const price = num(formData.get("price"));
  const type = String(formData.get("type") ?? "HOUSE");
  if (!title || price === null) redirect(id ? `/painel/imoveis/${id}?erro=1` : "/painel/imoveis/novo?erro=1");

  const photos = formData.getAll("photos").map(String).filter(Boolean);
  const tourUrl = String(formData.get("tourUrl") ?? "").trim();

  const data: any = {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    type: type as any,
    status: String(formData.get("status") ?? "FOR_SALE") as any,
    price,
    condoFee: num(formData.get("condoFee")),
    iptuYearly: num(formData.get("iptuYearly")),
    neighborhood: String(formData.get("neighborhood") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    state: String(formData.get("state") ?? "SP").trim() || "SP",
    zipcode: String(formData.get("zipcode") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    latitude: num(formData.get("latitude")),
    longitude: num(formData.get("longitude")),
    bedrooms: num(formData.get("bedrooms")),
    bathrooms: num(formData.get("bathrooms")),
    suites: num(formData.get("suites")),
    parkingSpaces: num(formData.get("parkingSpaces")),
    areaM2: num(formData.get("areaM2")),
    features: String(formData.get("features") ?? "").split(",").map(s => s.trim()).filter(Boolean),
    isFeatured: formData.get("isFeatured") === "on",
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
    seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
    agentId: null as string | null, // validado abaixo contra o tenant
  };

  const rawAgent = String(formData.get("agentId") ?? "");
  if (rawAgent) {
    try {
      const agentOk = await prisma.agent.findFirst({
        where: { id: rawAgent, organizationId: org.id }, select: { id: true },
      });
      data.agentId = agentOk?.id ?? null;
    } catch {}
  }

  // Enforcement do plano: limite de imóveis ativos ao CRIAR (fora do try:
  // redirect() lança exceção de controle e não pode ser capturado pelo catch)
  if (!id) {
    let atLimit = false;
    try {
      const [sub, count] = await Promise.all([
        prisma.subscription.findUnique({ where: { organizationId: org.id } }),
        prisma.property.count({ where: { organizationId: org.id, status: { not: "ARCHIVED" } } }),
      ]);
      atLimit = count >= getPlan(sub?.plan).maxProperties;
    } catch { /* sem banco: segue */ }
    if (atLimit) redirect("/painel/assinatura?limite=imoveis");
  }

  let propertyId = id;

  try {
    if (id) {
      await prisma.property.update({ where: { id }, data });
      // Regrava fotos e tour (simples e previsível)
      await prisma.propertyMedia.deleteMany({ where: { propertyId: id, kind: { in: ["PHOTO", "VIRTUAL_TOUR"] } } });
    } else {
      // slug único por tenant
      const base = slugify(title);
      let slug = base;
      for (let i = 2; await prisma.property.findUnique({ where: { organizationId_slug: { organizationId: org.id, slug } } }); i++) {
        slug = `${base}-${i}`;
      }
      const created = await prisma.property.create({
        data: { ...data, organizationId: org.id, slug, publishedAt: data.status === "DRAFT" ? null : new Date() },
      });
      propertyId = created.id;
      await prisma.propertyEvent.create({
        data: { propertyId, type: "created", payload: { title } },
      });
    }

    if (photos.length || tourUrl) {
      await prisma.propertyMedia.createMany({
        data: [
          ...photos.map((url, i) => ({ propertyId, kind: "PHOTO" as const, url, sortOrder: i })),
          ...(tourUrl ? [{ propertyId, kind: "VIRTUAL_TOUR" as const, url: tourUrl, sortOrder: 999 }] : []),
        ],
      });
    }
  } catch (e) {
    console.error("saveProperty:", e);
    redirect(id ? `/painel/imoveis/${id}?erro=2` : "/painel/imoveis/novo?erro=2");
  }

  revalidatePath("/painel/imoveis");
  revalidatePath("/imoveis");
  revalidatePath("/");
  redirect(`/painel/imoveis/${propertyId}?salvo=1`);
}

/** Muda o status (pausar, marcar vendido, republicar, arquivar). */
export async function setPropertyStatus(formData: FormData) {
  const { org } = await requireManagerUp();
  if (!process.env.DATABASE_URL || org.id === "demo") redirect("/painel/imoveis?demo=1");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "FOR_SALE") as any;

  // Blindagem: o imóvel precisa ser DESTE tenant (fora do try — redirect!)
  let before: { status: any; publishedAt: Date | null } | null = null;
  try {
    before = await prisma.property.findFirst({ where: { id, organizationId: org.id }, select: { status: true, publishedAt: true } });
  } catch (e) { console.error("setPropertyStatus(find):", e); }
  if (!before) redirect("/painel/imoveis");

  try {
    await prisma.property.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "FOR_SALE" && !before?.publishedAt ? new Date() : before?.publishedAt,
      },
    });
    await prisma.propertyEvent.create({
      data: { propertyId: id, type: "status_change", payload: { from: before?.status, to: status } },
    });
  } catch (e) {
    console.error("setPropertyStatus:", e);
  }

  revalidatePath("/painel/imoveis");
  revalidatePath("/imoveis");
  redirect(`/painel/imoveis/${id}?salvo=1`);
}
