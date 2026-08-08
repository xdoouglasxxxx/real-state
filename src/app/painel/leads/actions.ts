"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePanel, requireManagerUp, type PanelContext } from "@/lib/perm";

/** Autor das ações — vai na timeline (auditoria leve: quem fez o quê). */
const author = (ctx: PanelContext) => (ctx.master ? "Master (plataforma)" : ctx.email);

/** Kanban: mover lead de estágio (chamado pelo drag-and-drop).
 *  Corretor só move os PRÓPRIOS leads. */
export async function moveLeadStage(leadId: string, stage: string) {
  const ctx = await requirePanel();
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ctx.org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
    });
    if (!lead || lead.stage === stage) return;
    await prisma.lead.update({ where: { id: leadId }, data: { stage: stage as any } });
    await prisma.activity.create({
      data: { leadId, type: "STAGE_CHANGE", payload: { from: lead.stage, to: stage, by: author(ctx) } },
    });
    revalidatePath("/painel/leads");
    revalidatePath("/painel");
  } catch (e) { console.error("moveLeadStage:", e); }
}

/** Ficha: anotação na timeline. Corretor só anota nos próprios leads. */
export async function addLeadNote(formData: FormData) {
  const ctx = await requirePanel();
  const leadId = String(formData.get("leadId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!leadId || !note) redirect(`/painel/leads/${leadId}`);
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ctx.org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
    });
    if (lead) {
      await prisma.activity.create({ data: { leadId, type: "NOTE", payload: { note, by: author(ctx) } } });
    }
  } catch (e) { console.error("addLeadNote:", e); }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}`);
}

/** Ficha: atribuir/trocar corretor (só gerente ou admin — corretor não redistribui). */
export async function assignAgent(formData: FormData) {
  const ctx = await requireManagerUp();
  const leadId = String(formData.get("leadId") ?? "");
  const rawAgent = String(formData.get("agentId") ?? "");
  try {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId: ctx.org.id } });
    const agentOk = rawAgent
      ? await prisma.agent.findFirst({ where: { id: rawAgent, organizationId: ctx.org.id }, select: { id: true } })
      : null;
    if (lead) {
      await prisma.lead.update({ where: { id: leadId }, data: { agentId: agentOk?.id ?? null } });
      const agentName = agentOk
        ? (await prisma.agent.findUnique({ where: { id: agentOk.id }, select: { name: true } }))?.name
        : null;
      await prisma.activity.create({
        data: {
          leadId, type: "NOTE",
          payload: { note: agentName ? `Lead atribuído a ${agentName}` : "Corretor removido", by: author(ctx) },
        },
      });
    }
  } catch (e) { console.error("assignAgent:", e); }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}`);
}

/** Criar lead manualmente (telefone, balcão, indicação...).
 *  Corretor cria, mas o lead entra automaticamente na carteira DELE. */
export async function createManualLead(formData: FormData) {
  const ctx = await requirePanel();
  // Corretor sem vínculo não cria lead: nasceria "sem dono" e invisível para ele
  if (ctx.isAgent && !ctx.agentId) redirect("/painel/leads/novo?erro=vinculo");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) redirect("/painel/leads/novo?erro=1");

  // NOTA: redirect() do Next lança exceção de controle — NUNCA dentro de try/catch.
  let newLeadId: string | null = null;
  try {
    // Blindagem: só aceita corretor/imóvel que pertençam a ESTE tenant.
    // Corretor logado não escolhe: o lead é sempre dele.
    const rawAgent = ctx.isAgent ? (ctx.agentId ?? "") : String(formData.get("agentId") ?? "");
    const rawProperty = String(formData.get("propertyId") ?? "");
    const [agentOk, propertyOk] = await Promise.all([
      rawAgent ? prisma.agent.findFirst({ where: { id: rawAgent, organizationId: ctx.org.id }, select: { id: true } }) : null,
      rawProperty ? prisma.property.findFirst({ where: { id: rawProperty, organizationId: ctx.org.id }, select: { id: true } }) : null,
    ]);

    // L3: kind vem do campo contactKind do form; default BUYER se omitido/inválido.
    const VALID_KINDS = ["BUYER", "OWNER", "BOTH"] as const;
    type ContactKind = typeof VALID_KINDS[number];
    const rawKind = String(formData.get("contactKind") ?? "");
    const contactKind: ContactKind = (VALID_KINDS as readonly string[]).includes(rawKind)
      ? (rawKind as ContactKind)
      : "BUYER";

    const existing = await prisma.contact.findFirst({ where: { organizationId: ctx.org.id, phone } });
    const contact = existing ?? (await prisma.contact.create({
      data: { organizationId: ctx.org.id, name, phone, kind: contactKind },
    }));
    const lead = await prisma.lead.create({
      data: {
        organizationId: ctx.org.id,
        contactId: contact.id,
        agentId: agentOk?.id ?? null,
        propertyId: propertyOk?.id ?? null,
        source: String(formData.get("source") ?? "OUTRO") as any,
        stage: "NEW",
        interest: String(formData.get("interest") ?? "").trim() || null,
      },
    });
    await prisma.activity.create({
      data: { leadId: lead.id, type: "NOTE", payload: { note: "Lead criado manualmente no painel", by: author(ctx) } },
    });
    newLeadId = lead.id;
  } catch (e) {
    console.error("createManualLead:", e);
  }
  revalidatePath("/painel/leads");
  redirect(newLeadId ? `/painel/leads/${newLeadId}` : "/painel/leads/novo?erro=2");
}

/** Cria (ou redefine) o acesso do CLIENTE ao portal — gerente ou admin.
 *  O vínculo é pelo e-mail do contato; cliente entra no /login e cai no /cliente. */
export async function upsertClientAccess(formData: FormData) {
  const ctx = await requireManagerUp();
  const leadId = String(formData.get("leadId") ?? "");
  const pass = String(formData.get("password") ?? "");
  if (pass.length < 6) redirect(`/painel/leads/${leadId}?cliente=senha`);

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ctx.org.id },
      include: { contact: { select: { id: true, name: true, email: true } } },
    });
    if (!lead) redirect("/painel/leads");
    const email = lead!.contact.email?.trim().toLowerCase();
    if (!email) redirect(`/painel/leads/${leadId}?cliente=sememail`);

    const { hashPassword } = await import("@/lib/auth");
    const existing = await prisma.user.findFirst({
      where: { organizationId: ctx.org.id, email: email! },
    });
    if (existing && existing.role !== "CLIENT") {
      // e-mail já pertence a alguém do time — não pode virar cliente
      redirect(`/painel/leads/${leadId}?cliente=conflito`);
    }
    if (existing) {
      await prisma.user.update({ where: { id: existing!.id }, data: { passHash: hashPassword(pass), isActive: true } });
    } else {
      await prisma.user.create({
        data: {
          organizationId: ctx.org.id, email: email!, name: lead!.contact.name,
          role: "CLIENT", passHash: hashPassword(pass),
        },
      });
    }
    await prisma.activity.create({
      data: { leadId, type: "NOTE", payload: { note: "Acesso ao Portal do Cliente criado/atualizado", by: author(ctx) } },
    });
  } catch (e) {
    rethrowRedirect2(e);
    console.error("upsertClientAccess:", e);
    redirect(`/painel/leads/${leadId}?cliente=erro`);
  }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}?cliente=ok`);
}

const rethrowRedirect2 = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};

/** Objeções mapeadas do cliente — a "munição" do corretor. Corretor só nos próprios leads. */
export async function saveObjections(formData: FormData) {
  const ctx = await requirePanel();
  const leadId = String(formData.get("leadId") ?? "");
  const objections = String(formData.get("objections") ?? "").trim().slice(0, 2000) || null;
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ctx.org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
      select: { id: true },
    });
    if (lead) {
      await prisma.lead.update({ where: { id: lead.id }, data: { objections } });
      await prisma.activity.create({
        data: { leadId, type: "NOTE", payload: { note: "Objeções do cliente atualizadas", by: author(ctx) } },
      });
    }
  } catch (e) { console.error("saveObjections:", e); }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}`);
}
