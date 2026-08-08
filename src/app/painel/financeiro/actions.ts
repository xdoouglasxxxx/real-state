"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";

const rethrowRedirect = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};

const CATEGORIES = ["COMISSAO_RECEBIDA", "COMISSAO_PAGA", "IMPOSTO", "PRO_LABORE", "DESPESA_FIXA", "DESPESA_VARIAVEL", "MARKETING", "RECEITA_OUTRA"] as const;

/** Lançamento manual (conta a pagar ou a receber). */
export async function createFinanceEntry(formData: FormData) {
  const ctx = await requireAdmin();
  const back = `/painel/financeiro?mes=${String(formData.get("mes") ?? "")}`;

  const direction = String(formData.get("direction") ?? "");
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d,]/g, "").replace(",", "."));
  const dueDate = String(formData.get("dueDate") ?? "");
  const alreadyPaid = formData.get("alreadyPaid") === "on";

  if (!["IN", "OUT"].includes(direction) || !CATEGORIES.includes(category as any) ||
      !description || !amount || amount <= 0 || !dueDate) {
    redirect(`${back}&erro=campos`);
  }

  try {
    // Blindagem: vínculos só DESTE tenant
    const rawProp = String(formData.get("propertyId") ?? "");
    const rawAgent = String(formData.get("agentId") ?? "");
    const [propOk, agentOk] = await Promise.all([
      rawProp ? prisma.property.findFirst({ where: { id: rawProp, organizationId: ctx.org.id }, select: { id: true } }) : null,
      rawAgent ? prisma.agent.findFirst({ where: { id: rawAgent, organizationId: ctx.org.id }, select: { id: true } }) : null,
    ]);
    const due = new Date(`${dueDate}T12:00:00-03:00`);
    await prisma.financeEntry.create({
      data: {
        organizationId: ctx.org.id,
        direction: direction as any,
        category: category as any,
        description,
        amount,
        dueDate: due,
        paidAt: alreadyPaid ? due : null,
        propertyId: propOk?.id ?? null,
        agentId: agentOk?.id ?? null,
        createdBy: ctx.master ? "Master (plataforma)" : ctx.email,
      },
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("createFinanceEntry:", e);
    redirect(`${back}&erro=interno`);
  }
  revalidatePath("/painel/financeiro");
  redirect(`${back}&salvo=1`);
}

/** Marca como pago/recebido — ou estorna (volta para em aberto).
 *  M5: duas updateMany condicionais eliminam o read-then-write sem transação:
 *  a segunda só altera se o estado ainda for o esperado no momento da escrita. */
export async function toggleFinancePaid(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const back = `/painel/financeiro?mes=${String(formData.get("mes") ?? "")}`;
  try {
    const markedPaid = await prisma.financeEntry.updateMany({
      where: { id, organizationId: ctx.org.id, paidAt: null },
      data: { paidAt: new Date() },
    });
    if (markedPaid.count === 0) {
      await prisma.financeEntry.updateMany({
        where: { id, organizationId: ctx.org.id, paidAt: { not: null } },
        data: { paidAt: null },
      });
    }
  } catch (e) { console.error("toggleFinancePaid:", e); }
  revalidatePath("/painel/financeiro");
  redirect(back);
}

/** Paga a comissão do corretor: marca PAID e cria o lançamento de saída junto. */
export async function payCommission(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const back = `/painel/financeiro?mes=${String(formData.get("mes") ?? "")}`;
  try {
    const cm = await prisma.commission.findFirst({
      where: { id, organizationId: ctx.org.id, status: "PENDING" },
      include: { agent: { select: { name: true } } },
    });
    if (cm) {
      const now = new Date();
      await prisma.commission.update({ where: { id: cm.id }, data: { status: "PAID", paidAt: now } });
      await prisma.financeEntry.create({
        data: {
          organizationId: ctx.org.id,
          contractId: cm.contractId,
          direction: "OUT",
          category: "COMISSAO_PAGA",
          description: `Repasse de comissão — ${cm.agent?.name ?? "corretor"}`,
          amount: cm.amount,
          dueDate: now,
          paidAt: now,
          agentId: cm.agentId,
          createdBy: ctx.master ? "Master (plataforma)" : ctx.email,
        },
      });
    }
  } catch (e) { console.error("payCommission:", e); }
  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
  redirect(`${back}&comissao=1`);
}
