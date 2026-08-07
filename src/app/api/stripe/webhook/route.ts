/**
 * WEBHOOK DO STRIPE — mantém a assinatura do tenant em sincronia sozinha.
 * Endpoint público (o Stripe chama): POST /api/stripe/webhook
 * A segurança vem da verificação de assinatura (STRIPE_WEBHOOK_SECRET).
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeEnabled, priceToPlan, mapStripeStatus, subPeriodEnd } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** Aplica o estado de uma subscription do Stripe na Subscription do tenant. */
async function applySubscription(organizationId: string, sub: Stripe.Subscription) {
  const plan = priceToPlan(sub.items?.data?.[0]?.price?.id);
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      ...(plan ? { plan: plan as any } : {}),
      status: mapStripeStatus(sub.status),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      currentPeriodEnd: subPeriodEnd(sub),
    },
  });
}

/** Descobre o tenant dono de uma subscription do Stripe. */
async function findOrgId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.organizationId) return sub.metadata.organizationId;
  const bySub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id }, select: { organizationId: true },
  });
  if (bySub) return bySub.organizationId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const byCustomer = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId }, select: { organizationId: true },
  });
  return byCustomer?.organizationId ?? null;
}

export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("stripe não configurado", { status: 400 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text(); // corpo BRUTO — obrigatório para a assinatura bater

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      body, signature, process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    console.error("stripe webhook assinatura inválida:", e);
    return new NextResponse("assinatura inválida", { status: 400 });
  }

  try {
    switch (event.type) {
      // Pagamento/checkout concluído → ativa o plano na hora
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orgId = s.metadata?.organizationId ?? s.client_reference_id;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (orgId && subId) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          await applySubscription(orgId, sub);
        }
        break;
      }

      // Upgrade/downgrade, renovação, trial→ativo, cancelamento agendado...
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = await findOrgId(sub);
        if (orgId) await applySubscription(orgId, sub);
        break;
      }

      // Cobrança falhou → marca PAST_DUE (o painel pode avisar o cliente)
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (customerId) {
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: customerId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }

      default:
        // eventos não tratados são só confirmados (200) — o Stripe para de reenviar
        break;
    }
  } catch (e) {
    console.error(`stripe webhook (${event.type}):`, e);
    // 500 faz o Stripe reenviar depois — bom para falha temporária de banco
    return new NextResponse("erro interno", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
