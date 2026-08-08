"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";

const rethrowRedirect = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};
const money = (raw: unknown) => Number(String(raw ?? "").replace(/[^\d,]/g, "").replace(",", "."));
const addMonthsClamped = (d: Date, i: number, day: number) => {
  const y = d.getFullYear(), m = d.getMonth() + i;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, last), 12);
};

/** Cria o contrato + a régua de cobrança inteira (parcelas mensais pré-geradas). */
export async function createRentalContract(formData: FormData) {
  const ctx = await requireAdmin();
  const back = "/painel/locacao/novo";

  const propertyId = String(formData.get("propertyId") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "");
  const agentId = String(formData.get("agentId") ?? "");
  const type = String(formData.get("type") ?? "LONG_STAY");
  const rentValue = money(formData.get("rentValue"));
  const adminFeePct = Math.min(40, Math.max(0, money(formData.get("adminFeePct")) || 10));
  const setupFee = money(formData.get("setupFee"));
  const guaranteeType = String(formData.get("guaranteeType") ?? "FIADOR");
  const guaranteeFeePct = guaranteeType === "PROPRIA" ? Math.min(20, Math.max(0, money(formData.get("guaranteeFeePct")) || 12)) : 0;
  const dueDay = Math.min(28, Math.max(1, Number(formData.get("dueDay") ?? 5)));
  const startRaw = String(formData.get("startDate") ?? "");
  const months = [12, 24, 30, 36].includes(Number(formData.get("months"))) ? Number(formData.get("months")) : 12;
  const reajusteIndex = ["IGP-M", "IPCA", "IVAR"].includes(String(formData.get("reajusteIndex"))) ? String(formData.get("reajusteIndex")) : "IGP-M";
  const confirmSale = formData.get("confirmSale") === "on";

  if (!propertyId || !tenantId || !rentValue || rentValue <= 0 || !startRaw) redirect(`${back}?erro=campos`);

  try {
    // Blindagem: tudo DESTE tenant
    const [property, tenant, agentOk] = await Promise.all([
      prisma.property.findFirst({
        where: { id: propertyId, organizationId: ctx.org.id },
        select: { id: true, status: true, ownerId: true, title: true },
      }),
      prisma.contact.findFirst({ where: { id: tenantId, organizationId: ctx.org.id }, select: { id: true } }),
      agentId ? prisma.agent.findFirst({ where: { id: agentId, organizationId: ctx.org.id }, select: { id: true } }) : null,
    ]);
    if (!property || !tenant) redirect(`${back}?erro=campos`);

    // Regra: imóvel em venda ativa exige confirmação explícita
    if (["FOR_SALE", "EXCLUSIVE", "RESERVED"].includes(property!.status) && !confirmSale) {
      redirect(`${back}?erro=venda`);
    }
    // Regra: sem proprietário cadastrado no imóvel, não há para quem repassar
    if (!property!.ownerId) redirect(`${back}?erro=semdono`);
    // Regra: um contrato ATIVO por imóvel
    const already = await prisma.rentalContract.findFirst({
      where: { organizationId: ctx.org.id, propertyId: property!.id, status: "ATIVO" }, select: { id: true },
    });
    if (already) redirect(`${back}?erro=jaalugado`);

    const start = new Date(`${startRaw}T12:00:00-03:00`);
    const end = addMonthsClamped(start, months, start.getDate());
    const createdBy = ctx.master ? "Master (plataforma)" : ctx.email;

    const contract = await prisma.rentalContract.create({
      data: {
        organizationId: ctx.org.id,
        propertyId: property!.id,
        ownerId: property!.ownerId!,
        tenantId: tenant!.id,
        agentId: agentOk?.id ?? null,
        type: type as any,
        rentValue, adminFeePct, setupFee,
        guaranteeType: guaranteeType as any, guaranteeFeePct,
        startDate: start, endDate: end, dueDay, reajusteIndex,
        createdBy,
      },
    });

    // Régua: 1ª parcela no primeiro dueDay a partir do início
    const first = new Date(start.getFullYear(), start.getMonth() + (start.getDate() > dueDay ? 1 : 0), dueDay, 12);
    const adminFee = Math.round(rentValue * adminFeePct) / 100;
    const guaranteeFee = Math.round(rentValue * guaranteeFeePct) / 100;
    await prisma.rentPayment.createMany({
      data: Array.from({ length: months }, (_, i) => {
        const due = addMonthsClamped(first, i, dueDay);
        return {
          organizationId: ctx.org.id,
          contractId: contract.id,
          referenceMonth: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`,
          dueDate: due,
          rentValue, adminFee, guaranteeFee,
          totalBilled: rentValue + guaranteeFee,
        };
      }),
    });

    // Taxa de setup entra no financeiro como receita prevista
    if (setupFee > 0) {
      await prisma.financeEntry.create({
        data: {
          organizationId: ctx.org.id, direction: "IN", category: "RECEITA_OUTRA",
          description: `Taxa de setup locação — ${property!.title}`,
          amount: setupFee, dueDate: start, createdBy,
        },
      });
    }
    revalidatePath("/painel/locacao");
    redirect(`/painel/locacao/${contract.id}?ok=1`);
  } catch (e) {
    rethrowRedirect(e);
    console.error("createRentalContract:", e);
    redirect(`${back}?erro=interno`);
  }
}

/** Inquilino pagou: entrada no caixa (aluguel + taxas) e libera o repasse. */
export async function markRentPaid(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let contractId = "";
  try {
    const pay = await prisma.rentPayment.findFirst({
      where: { id, organizationId: ctx.org.id, status: { in: ["PREVISTO", "ATRASADO"] } },
      include: { contract: { select: { id: true, property: { select: { title: true } }, tenant: { select: { name: true } } } } },
    });
    if (pay) {
      contractId = pay.contract.id;
      const now = new Date();
      const fin = await prisma.financeEntry.create({
        data: {
          organizationId: ctx.org.id, direction: "IN", category: "ALUGUEL_RECEBIDO",
          description: `Aluguel ${pay.referenceMonth} — ${pay.contract.property.title} (${pay.contract.tenant.name})`,
          amount: pay.totalBilled, dueDate: pay.dueDate, paidAt: now,
          createdBy: ctx.master ? "Master (plataforma)" : ctx.email,
        },
      });
      await prisma.rentPayment.update({
        where: { id: pay.id },
        data: { status: "PAGO", paidAt: now, financeEntryId: fin.id },
      });
    }
  } catch (e) { console.error("markRentPaid:", e); }
  revalidatePath("/painel/locacao");
  if (contractId) redirect(`/painel/locacao/${contractId}?pago=1`);
  redirect("/painel/locacao");
}

/** Repasse ao proprietário: saída no caixa (aluguel − taxa adm). NUNCA antes do pagamento. */
export async function transferRent(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let contractId = "";
  try {
    const pay = await prisma.rentPayment.findFirst({
      where: { id, organizationId: ctx.org.id, status: "PAGO", repasseAt: null },
      include: { contract: { select: { id: true, property: { select: { title: true } }, owner: { select: { name: true } } } } },
    });
    if (pay) {
      contractId = pay.contract.id;
      const now = new Date();
      const repasse = Number(pay.rentValue) - Number(pay.adminFee);
      await prisma.financeEntry.create({
        data: {
          organizationId: ctx.org.id, direction: "OUT", category: "REPASSE_LOCACAO",
          description: `Repasse ${pay.referenceMonth} — ${pay.contract.owner.name} (${pay.contract.property.title})`,
          amount: repasse, dueDate: now, paidAt: now,
          createdBy: ctx.master ? "Master (plataforma)" : ctx.email,
        },
      });
      await prisma.rentPayment.update({ where: { id: pay.id }, data: { repasseAt: now, repasseValue: repasse } });
    }
  } catch (e) { console.error("transferRent:", e); }
  revalidatePath("/painel/locacao");
  if (contractId) redirect(`/painel/locacao/${contractId}?repasse=1`);
  redirect("/painel/locacao");
}

/** Encerra/rescinde: cancela parcelas futuras não pagas (multa: Fase 2). */
export async function closeRentalContract(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const kind = formData.get("kind") === "RESCINDIDO" ? "RESCINDIDO" : "ENCERRADO";
  try {
    const contract = await prisma.rentalContract.findFirst({
      where: { id, organizationId: ctx.org.id, status: "ATIVO" }, select: { id: true },
    });
    if (contract) {
      await prisma.$transaction([
        prisma.rentalContract.update({ where: { id: contract.id }, data: { status: kind as any } }),
        prisma.rentPayment.updateMany({
          where: { contractId: contract.id, status: { in: ["PREVISTO", "ATRASADO"] } },
          data: { status: "CANCELADO" },
        }),
      ]);
    }
  } catch (e) { console.error("closeRentalContract:", e); }
  revalidatePath("/painel/locacao");
  redirect(`/painel/locacao/${id}?encerrado=1`);
}
