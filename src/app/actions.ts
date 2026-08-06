"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { notifyNewLead } from "@/lib/notify";

/**
 * Cria (ou reaproveita) o Contact e abre um Lead com a Activity inicial.
 * Grava direto no Supabase. Sem banco, apenas simula sucesso (demo).
 */
async function createLead(opts: {
  name: string; phone: string; message?: string;
  propertyId?: string | null; kind: "visit" | "sell";
  redirectTo: string;
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

      const lead = await prisma.lead.create({
        data: {
          organizationId: org.id,
          contactId: contact.id,
          propertyId: opts.propertyId || null,
          source: "SITE",
          stage: "NEW",
          interest: opts.message?.slice(0, 500),
        },
      });
      await prisma.activity.create({
        data: { leadId: lead.id, type: "FORM_SUBMIT", payload: { kind: opts.kind, message: opts.message ?? "" } },
      });
      await notifyNewLead({
        orgName: org.name, leadName: opts.name, leadPhone: opts.phone,
        interest: opts.message, agentPhone: null,
      });
    } catch (e) {
      console.error("createLead:", e);
    }
  }
  redirect(opts.redirectTo);
}

export async function submitVisitInquiry(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!name || !phone) redirect(`/imovel/${slug}?erro=1`);
  await createLead({ name, phone, message, propertyId, kind: "visit", redirectTo: `/imovel/${slug}?enviado=1` });
}

export async function submitSellInquiry(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  if (!name || !phone || !address) redirect("/vender?erro=1");
  await createLead({ name, phone, message: `Quer vender: ${address} (${type})`, kind: "sell", redirectTo: "/vender?enviado=1" });
}
