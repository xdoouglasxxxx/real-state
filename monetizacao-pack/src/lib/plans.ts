/**
 * PLANOS — fonte única da verdade para preços, limites e features.
 * Alterou aqui, mudou em todo lugar: /criar, /painel/assinatura e enforcement.
 */

export type PlanId = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

export type PlanDef = {
  id: PlanId;
  label: string;
  price: number | null;        // null = sob consulta
  highlight?: boolean;
  maxProperties: number;        // Infinity = ilimitado
  maxUsers: number;
  extraUserPrice: number | null;// R$/mês por usuário extra (null = não vende)
  features: string[];
};

export const TRIAL_DAYS = 14;

export const PLANS: Record<PlanId, PlanDef> = {
  STARTER: {
    id: "STARTER", label: "Start", price: 149,
    maxProperties: 100, maxUsers: 2, extraUserPrice: null,
    features: ["Site profissional", "Até 100 imóveis", "2 usuários", "CRM básico + leads", "Blog"],
  },
  PRO: {
    id: "PRO", label: "Pro", price: 349, highlight: true,
    maxProperties: 1000, maxUsers: 10, extraUserPrice: 39,
    features: ["Tudo do Start", "Até 1.000 imóveis", "10 usuários (+R$39/extra)", "CRM completo + agenda", "Financeiro e documentos", "IA básica", "BI"],
  },
  BUSINESS: {
    id: "BUSINESS", label: "Business", price: 699,
    maxProperties: Infinity, maxUsers: Infinity, extraUserPrice: null,
    features: ["Tudo do Pro", "Imóveis e usuários ilimitados", "IA avançada", "Automações", "Multi-filiais", "Integrações e API completa", "White label parcial"],
  },
  ENTERPRISE: {
    id: "ENTERPRISE", label: "Enterprise", price: null,
    maxProperties: Infinity, maxUsers: Infinity, extraUserPrice: null,
    features: ["Tudo do Business", "SLA dedicado", "Onboarding assistido", "Customizações sob demanda"],
  },
};

export const getPlan = (id?: string | null): PlanDef =>
  PLANS[(id as PlanId) ?? "STARTER"] ?? PLANS.STARTER;

export const fmtPrice = (p: number | null) =>
  p === null ? "Sob consulta" : `R$ ${p}/mês`;

export const fmtLimit = (n: number) => (n === Infinity ? "Ilimitados" : String(n));
