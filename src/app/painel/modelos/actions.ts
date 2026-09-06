"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import { DEFAULT_VENDA, DEFAULT_LOCACAO } from "@/lib/contract-render";
import { rethrowRedirect } from "@/lib/redirect";

/** Garante que o tenant tem os 2 modelos padrão (idempotente). */
export async function ensureDefaultTemplates(orgId: string) {
  try {
    const existing = await prisma.contractTemplate.findMany({
      where: { organizationId: orgId }, select: { kind: true },
    });
    const kinds = new Set(existing.map((t) => t.kind));
    const data = [];
    if (!kinds.has("VENDA")) data.push({ organizationId: orgId, kind: "VENDA" as const, name: "Compromisso de compra e venda (padrão)", body: DEFAULT_VENDA });
    if (!kinds.has("LOCACAO")) data.push({ organizationId: orgId, kind: "LOCACAO" as const, name: "Contrato de locação residencial (padrão)", body: DEFAULT_LOCACAO });
    if (data.length) await prisma.contractTemplate.createMany({ data });
  } catch (e) { console.error("ensureDefaultTemplates:", e); }
}

/** Salva a edição de um modelo (admin). */
export async function saveTemplate(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").slice(0, 40000);
  if (!id || !name || body.length < 50) redirect("/painel/modelos?erro=campos");
  try {
    const tpl = await prisma.contractTemplate.findFirst({
      where: { id, organizationId: ctx.org.id }, select: { id: true },
    });
    if (!tpl) redirect("/painel/modelos?erro=campos");
    await prisma.contractTemplate.update({
      where: { id: tpl!.id },
      data: { name, body, updatedBy: ctx.master ? "Master (plataforma)" : ctx.email },
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("saveTemplate:", e);
    redirect("/painel/modelos?erro=interno");
  }
  revalidatePath("/painel/modelos");
  redirect("/painel/modelos?ok=1");
}
