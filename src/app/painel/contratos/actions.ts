"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";

export async function updateContractPayment(formData: FormData) {
  const { org } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim() || null;
  const cashAmountRaw = String(formData.get("cashAmount") ?? "").replace(",", ".").trim();
  const cashAmount = cashAmountRaw === "" ? 0 : Math.max(0, Number(cashAmountRaw));

  try {
    const contract = await prisma.contract.findFirst({ where: { id, organizationId: org.id }, select: { id: true } });
    if (contract) {
      await prisma.contract.update({ where: { id: contract.id }, data: { paymentMethod, cashAmount } });
    }
  } catch (e) { console.error("updateContractPayment:", e); }
  revalidatePath(`/painel/contratos/${id}`);
  revalidatePath("/painel/contratos");
  redirect(`/painel/contratos/${id}?salvo=1`);
}

export async function markCoafReported(formData: FormData) {
  const { org } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  try {
    const contract = await prisma.contract.findFirst({ where: { id, organizationId: org.id }, select: { id: true } });
    if (contract) {
      await prisma.contract.update({ where: { id: contract.id }, data: { coafReportedAt: new Date() } });
    }
  } catch (e) { console.error("markCoafReported:", e); }
  revalidatePath(`/painel/contratos/${id}`);
  revalidatePath("/painel/contratos");
  redirect(`/painel/contratos/${id}?coaf=1`);
}
