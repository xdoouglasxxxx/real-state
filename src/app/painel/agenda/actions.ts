"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/perm";

/** Agenda uma visita (e move o lead para o estágio VISITA, se fizer sentido). */
export async function createVisit(formData: FormData) {
  const ctx = await requirePanel();
  const org = ctx.org;
  const leadId = String(formData.get("leadId") ?? "") || null;
  const propertyId = String(formData.get("propertyId") ?? "");
  const when = String(formData.get("scheduledAt") ?? "");
  if (!propertyId || !when) redirect("/painel/agenda/nova?erro=1");

  // Validação da data: precisa ser válida e no futuro (tolerância de 1h p/ relógio)
  const scheduledAt = new Date(`${when}:00-03:00`); // horário digitado no fuso do Brasil
  if (isNaN(+scheduledAt)) redirect("/painel/agenda/nova?erro=1");
  if (+scheduledAt < Date.now() - 3600000) redirect("/painel/agenda/nova?erro=data");

  let ok = false;
  let movedLead = false;
  try {
    // Blindagem multi-tenant
    const [property, lead] = await Promise.all([
      prisma.property.findFirst({ where: { id: propertyId, organizationId: org.id } }),
      // Corretor só vincula os PRÓPRIOS leads
      leadId ? prisma.lead.findFirst({
        where: { id: leadId, organizationId: org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
      }) : null,
    ]);
    if (!property) redirect("/painel/agenda/nova?erro=1");

    // Corretor logado agenda sempre para si mesmo
    const rawAgent = ctx.isAgent ? (ctx.agentId ?? "") : String(formData.get("agentId") ?? "");
    const agentOk = rawAgent
      ? await prisma.agent.findFirst({ where: { id: rawAgent, organizationId: org.id }, select: { id: true } })
      : null;

    await prisma.visit.create({
      data: {
        organizationId: org.id,
        propertyId,
        leadId: lead?.id ?? null,
        contactId: lead?.contactId ?? null,
        agentId: agentOk?.id ?? lead?.agentId ?? null,
        scheduledAt,
        status: "SCHEDULED",
      },
    });

    if (lead) {
      await prisma.activity.create({
        data: {
          leadId: lead.id, type: "NOTE",
          payload: {
            note: `Visita agendada para ${scheduledAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
            by: ctx.master ? "Master (plataforma)" : ctx.email,
          },
        },
      });
      if (["NEW", "CONTACTED"].includes(lead.stage)) {
        await prisma.lead.update({ where: { id: lead.id }, data: { stage: "VISIT" } });
        await prisma.activity.create({
          data: { leadId: lead.id, type: "STAGE_CHANGE", payload: { from: lead.stage, to: "VISIT" } },
        });
        movedLead = true;
      }
    }
    ok = true;
  } catch (e) {
    console.error("createVisit:", e);
  }
  revalidatePath("/painel/agenda");
  revalidatePath("/painel/leads");
  redirect(ok ? (movedLead ? "/painel/agenda?salvo=lead" : "/painel/agenda?salvo=1") : "/painel/agenda/nova?erro=2");
}

/** Atualiza o status (realizada / não veio / cancelada). */
export async function setVisitStatus(formData: FormData) {
  const ctx = await requirePanel();
  const org = ctx.org;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "SCHEDULED") as any;
  try {
    // Corretor só atualiza as PRÓPRIAS visitas
    const visit = await prisma.visit.findFirst({
      where: { id, organizationId: org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
    });
    if (visit) {
      await prisma.visit.update({ where: { id }, data: { status } });
      if (visit.leadId) {
        const label = status === "DONE" ? "Visita realizada ✅" : status === "NO_SHOW" ? "Cliente não compareceu" : "Visita cancelada";
        await prisma.activity.create({ data: { leadId: visit.leadId, type: "NOTE", payload: { note: label } } });
      }
    }
  } catch (e) {
    console.error("setVisitStatus:", e);
  }
  revalidatePath("/painel/agenda");
  redirect("/painel/agenda");
}
