"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePanel, requireManagerUp, type PanelContext } from "@/lib/perm";
import { calcInitialScore } from "@/lib/score";
import { rethrowRedirect } from "@/lib/redirect";

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
    const score = calcInitialScore({
      propertyId: propertyOk?.id ?? null,
      source: String(formData.get("source") ?? "OUTRO"),
      email: contact.email,
      message: String(formData.get("interest") ?? ""),
    });
    const lead = await prisma.lead.create({
      data: {
        organizationId: ctx.org.id,
        contactId: contact.id,
        agentId: agentOk?.id ?? null,
        propertyId: propertyOk?.id ?? null,
        source: String(formData.get("source") ?? "OUTRO") as any,
        stage: "NEW",
        interest: String(formData.get("interest") ?? "").trim() || null,
        score,
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
    // Vínculo User↔Contact (contactId é UNIQUE): só liga se o contato ainda não pertence a outro usuário
    const contactTaken = await prisma.user.findFirst({
      where: { contactId: lead!.contact.id, ...(existing ? { id: { not: existing.id } } : {}) },
      select: { id: true },
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing!.id },
        data: {
          passHash: hashPassword(pass), isActive: true,
          ...(existing!.contactId || contactTaken ? {} : { contactId: lead!.contact.id }),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          organizationId: ctx.org.id, email: email!, name: lead!.contact.name,
          role: "CLIENT", passHash: hashPassword(pass),
          ...(contactTaken ? {} : { contactId: lead!.contact.id }),
        },
      });
    }
    await prisma.activity.create({
      data: { leadId, type: "NOTE", payload: { note: "Acesso ao Portal do Cliente criado/atualizado", by: author(ctx) } },
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("upsertClientAccess:", e);
    redirect(`/painel/leads/${leadId}?cliente=erro`);
  }
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}?cliente=ok`);
}

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

/* ---------- TAREFAS / FOLLOW-UP (mercado A2) ---------- */

/** Cria a tarefa de próximo contato do lead. Corretor só nos PRÓPRIOS leads. */
export async function createTask(formData: FormData) {
  const ctx = await requirePanel();
  const leadId = String(formData.get("leadId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (!leadId || !title || !dueAt || isNaN(+dueAt)) redirect(`/painel/leads/${leadId}?tarefa=campos`);

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: ctx.org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
      select: { id: true, agentId: true },
    });
    if (!lead) redirect("/painel/leads");

    await prisma.task.create({
      data: {
        organizationId: ctx.org.id,
        leadId: lead!.id,
        agentId: ctx.isAgent ? ctx.agentId : lead!.agentId ?? null,
        title,
        dueAt: dueAt!,
        createdBy: author(ctx),
      },
    });
    await prisma.activity.create({
      data: { leadId: lead!.id, type: "NOTE", payload: { note: `Tarefa criada: ${title}`, by: author(ctx) } },
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("createTask:", e);
    redirect(`/painel/leads/${leadId}?tarefa=erro`);
  }
  revalidatePath(`/painel/leads/${leadId}`);
  revalidatePath("/painel");
  redirect(`/painel/leads/${leadId}?tarefa=ok`);
}

/** Conclui (ou reabre) uma tarefa. Posse escopada por tenant e por corretor. */
export async function toggleTask(formData: FormData) {
  const ctx = await requirePanel();
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "") === "painel" ? "/painel" : null;
  let leadId = "";
  try {
    const task = await prisma.task.findFirst({
      where: { id, organizationId: ctx.org.id, ...(ctx.isAgent ? { agentId: ctx.agentId ?? "-" } : {}) },
      select: { id: true, leadId: true, doneAt: true },
    });
    if (!task) redirect(back ?? "/painel/leads");
    leadId = task!.leadId;
    await prisma.task.update({
      where: { id: task!.id },
      data: { doneAt: task!.doneAt ? null : new Date() },
    });
  } catch (e) {
    rethrowRedirect(e);
    console.error("toggleTask:", e);
  }
  revalidatePath("/painel");
  if (back) redirect(back);
  revalidatePath(`/painel/leads/${leadId}`);
  redirect(`/painel/leads/${leadId}`);
}
