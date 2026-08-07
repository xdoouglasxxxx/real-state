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

/** Agenda uma visita (e move o lead para o estágio VISITA, se fizer sentido). */
export async function createVisit(formData: FormData) {
  const org = await guard();
  const leadId = String(formData.get("leadId") ?? "") || null;
  const propertyId = String(formData.get("propertyId") ?? "");
  const when = String(formData.get("scheduledAt") ?? "");
  if (!propertyId || !when) redirect("/painel/agenda/nova?erro=1");

  let ok = false;
  try {
    // Blindagem multi-tenant
    const [property, lead] = await Promise.all([
      prisma.property.findFirst({ where: { id: propertyId, organizationId: org.id } }),
      leadId ? prisma.lead.findFirst({ where: { id: leadId, organizationId: org.id } }) : null,
    ]);
    if (!property) redirect("/painel/agenda/nova?erro=1");

    const rawAgent = String(formData.get("agentId") ?? "");
    const agentOk = rawAgent
      ? await prisma.agent.findFirst({ where: { id: rawAgent, organizationId: org.id }, select: { id: true } })
      : null;

    // horário digitado no fuso do Brasil
    const scheduledAt = new Date(`${when}:00-03:00`);

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
          payload: { note: `Visita agendada para ${scheduledAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` },
        },
      });
      if (["NEW", "CONTACTED"].includes(lead.stage)) {
        await prisma.lead.update({ where: { id: lead.id }, data: { stage: "VISIT" } });
        await prisma.activity.create({
          data: { leadId: lead.id, type: "STAGE_CHANGE", payload: { from: lead.stage, to: "VISIT" } },
        });
      }
    }
    ok = true;
  } catch (e) {
    console.error("createVisit:", e);
  }
  revalidatePath("/painel/agenda");
  revalidatePath("/painel/leads");
  redirect(ok ? "/painel/agenda?salvo=1" : "/painel/agenda/nova?erro=2");
}

/** Atualiza o status (realizada / não veio / cancelada). */
export async function setVisitStatus(formData: FormData) {
  const org = await guard();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "SCHEDULED") as any;
  try {
    const visit = await prisma.visit.findFirst({ where: { id, organizationId: org.id } });
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
