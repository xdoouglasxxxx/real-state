"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";

async function guard() {
  const org = await getTenant();
  const session = getSession();
  if (!session || (!session.master && session.orgId !== org.id)) redirect("/login");
  return org;
}

export async function createAgent(formData: FormData) {
  const org = await guard();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/painel/corretores?erro=1");

  try {
    await prisma.agent.create({
      data: {
        organizationId: org.id,
        name,
        creci: String(formData.get("creci") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        photoUrl: String(formData.get("photoUrl") ?? "").trim() || null,
        isFeatured: formData.get("isFeatured") === "on",
      },
    });
  } catch (e) {
    console.error("createAgent:", e);
  }
  revalidatePath("/painel/corretores");
  revalidatePath("/");
  redirect("/painel/corretores?salvo=1");
}

export async function toggleAgent(formData: FormData) {
  const org = await guard();
  const id = String(formData.get("id") ?? "");
  try {
    const agent = await prisma.agent.findFirst({ where: { id, organizationId: org.id } });
    if (agent) {
      await prisma.agent.update({ where: { id }, data: { isActive: !agent.isActive } });
    }
  } catch (e) {
    console.error("toggleAgent:", e);
  }
  revalidatePath("/painel/corretores");
  revalidatePath("/");
  redirect("/painel/corretores");
}
