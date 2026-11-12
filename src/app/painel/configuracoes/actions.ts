"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import type { FinancingRate } from "@/lib/financing";
import { allow } from "@/lib/ratelimit";
import {
  addDomainToProject, domainsEnabled, getDomainStatus, isReservedHost, normalizeHost,
  removeDomainFromProject, verifyDomainOnProject,
} from "@/lib/vercel-domains";

export async function updateOrganization(formData: FormData) {
  const { org } = await requireAdmin();

  try {
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: String(formData.get("name") ?? org.name).trim() || org.name,
        logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
        themeBrass: String(formData.get("themeBrass") ?? "#c6a15b"),
        themeInk: String(formData.get("themeInk") ?? "#17130e"),
        themeCream: String(formData.get("themeCream") ?? "#f4efe4"),
        creci: String(formData.get("creci") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        city: String(formData.get("city") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        address: String(formData.get("address") ?? "").trim() || null,
      },
    });
  } catch (e) {
    console.error("updateOrganization:", e);
  }
  revalidatePath("/", "layout");
  redirect("/painel/configuracoes?salvo=1");
}

/** Gera (ou regenera) o token secreto do feed XML de portais.
 *  Regenerar INVALIDA as URLs antigas — reconfigurar nos portais. */
export async function regenerateFeedToken() {
  const { org } = await requireAdmin();
  try {
    const { randomBytes } = await import("node:crypto");
    await prisma.organization.update({
      where: { id: org.id },
      data: { feedToken: randomBytes(16).toString("hex") },
    });
  } catch (e) {
    console.error("regenerateFeedToken:", e);
  }
  revalidatePath("/painel/configuracoes");
  redirect("/painel/configuracoes?salvo=1");
}

export async function saveFinancingRates(formData: FormData) {
  const { org } = await requireAdmin();

  const rates: FinancingRate[] = [];
  for (let idx = 0; idx < 10; idx++) {
    const banco = String(formData.get(`banco_${idx}`) ?? "").trim().slice(0, 40);
    const taxa = Number(formData.get(`taxa_${idx}`) ?? "");
    if (!banco || !taxa) continue;
    if (taxa < 1 || taxa > 30) continue;
    rates.push({ banco, taxa });
  }

  try {
    await prisma.organization.update({ where: { id: org.id }, data: { financingRates: rates } });
  } catch (e) {
    console.error("saveFinancingRates:", e);
  }
  revalidatePath("/painel/configuracoes");
  redirect("/painel/configuracoes?salvo=1");
}


/* ---------- DOMÍNIO PRÓPRIO DO TENANT (API da Vercel — veja DOMINIOS.md) ---------- */

const MAX_DOMAINS = 3;
const domBack = (q: string) => `/painel/configuracoes?${q}#dominio`;
const safeCode = (c?: string) => String(c ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);

export async function addTenantDomain(formData: FormData) {
  const { org } = await requireAdmin();
  const host = normalizeHost(String(formData.get("host") ?? ""));
  if (!host) redirect(domBack("dom=invalido"));
  if (isReservedHost(host!, process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000")) redirect(domBack("dom=reservado"));
  if (!domainsEnabled()) redirect(domBack("dom=desativado"));
  if (!(await allow(`domain:org:${org.id}`, 10, 3600))) redirect(domBack("dom=limite"));

  // redirect() fora do try: guardamos o resultado e redirecionamos no fim.
  let result = "ok";
  let code = "";
  try {
    const mine = await prisma.domain.count({ where: { organizationId: org.id } });
    const owner = await prisma.domain.findUnique({ where: { host: host! }, select: { organizationId: true } });
    if (owner) {
      result = owner.organizationId === org.id ? "duplicado" : "emuso";
    } else if (mine >= MAX_DOMAINS) {
      result = "max";
    } else {
      const r = await addDomainToProject(host!);
      if (!r.ok) {
        result = "vercel";
        code = safeCode(r.error);
      } else {
        try {
          await prisma.domain.create({ data: { host: host!, organizationId: org.id, isPrimary: false } });
        } catch (e) {
          // Corrida (outro tenant gravou o mesmo host): só desfaz na Vercel se NINGUÉM ficou com ele.
          console.error("addTenantDomain(create):", e);
          const nowOwner = await prisma.domain.findUnique({ where: { host: host! }, select: { id: true } });
          if (!nowOwner) await removeDomainFromProject(host!);
          result = "emuso";
        }
      }
    }
  } catch (e) {
    console.error("addTenantDomain:", e);
    result = "interno";
  }
  revalidatePath("/painel/configuracoes");
  redirect(domBack(`dom=${result}${code ? `&c=${code}` : ""}`));
}

export async function verifyTenantDomain(formData: FormData) {
  const { org } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let result = "interno";
  try {
    const d = await prisma.domain.findFirst({ where: { id, organizationId: org.id } });
    if (!d) {
      result = "naoencontrado";
    } else {
      await verifyDomainOnProject(d.host); // tenta (re)verificar a posse; o resultado vem do status abaixo
      const st = await getDomainStatus(d.host);
      if (st.verified && st.misconfigured === false) {
        const hasPrimary = await prisma.domain.count({ where: { organizationId: org.id, isPrimary: true } });
        if (!hasPrimary) await prisma.domain.update({ where: { id: d.id }, data: { isPrimary: true } });
        result = "ativo";
      } else {
        result = st.verified ? "dns" : "txt";
      }
    }
  } catch (e) {
    console.error("verifyTenantDomain:", e);
  }
  revalidatePath("/painel/configuracoes");
  redirect(domBack(`dom=${result}`));
}

export async function removeTenantDomain(formData: FormData) {
  const { org } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let result = "removido";
  try {
    const d = await prisma.domain.findFirst({ where: { id, organizationId: org.id } });
    if (!d) {
      result = "naoencontrado";
    } else {
      await removeDomainFromProject(d.host);
      await prisma.domain.delete({ where: { id: d.id } });
    }
  } catch (e) {
    console.error("removeTenantDomain:", e);
    result = "interno";
  }
  revalidatePath("/painel/configuracoes");
  redirect(domBack(`dom=${result}`));
}
