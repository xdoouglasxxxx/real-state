"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";

export async function updateOrganization(formData: FormData) {
  const org = await getTenant();
  const session = getSession();
  if (!session || (!session.master && session.orgId !== org.id)) redirect("/login");

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
