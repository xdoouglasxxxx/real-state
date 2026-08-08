"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { notifyNewLead } from "@/lib/notify";
import { pickAgentRoundRobin } from "@/lib/assign";

/**
 * Cria (ou reaproveita) o Contact e abre um Lead com a Activity inicial.
 * Grava direto no Supabase. Sem banco, apenas simula sucesso (demo).
 */
async function createLead(opts: {
  name: string; phone: string; message?: string;
  propertyId?: string | null; wantSimilar?: boolean; kind: "visit" | "sell";
  redirectTo: string; lgpdConsent?: boolean; lgpdIp?: string | null;
}) {
  const org = await getTenant();

  if (process.env.DATABASE_URL && org.id !== "demo") {
    try {
      const existing = await prisma.contact.findFirst({
        where: { organizationId: org.id, phone: opts.phone },
      });
      const contact =
        existing ??
        (await prisma.contact.create({
          data: {
            organizationId: org.id,
            name: opts.name,
            phone: opts.phone,
            kind: opts.kind === "sell" ? "OWNER" : "BUYER",
          },
        }));

      // L1: verificar status do imóvel antes de criar o lead.
      let propertySoldNote: string | null = null;
      if (opts.propertyId) {
        const prop = await prisma.property.findFirst({
          where: { id: opts.propertyId, organizationId: org.id },
          select: { status: true },
        });
        if (prop?.status === "SOLD" || prop?.status === "RESERVED") {
          const statusLabel = prop.status === "SOLD" ? "vendido" : "reservado";
          propertySoldNote = `⚠ Imóvel já estava ${statusLabel} no momento do contato — oferecer similares`;
          if (opts.wantSimilar) propertySoldNote += " · cliente aceita imóveis similares";
        }
      }

      // L2: passar propertyId para priorizar corretor do imóvel; fallback no rodízio.
      const chosen = await pickAgentRoundRobin(org.id, opts.propertyId).catch(() => null);
      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          contactId: contact.id,
          propertyId: opts.propertyId || null,
          source: "SITE",
          stage: "NEW",
          agentId: chosen?.id ?? null,
          interest: opts.message?.slice(0, 500),
          lgpdConsentAt: opts.lgpdConsent ? new Date() : null,
          lgpdIp: opts.lgpdIp ?? null,
        },
      });
      await prisma.activity.create({
        data: { leadId: lead.id, type: "FORM_SUBMIT", payload: { kind: opts.kind, message: opts.message ?? "" } },
      });
      if (propertySoldNote) {
        await prisma.activity.create({
          data: { leadId: lead.id, type: "NOTE", payload: { note: propertySoldNote } },
        });
      }
      if (chosen) {
        const assignNote = chosen.fromProperty
          ? `Lead atribuído a ${chosen.name} — corretor responsável pelo imóvel`
          : `Distribuído automaticamente para ${chosen.name} (rodízio)`;
        await prisma.activity.create({
          data: { leadId: lead.id, type: "NOTE", payload: { note: assignNote } },
        });
      }
      await notifyNewLead({
        orgName: org.name, leadName: opts.name, leadPhone: opts.phone,
        interest: opts.message, agentName: chosen?.name ?? null, agentPhone: chosen?.phone ?? null,
      });
    } catch (e) {
      console.error("createLead:", e);
    }
  }
  redirect(opts.redirectTo);
}

export async function submitVisitInquiry(formData: FormData) {
  const wantSimilar = formData.get("wantSimilar") === "1";
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 20);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  const propertyId = String(formData.get("propertyId") ?? "");
  const lgpdConsent = formData.get("lgpd") === "on";
  // M2: slug vem do FormData — sanitizar para [a-z0-9-] antes de usar em redirect.
  const slug = String(formData.get("slug") ?? "").replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers().get("x-real-ip") ?? null;
  if (!name || !phone || !lgpdConsent) redirect(`/imovel/${slug}?erro=1`);
  await createLead({ name, phone, message, propertyId, wantSimilar, kind: "visit", redirectTo: `/imovel/${slug}?enviado=1`, lgpdConsent, lgpdIp: ip });
}

export async function submitSellInquiry(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 20);
  const address = String(formData.get("address") ?? "").trim().slice(0, 300);
  const type = String(formData.get("type") ?? "").slice(0, 30);
  const lgpdConsent = formData.get("lgpd") === "on";
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers().get("x-real-ip") ?? null;
  if (!name || !phone || !address || !lgpdConsent) redirect("/vender?erro=1");
  await createLead({ name, phone, message: `Quer vender: ${address} (${type})`, kind: "sell", redirectTo: "/vender?enviado=1", lgpdConsent, lgpdIp: ip });
}
