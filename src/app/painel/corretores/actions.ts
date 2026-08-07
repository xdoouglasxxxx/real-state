"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerUp } from "@/lib/perm";

// Corretores são cadastrados por gerente ou admin
async function guard() {
  const { org } = await requireManagerUp();
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

export async function updateAgent(formData: FormData) {
  const org = await guard();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/painel/corretores/${id}?erro=1`);

  // Comissão padrão em % (0 a 100), aceita vírgula
  const pctRaw = String(formData.get("commissionPct") ?? "").replace(",", ".").trim();
  const pct = pctRaw === "" ? null : Math.min(100, Math.max(0, Number(pctRaw)));

  try {
    // Blindagem: só edita corretor DESTE tenant
    const agent = await prisma.agent.findFirst({ where: { id, organizationId: org.id }, select: { id: true } });
    if (agent) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          name,
          creci: String(formData.get("creci") ?? "").trim() || null,
          phone: String(formData.get("phone") ?? "").trim() || null,
          email: String(formData.get("email") ?? "").trim() || null,
          photoUrl: String(formData.get("photoUrl") ?? "").trim() || null,
          bio: String(formData.get("bio") ?? "").trim() || null,
          isFeatured: formData.get("isFeatured") === "on",
          ...(pct !== null && !isNaN(pct) ? { commissionPct: pct } : {}),
        },
      });
    }
  } catch (e) {
    console.error("updateAgent:", e);
    redirect(`/painel/corretores/${id}?erro=2`);
  }
  revalidatePath("/painel/corretores");
  revalidatePath("/");
  redirect(`/painel/corretores/${id}?salvo=1`);
}
