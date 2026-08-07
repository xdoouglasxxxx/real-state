/**
 * STRIPE — cobrança de assinatura.
 *
 * Só liga quando as env vars existem (STRIPE_SECRET_KEY etc.) — sem elas,
 * o painel volta ao fallback de upgrade via WhatsApp. Guia: STRIPE.md.
 *
 * Nunca tocamos em dados de cartão: o checkout é a página hospedada do
 * próprio Stripe (o cartão nunca passa pelo nosso servidor).
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** true = Stripe configurado (chave secreta presente na Vercel) */
export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

/** Plano interno → price ID do Stripe (criados no dashboard, ver STRIPE.md) */
const PRICE_BY_PLAN: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PRO: process.env.STRIPE_PRICE_PRO,
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  // ENTERPRISE é sob consulta — sem checkout self-service
};

export const planPriceId = (plan: string): string | null =>
  PRICE_BY_PLAN[plan] ?? null;

export const priceToPlan = (priceId?: string | null): string | null => {
  if (!priceId) return null;
  for (const [plan, price] of Object.entries(PRICE_BY_PLAN)) {
    if (price === priceId) return plan;
  }
  return null;
};

/** Status do Stripe → enum SubStatus do banco */
export function mapStripeStatus(s: string): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" {
  switch (s) {
    case "trialing": return "TRIALING";
    case "active": return "ACTIVE";
    case "past_due":
    case "unpaid":
    case "incomplete": return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
    default: return "CANCELED";
  }
}

/** Fim do período atual — o campo mudou de lugar entre versões da API do Stripe */
export function subPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ts =
    (sub as any).current_period_end ??
    (sub as any).items?.data?.[0]?.current_period_end ??
    null;
  return ts ? new Date(ts * 1000) : null;
}

/** URL base para retorno do checkout/portal */
export const baseUrl = () =>
  `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "maisonstate.vercel.app"}`;
