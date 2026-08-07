"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import { getStripe, stripeEnabled, planPriceId, baseUrl } from "@/lib/stripe";
import { TRIAL_DAYS } from "@/lib/plans";

const rethrowRedirect = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};

/** Abre o Stripe Checkout para assinar o plano escolhido.
 *  Se ainda restar trial interno (≥ 3 dias), o cartão é salvo agora e a
 *  primeira cobrança acontece só no fim do trial. */
export async function startCheckout(formData: FormData) {
  const ctx = await requireAdmin();
  if (!stripeEnabled()) redirect("/painel/assinatura?stripe=off");

  const plan = String(formData.get("plan") ?? "");
  const priceId = planPriceId(plan);
  if (!priceId) redirect("/painel/assinatura?stripe=preco");

  let checkoutUrl: string | null = null;
  try {
    const stripe = getStripe();
    const sub = await prisma.subscription.findUnique({ where: { organizationId: ctx.org.id } });
    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id }, select: { name: true, slug: true, adminEmail: true },
    });

    // Cliente Stripe: reaproveita ou cria (1 customer por organização)
    let customerId = sub?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org?.name ?? ctx.org.name,
        email: org?.adminEmail ?? ctx.email,
        metadata: { organizationId: ctx.org.id, slug: org?.slug ?? "" },
      });
      customerId = customer.id;
      await prisma.subscription.upsert({
        where: { organizationId: ctx.org.id },
        update: { stripeCustomerId: customerId },
        create: { organizationId: ctx.org.id, plan: "STARTER", status: "TRIALING", stripeCustomerId: customerId },
      });
    }

    // Trial restante do nosso lado vira trial do Stripe (mínimo 3 dias p/ valer a pena)
    const createdAt = sub?.createdAt ?? new Date();
    const trialEndMs = +createdAt + TRIAL_DAYS * 86400000;
    const trialDaysLeft = Math.max(0, Math.ceil((trialEndMs - Date.now()) / 86400000));
    const useTrial = sub?.status === "TRIALING" && trialDaysLeft >= 3;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: ctx.org.id,
      metadata: { organizationId: ctx.org.id, plan },
      subscription_data: {
        metadata: { organizationId: ctx.org.id },
        ...(useTrial ? { trial_end: Math.floor(trialEndMs / 1000) } : {}),
      },
      allow_promotion_codes: true,
      locale: "pt-BR",
      success_url: `${baseUrl()}/painel/assinatura?sucesso=1`,
      cancel_url: `${baseUrl()}/painel/assinatura?cancelado=1`,
    });
    checkoutUrl = session.url;
  } catch (e) {
    rethrowRedirect(e);
    console.error("startCheckout:", e);
    redirect("/painel/assinatura?stripe=erro");
  }
  redirect(checkoutUrl ?? "/painel/assinatura?stripe=erro");
}

/** Portal de cobrança do Stripe: trocar cartão, ver faturas, cancelar. */
export async function openBillingPortal() {
  const ctx = await requireAdmin();
  if (!stripeEnabled()) redirect("/painel/assinatura?stripe=off");

  let portalUrl: string | null = null;
  try {
    const sub = await prisma.subscription.findUnique({ where: { organizationId: ctx.org.id } });
    if (!sub?.stripeCustomerId) redirect("/painel/assinatura?stripe=semcliente");
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub!.stripeCustomerId!,
      return_url: `${baseUrl()}/painel/assinatura`,
    });
    portalUrl = session.url;
  } catch (e) {
    rethrowRedirect(e);
    console.error("openBillingPortal:", e);
    redirect("/painel/assinatura?stripe=erro");
  }
  redirect(portalUrl ?? "/painel/assinatura?stripe=erro");
}
