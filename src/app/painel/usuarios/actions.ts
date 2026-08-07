"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import { hashPassword } from "@/lib/auth";
import { getPlan } from "@/lib/plans";

const rethrowRedirect = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};

const PANEL_ROLES = ["ORG_ADMIN", "MANAGER", "AGENT"] as const;

/** Cria um usuário do painel. Se for corretor, vincula (ou cria) o perfil Agent. */
export async function createUser(formData: FormData) {
  const ctx = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pass = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "AGENT");
  const agentLink = String(formData.get("agentLink") ?? "auto"); // "auto" | id de Agent existente

  if (!name || !email.includes("@")) redirect("/painel/usuarios?erro=campos");
  if (pass.length < 6) redirect("/painel/usuarios?erro=senha");
  if (!PANEL_ROLES.includes(role as any)) redirect("/painel/usuarios?erro=campos");

  // Enforcement do plano: limite de usuários ativos (fora do try — redirect!)
  let atLimit = false;
  let emailTaken = false;
  try {
    const [sub, count, existing] = await Promise.all([
      prisma.subscription.findUnique({ where: { organizationId: ctx.org.id } }),
      prisma.user.count({ where: { organizationId: ctx.org.id, isActive: true, role: { in: PANEL_ROLES as any } } }),
      prisma.user.findFirst({ where: { organizationId: ctx.org.id, email } }),
    ]);
    atLimit = count >= getPlan(sub?.plan).maxUsers;
    emailTaken = Boolean(existing);
  } catch (e) { console.error("createUser(pre):", e); }
  if (atLimit) redirect("/painel/assinatura?limite=usuarios");
  if (emailTaken) redirect("/painel/usuarios?erro=email");

  try {
    const user = await prisma.user.create({
      data: {
        organizationId: ctx.org.id,
        name, email,
        role: role as any,
        passHash: hashPassword(pass),
      },
    });

    // Corretor precisa de um perfil comercial (Agent) para receber leads/visitas
    if (role === "AGENT") {
      if (agentLink && agentLink !== "auto") {
        // Blindagem: só vincula Agent DESTE tenant e ainda sem usuário
        const agentOk = await prisma.agent.findFirst({
          where: { id: agentLink, organizationId: ctx.org.id, userId: null },
          select: { id: true },
        });
        if (agentOk) {
          await prisma.agent.update({ where: { id: agentOk.id }, data: { userId: user.id } });
        }
      } else {
        await prisma.agent.create({
          data: { organizationId: ctx.org.id, userId: user.id, name, email, isFeatured: false },
        });
      }
    }
  } catch (e) {
    rethrowRedirect(e);
    console.error("createUser:", e);
    redirect("/painel/usuarios?erro=interno");
  }
  revalidatePath("/painel/usuarios");
  redirect("/painel/usuarios?salvo=1");
}

/** Ativa/desativa o acesso de um usuário (não apaga histórico). */
export async function toggleUser(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  try {
    const user = await prisma.user.findFirst({ where: { id, organizationId: ctx.org.id } });
    if (!user) redirect("/painel/usuarios");

    // Não pode se trancar para fora nem desativar o último admin ativo
    const isSelf = ctx.userId === user!.id || (!ctx.master && ctx.email === user!.email.toLowerCase());
    if (user!.isActive && isSelf) redirect("/painel/usuarios?erro=proprio");
    if (user!.isActive && user!.role === "ORG_ADMIN") {
      const admins = await prisma.user.count({
        where: { organizationId: ctx.org.id, role: "ORG_ADMIN", isActive: true },
      });
      if (admins <= 1) redirect("/painel/usuarios?erro=ultimoadmin");
    }

    await prisma.user.update({ where: { id: user!.id }, data: { isActive: !user!.isActive } });
  } catch (e) {
    rethrowRedirect(e);
    console.error("toggleUser:", e);
  }
  revalidatePath("/painel/usuarios");
  redirect("/painel/usuarios");
}

/** Admin define uma nova senha para o usuário (esqueci a senha, etc.). */
export async function resetUserPassword(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const pass = String(formData.get("password") ?? "");
  if (pass.length < 6) redirect("/painel/usuarios?erro=senha");

  try {
    const user = await prisma.user.findFirst({ where: { id, organizationId: ctx.org.id } });
    if (!user) redirect("/painel/usuarios");

    const passHash = hashPassword(pass);
    await prisma.user.update({ where: { id: user!.id }, data: { passHash } });

    // Mantém o login legado em sincronia se for o admin principal
    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id }, select: { adminEmail: true },
    });
    if (org?.adminEmail?.toLowerCase() === user!.email.toLowerCase()) {
      await prisma.organization.update({ where: { id: ctx.org.id }, data: { panelPassHash: passHash } });
    }
  } catch (e) {
    rethrowRedirect(e);
    console.error("resetUserPassword:", e);
    redirect("/painel/usuarios?erro=interno");
  }
  revalidatePath("/painel/usuarios");
  redirect("/painel/usuarios?senha=1");
}
