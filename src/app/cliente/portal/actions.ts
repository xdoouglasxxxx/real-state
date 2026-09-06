"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireClientPortal } from "@/lib/perm";
import { rethrowRedirect } from "@/lib/redirect";
import { brl } from "@/lib/format";

// Espelha a ordem do enum LeadStage — comparação de progresso é por índice
const STAGE_ORDER = ["NEW", "CONTACTED", "VISIT", "PROPOSAL", "FINANCING", "CONTRACT", "WON", "LOST"];

/** Cliente envia uma proposta pela própria negociação (portal). */
export async function submitClientProposal(formData: FormData) {
  const ctx = await requireClientPortal();

  const leadId = String(formData.get("leadId") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(/[^\d,]/g, "").replace(",", "."));
  const conditions = String(formData.get("conditions") ?? "").trim().slice(0, 2000) || null;
  if (!leadId || !amount || amount <= 0) redirect("/cliente/portal/propostas?erro=valor");

  try {
    // Posse: a negociação tem que ser DESTE cliente, neste tenant, com imóvel
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ctx.org.id, contactId: { in: ctx.contactIds } },
      select: { id: true, stage: true, contactId: true, propertyId: true },
    });
    if (!lead || !lead.propertyId) redirect("/cliente/portal/propostas?erro=lead");
    if (lead!.stage === "WON" || lead!.stage === "LOST") redirect("/cliente/portal/propostas?erro=lead");

    await prisma.proposal.create({
      data: {
        organizationId: ctx.org.id,
        propertyId: lead!.propertyId!,
        leadId: lead!.id,
        contactId: lead!.contactId,
        amount: amount.toFixed(2), // Decimal via string, sem float
        conditions,
        status: "SENT",
      },
    });

    // Avança o funil quando a proposta chega antes do estágio PROPOSAL;
    // o portal só exibe STAGE_CHANGE (payload.to) — NOTE fica interna ao painel.
    if (STAGE_ORDER.indexOf(lead!.stage) < STAGE_ORDER.indexOf("PROPOSAL")) {
      await prisma.lead.update({ where: { id: lead!.id }, data: { stage: "PROPOSAL" } });
      await prisma.activity.create({
        data: { leadId: lead!.id, type: "STAGE_CHANGE", payload: { from: lead!.stage, to: "PROPOSAL", by: "Cliente (portal)" } },
      });
    } else {
      await prisma.activity.create({
        data: { leadId: lead!.id, type: "NOTE", payload: { note: `Cliente enviou proposta de ${brl(amount)} pelo portal`, by: "Cliente (portal)" } },
      });
    }
  } catch (e) {
    rethrowRedirect(e);
    console.error("submitClientProposal:", e);
    redirect("/cliente/portal/propostas?erro=interno");
  }

  revalidatePath("/cliente");
  revalidatePath("/cliente/portal/propostas");
  redirect("/cliente/portal/propostas?ok=1");
}
