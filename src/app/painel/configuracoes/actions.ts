"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import type { FinancingRate } from "@/lib/financing";

export async function updateOrganization(formData: FormData) {
  const { org } = await requireAdmin();

  try {
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: String(formData.get("name") ?? org.name).trim() || org.name,
        logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
        themeBrass: String(formData.get("themeBrass") ?? "#c6a15b"),
        themeInk: String(formData.get("themeInk") ?? "#17130e"),
        themeCream: String(formData.get("themeCream") ?? "#f4efe4"),
        creci: String(formData.get("creci") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        city: String(formData.get("city") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        address: String(formData.get("address") ?? "").trim() || null,
      },
    });
  } catch (e) {
    console.error("updateOrganization:", e);
  }
  revalidatePath("/", "layout");
  redirect("/painel/configuracoes?salvo=1");
}

/** Gera (ou regenera) o token secreto do feed XML de portais.
 *  Regenerar INVALIDA as URLs antigas — reconfigurar nos portais. */
export async function regenerateFeedToken() {
  const { org } = await requireAdmin();
  try {
    const { randomBytes } = await import("node:crypto");
    await prisma.organization.update({
      where: { id: org.id },
      data: { feedToken: randomBytes(16).toString("hex") },
    });
  } catch (e) {
    console.error("regenerateFeedToken:", e);
  }
  revalidatePath("/painel/configuracoes");
  redirect("/painel/configuracoes?salvo=1");
}

export async function saveFinancingRates(formData: FormData) {
  const { org } = await requireAdmin();

  const rates: FinancingRate[] = [];
  for (let idx = 0; idx < 10; idx++) {
    const banco = String(formData.get(`banco_${idx}`) ?? "").trim().slice(0, 40);
    const taxa = Number(formData.get(`taxa_${idx}`) ?? "");
    if (!banco || !taxa) continue;
    if (taxa < 1 || taxa > 30) continue;
    rates.push({ banco, taxa });
  }

  try {
    await prisma.organization.update({ where: { id: org.id }, data: { financingRates: rates } });
  } catch (e) {
    console.error("saveFinancingRates:", e);
  }
  revalidatePath("/painel/configuracoes");
  redirect("/painel/configuracoes?salvo=1");
}
