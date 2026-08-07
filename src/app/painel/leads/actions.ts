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

/** Kanban: mover lead de estágio (chamado pelo drag-and-drop). */
export async function moveLeadStage(leadId: string, stage: string) {
  const org = await guard();
  try {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: org.id } });
    if (!lead || lead.stage === stage) return;
    await prisma.lead.update({ where: { id: leadId }, data: { stage: stage as any } });
    await prisma.activity.create({
      data: { leadId, type: "STAGE_CHANGE", payload: { from: lead.stage, to: stage } },
    });
    revalidatePath("/painel/leads");
    revalidatePath("/painel");
  } catch (e) { console.error("moveLeadStage:", e); }
}

/** Ficha: anotação na timeline. */
export async function addLeadNote(formData: FormData) {
  const org = await guard();
  const leadId = String(formData.get("leadId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!leadId || !note) redirect(`/painel/leads/${leadId}`);
  try {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: org.id } });
    if (lead) {
      await prisma.activity.create({ data: { leadId, type: "NOTE", payload: { note } } });
    }
  } catch (e) { console.error("addLeadNote:", e); }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}`);
}

/** Ficha: atribuir/trocar corretor (distribuição manual). */
export async function assignAgent(formData: FormData) {
  const org = await guard();
  const leadId = String(formData.get("leadId") ?? "");
  const rawAgent = String(formData.get("agentId") ?? "");
  try {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: org.id } });
    const agentOk = rawAgent
      ? await prisma.agent.findFirst({ where: { id: rawAgent, organizationId: org.id }, select: { id: true } })
      : null;
    if (lead) {
      await prisma.lead.update({ where: { id: leadId }, data: { agentId: agentOk?.id ?? null } });
      await prisma.activity.create({
        data: { leadId, type: "NOTE", payload: { note: agentOk ? "Lead atribuído a novo corretor" : "Corretor removido" } },
      });
    }
  } catch (e) { console.error("assignAgent:", e); }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}`);
}

/** Criar lead manualmente (telefone, balcão, indicação...). */
export async function createManualLead(formData: FormData) {
  const org = await guard();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) redirect("/painel/leads/novo?erro=1");

  // NOTA: redirect() do Next lança exceção de controle — NUNCA dentro de try/catch.
  let newLeadId: string | null = null;
  try {
    // Blindagem: só aceita corretor/imóvel que pertençam a ESTE tenant
    const rawAgent = String(formData.get("agentId") ?? "");
    const rawProperty = String(formData.get("propertyId") ?? "");
    const [agentOk, propertyOk] = await Promise.all([
      rawAgent ? prisma.agent.findFirst({ where: { id: rawAgent, organizationId: org.id }, select: { id: true } }) : null,
      rawProperty ? prisma.property.findFirst({ where: { id: rawProperty, organizationId: org.id }, select: { id: true } }) : null,
    ]);

    const existing = await prisma.contact.findFirst({ where: { organizationId: org.id, phone } });
    const contact = existing ?? (await prisma.contact.create({
      data: { organizationId: org.id, name, phone, kind: "BUYER" },
    }));
    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        contactId: contact.id,
        agentId: agentOk?.id ?? null,
        propertyId: propertyOk?.id ?? null,
        source: String(formData.get("source") ?? "OUTRO") as any,
        stage: "NEW",
        interest: String(formData.get("interest") ?? "").trim() || null,
      },
    });
    await prisma.activity.create({
      data: { leadId: lead.id, type: "NOTE", payload: { note: "Lead criado manualmente no painel" } },
    });
    newLeadId = lead.id;
  } catch (e) {
    console.error("createManualLead:", e);
  }
  revalidatePath("/painel/leads");
  redirect(newLeadId ? `/painel/leads/${newLeadId}` : "/painel/leads/novo?erro=2");
}
