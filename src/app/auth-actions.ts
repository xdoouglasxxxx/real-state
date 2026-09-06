"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword, verifyPassword, createSession, destroySession,
  setTenantPreview, getSession, timingSafeStringEqual, type SessionRole,
} from "@/lib/auth";
import { isValidEmail } from "@/lib/validators";
import { rethrowRedirect } from "@/lib/redirect";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "imobiliaria";

const PANEL_ROLES = ["ORG_ADMIN", "MANAGER", "AGENT"] as const;
const LOGIN_ROLES = ["ORG_ADMIN", "MANAGER", "AGENT", "CLIENT", "OWNER"] as const;

/** Cadastro self-service: cria o tenant completo e loga o admin. */
export async function createTenant(formData: FormData) {
  if (!process.env.DATABASE_URL) redirect("/criar?erro=demo");

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const pass = String(formData.get("password") ?? "").slice(0, 128);
  const wantedSlug = slugify(String(formData.get("slug") ?? "") || name);
  const plan = String(formData.get("plan") ?? "STARTER");

  if (!name || !isValidEmail(email) || pass.length < 6) redirect("/criar?erro=campos");

  try {
    // slug único
    let slug = wantedSlug;
    for (let i = 2; await prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${wantedSlug}-${i}`;
    }

    const passHash = hashPassword(pass);
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        creci: String(formData.get("creci") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        city: String(formData.get("city") ?? "").trim() || null,
        themeBrass: String(formData.get("themeBrass") ?? "#c6a15b"),
        themeInk: String(formData.get("themeInk") ?? "#17130e"),
        adminEmail: email,
        panelPassHash: passHash,
        subscription: {
          create: { plan: plan as any, status: "TRIALING" },
        },
        users: {
          create: { email, name: "Administrador", role: "ORG_ADMIN", passHash },
        },
      },
      include: { users: true },
    });

    const admin = org.users[0];
    setTenantPreview(org.slug);
    createSession({ orgId: org.id, email, userId: admin?.id, role: "ORG_ADMIN" });
  } catch (e) {
    rethrowRedirect(e);
    console.error("createTenant:", e);
    redirect("/criar?erro=interno");
  }

  redirect("/painel?bemvindo=1");
}

/** Login do painel — multiusuário.
 *  Qualquer usuário do tenant entra pelo próprio e-mail e senha.
 *  slug é opcional: só para desempate se o mesmo e-mail existir em mais de
 *  uma imobiliária, ou para o acesso master escolher o tenant. */
export async function login(formData: FormData) {
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pass = String(formData.get("password") ?? "");
  if (!email || !pass) redirect("/login?erro=1");

  let dest = "/painel";
  try {
    // ---- Acesso master da plataforma (entra em qualquer tenant) ----
    // C2: comparação timing-safe — === vaza informação de tempo char a char.
    const hasMasterCreds = Boolean(process.env.PAINEL_USER && process.env.PAINEL_PASS);
    const masterOk =
      hasMasterCreds &&
      timingSafeStringEqual(email, String(process.env.PAINEL_USER).toLowerCase()) &&
      timingSafeStringEqual(pass, String(process.env.PAINEL_PASS));

    if (masterOk) {
      const org = slugRaw
        ? await prisma.organization.findUnique({ where: { slug: slugify(slugRaw) } })
        : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
      if (!org) redirect("/login?erro=1");
      setTenantPreview(org!.slug);
      createSession({ orgId: org!.id, email, role: "ORG_ADMIN", master: true });
    } else {
      // ---- Usuário do tenant (admin, gerente ou corretor) ----
      const user = await prisma.user.findFirst({
        where: {
          email,
          isActive: true,
          role: { in: LOGIN_ROLES as any },
          ...(slugRaw ? { organization: { slug: slugify(slugRaw) } } : {}),
        },
        orderBy: { createdAt: "asc" },
        include: {
          organization: { select: { id: true, slug: true, adminEmail: true, panelPassHash: true } },
          agent: { select: { id: true } },
        },
      });
      if (!user) redirect("/login?erro=1");

      let valid = user!.passHash ? verifyPassword(pass, user!.passHash) : false;

      // Legado: admin criado antes do multiusuário guarda a senha na Organization.
      // Ao validar por lá, grava o hash no User (migração automática no 1º login).
      if (!valid && !user!.passHash &&
          user!.organization.adminEmail?.toLowerCase() === email &&
          verifyPassword(pass, user!.organization.panelPassHash)) {
        valid = true;
        await prisma.user.update({ where: { id: user!.id }, data: { passHash: hashPassword(pass) } });
      }

      if (!valid) redirect("/login?erro=1");

      setTenantPreview(user!.organization.slug);
      createSession({
        orgId: user!.organization.id,
        email,
        userId: user!.id,
        role: user!.role as SessionRole,
        agentId: user!.agent?.id ?? null,
        contactId: user!.contactId ?? null,
      });
      dest = user!.role === "CLIENT" || user!.role === "OWNER" ? "/cliente" : "/painel";
    }
  } catch (e) {
    rethrowRedirect(e);
    console.error("login:", e);
    redirect("/login?erro=1");
  }
  redirect(dest);
}

/** Minha conta: o usuário logado troca a própria senha.
 *  Serve painel E portal do cliente — o destino sai da ROLE da sessão
 *  (nunca de campo do form, que seria adulterável). */
export async function changePassword(formData: FormData) {
  const session = getSession();
  if (!session) redirect("/login");
  const base = session!.role === "CLIENT" || session!.role === "OWNER"
    ? "/cliente/portal/configuracoes" : "/painel/conta";
  if (session!.master) redirect(`${base}?erro=master`);

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 6) redirect(`${base}?erro=curta`);
  if (next !== confirm) redirect(`${base}?erro=confirma`);

  try {
    const user = session!.userId
      ? await prisma.user.findFirst({ where: { id: session!.userId, organizationId: session!.orgId } })
      : await prisma.user.findFirst({ where: { organizationId: session!.orgId, email: session!.email } });
    if (!user) redirect(`${base}?erro=atual`);

    const org = await prisma.organization.findUnique({
      where: { id: session!.orgId },
      select: { adminEmail: true, panelPassHash: true },
    });

    const currentOk = user!.passHash
      ? verifyPassword(current, user!.passHash)
      : verifyPassword(current, org?.panelPassHash); // legado sem hash no User
    if (!currentOk) redirect(`${base}?erro=atual`);

    const passHash = hashPassword(next);
    await prisma.user.update({ where: { id: user!.id }, data: { passHash } });

    // Mantém o login legado em sincronia quando quem troca é o admin principal
    if (org?.adminEmail?.toLowerCase() === user!.email.toLowerCase()) {
      await prisma.organization.update({ where: { id: session!.orgId }, data: { panelPassHash: passHash } });
    }
  } catch (e) {
    rethrowRedirect(e);
    console.error("changePassword:", e);
    redirect(`${base}?erro=interno`);
  }
  redirect(`${base}?salvo=1`);
}

export async function logout() {
  destroySession();
  redirect("/login");
}
