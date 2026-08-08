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

    // Recorrência SEM migração: cria as N parcelas futuras já como Previsto.
    // Dia clampado ao fim do mês (31/01 → 28/02, não 03/03).
    const repeatRaw = Number(formData.get("repeat") ?? 1);
    const repeat = [1, 3, 6, 12].includes(repeatRaw) ? repeatRaw : 1;
    const addMonths = (d: Date, i: number) => {
      const y = d.getFullYear(), m = d.getMonth() + i, day = d.getDate();
      const last = new Date(y, m + 1, 0).getDate();
      return new Date(y, m, Math.min(day, last), 12);
    };
    const createdBy = ctx.master ? "Master (plataforma)" : ctx.email;
    await prisma.financeEntry.createMany({
      data: Array.from({ length: repeat }, (_, i) => ({
        organizationId: ctx.org.id,
        direction: direction as any,
        category: category as any,
        description: repeat > 1 ? `${description} (${i + 1}/${repeat})` : description,
        amount,
        dueDate: addMonths(due, i),
        paidAt: alreadyPaid && i === 0 ? due : null,
        propertyId: propOk?.id ?? null,
        agentId: agentOk?.id ?? null,
        createdBy,
      })),
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("createFinanceEntry:", e);
    redirect(`${back}&erro=interno`);
  }
  revalidatePath("/painel/financeiro");
  redirect(`${back}&salvo=1`);
}

/** Marca como pago/recebido — ou estorna (volta para em aberto). */
export async function toggleFinancePaid(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const back = `/painel/financeiro?mes=${String(formData.get("mes") ?? "")}`;
  try {
    // Atômico: toggle em única passagem — sem TOCTOU, tenant verificado no WHERE
    await prisma.$executeRaw`
      UPDATE "FinanceEntry"
      SET "paidAt" = CASE WHEN "paidAt" IS NULL THEN NOW() ELSE NULL END
      WHERE id = ${id} AND "organizationId" = ${ctx.org.id}
    `;
  } catch (e) { console.error("toggleFinancePaid:", e); }
  revalidatePath("/painel/financeiro");
  redirect(back);
}

/** Paga a comissão — integral ou PARCIAL. Cada pagamento vira saída no caixa;
 *  a comissão só vira PAID quando o total for quitado. */
export async function payCommission(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const back = `/painel/financeiro?mes=${String(formData.get("mes") ?? "")}`;
  const rawVal = String(formData.get("valor") ?? "").trim();
  try {
    const cm = await prisma.commission.findFirst({
      where: { id, organizationId: ctx.org.id, status: "PENDING" },
      include: { agent: { select: { name: true } } },
    });
    if (cm) {
      const total = Number(cm.amount);
      const jaPago = Number(cm.paidAmount ?? 0);
      const restante = Math.max(0, total - jaPago);
      // vazio = quitar o restante; preenchido = parcial (limitado ao restante)
      const parsed = rawVal ? Number(rawVal.replace(/[^\d,]/g, "").replace(",", ".")) : restante;
      const valor = Math.min(Math.max(0, parsed || 0), restante);
      if (valor <= 0) redirect(`${back}&comissao=valor`);

      const now = new Date();
      const novoPago = jaPago + valor;
      const quitou = novoPago >= total - 0.005;
      await prisma.commission.update({
        where: { id: cm.id },
        data: { paidAmount: novoPago, ...(quitou ? { status: "PAID", paidAt: now } : {}) },
      });
      await prisma.financeEntry.create({
        data: {
          organizationId: ctx.org.id,
          contractId: cm.contractId,
          direction: "OUT",
          category: "COMISSAO_PAGA",
          description: quitou && jaPago === 0
            ? `Repasse de comissão — ${cm.agent?.name ?? "corretor"}`
            : `Repasse de comissão (parcela) — ${cm.agent?.name ?? "corretor"} · ${brlText(novoPago)} de ${brlText(total)}`,
          amount: valor,
          dueDate: now,
          paidAt: now,
          agentId: cm.agentId,
          createdBy: ctx.master ? "Master (plataforma)" : ctx.email,
        },
      });
    }
  } catch (e) {
    rethrowRedirect(e);
    console.error("payCommission:", e);
  }
  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
  redirect(`${back}&comissao=1`);
}

const brlText = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Nova comissão em um contrato — habilita SPLIT de co-corretagem
 *  (duas ou mais comissões no mesmo contrato, uma por corretor). */
export async function createCommission(formData: FormData) {
  const ctx = await requireAdmin();
  const back = `/painel/financeiro?mes=${String(formData.get("mes") ?? "")}`;
  const contractId = String(formData.get("contractId") ?? "");
  const agentId = String(formData.get("agentId") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d,]/g, "").replace(",", "."));
  if (!contractId || !agentId || !amount || amount <= 0) redirect(`${back}&comissao=campos`);

  try {
    // Blindagem: contrato e corretor DESTE tenant
    const [contractOk, agentOk] = await Promise.all([
      prisma.contract.findFirst({ where: { id: contractId, organizationId: ctx.org.id }, select: { id: true } }),
      prisma.agent.findFirst({ where: { id: agentId, organizationId: ctx.org.id }, select: { id: true } }),
    ]);
    if (!contractOk || !agentOk) redirect(`${back}&comissao=campos`);
    await prisma.commission.create({
      data: { organizationId: ctx.org.id, contractId: contractOk!.id, agentId: agentOk!.id, amount },
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("createCommission:", e);
    redirect(`${back}&comissao=erro`);
  }
  revalidatePath("/painel/financeiro");
  redirect(`${back}&comissao=nova`);
}
