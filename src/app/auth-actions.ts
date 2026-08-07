"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession, setTenantPreview } from "@/lib/auth";

/** redirect() lança exceção de controle; se cair num catch, precisa ser relançada. */
const rethrowRedirect = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "imobiliaria";

/** Cadastro self-service: cria o tenant completo e loga o admin. */
export async function createTenant(formData: FormData) {
  if (!process.env.DATABASE_URL) redirect("/criar?erro=demo");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pass = String(formData.get("password") ?? "");
  const wantedSlug = slugify(String(formData.get("slug") ?? "") || name);
  const plan = String(formData.get("plan") ?? "STARTER");

  if (!name || !email.includes("@") || pass.length < 6) redirect("/criar?erro=campos");

  try {
    // slug único
    let slug = wantedSlug;
    for (let i = 2; await prisma.organization.findUnique({ where: { slug } }); i++) {
      slug = `${wantedSlug}-${i}`;
    }

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
        panelPassHash: hashPassword(pass),
        subscription: {
          create: { plan: plan as any, status: "TRIALING" },
        },
        users: {
          create: { email, name: "Administrador", role: "ORG_ADMIN" },
        },
      },
    });

    setTenantPreview(org.slug);
    createSession({ orgId: org.id, email });
  } catch (e) {
    rethrowRedirect(e);
    console.error("createTenant:", e);
    redirect("/criar?erro=interno");
  }

  redirect("/painel?bemvindo=1");
}

/** Login do painel: pelo E-MAIL do admin (slug é opcional — só para
 *  desempate se o mesmo e-mail administrar mais de uma imobiliária,
 *  ou para o acesso master escolher o tenant). */
export async function login(formData: FormData) {
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const pass = String(formData.get("password") ?? "");
  if (!email || !pass) redirect("/login?erro=1");

  try {
    const org = slugRaw
      ? await prisma.organization.findUnique({ where: { slug: slugify(slugRaw) } })
      : await prisma.organization.findFirst({
          where: { adminEmail: email },
          orderBy: { createdAt: "asc" },
        });
    if (!org) redirect("/login?erro=1");

    const masterOk =
      process.env.PAINEL_USER && process.env.PAINEL_PASS &&
      email === String(process.env.PAINEL_USER).toLowerCase() &&
      pass === process.env.PAINEL_PASS;

    const tenantOk =
      org!.adminEmail?.toLowerCase() === email &&
      verifyPassword(pass, org!.panelPassHash);

    if (!masterOk && !tenantOk) redirect("/login?erro=1");

    setTenantPreview(org!.slug);
    createSession({ orgId: org!.id, email, master: Boolean(masterOk) });
  } catch (e) {
    rethrowRedirect(e);
    console.error("login:", e);
    redirect("/login?erro=1");
  }
  redirect("/painel");
}

export async function logout() {
  destroySession();
  redirect("/login");
}
