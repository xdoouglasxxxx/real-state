import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { getSubscriptionInfo } from "@/lib/data";
import { PLANS, getPlan, fmtPrice, fmtLimit, type PlanId } from "@/lib/plans";
import { stripeEnabled, planPriceId } from "@/lib/stripe";
import { startCheckout, openBillingPortal } from "./actions";

export const dynamic = "force-dynamic";

export default async function Assinatura({ searchParams }: { searchParams: { limite?: string; sucesso?: string; cancelado?: string; stripe?: string } }) {
  const { org } = await requireAdmin();
  const info = await getSubscriptionInfo(org.id);
  // Stripe ligado + tem customer? Mostra o portal de cobrança
  let hasStripeCustomer = false;
  if (stripeEnabled() && process.env.DATABASE_URL) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { organizationId: org.id }, select: { stripeCustomerId: true },
      });
      hasStripeCustomer = Boolean(sub?.stripeCustomerId);
    } catch {}
  }
  const current = getPlan(info.plan);
  const usagePct = current.maxProperties === Infinity
    ? 0 : Math.min(100, Math.round((100 * info.propertyCount) / current.maxProperties));

  return (
    <>
      <h1>Assinatura</h1>

      {searchParams.sucesso && (
        <p className="ok" style={{ marginBottom: "1rem" }}>
          ✔ Assinatura confirmada! O plano atualiza sozinho em instantes — se ainda aparecer o antigo, recarregue a página.
        </p>
      )}
      {searchParams.cancelado && (
        <p className="pform-error">Checkout cancelado — nada foi cobrado. Quando quiser, é só escolher o plano de novo.</p>
      )}
      {searchParams.stripe === "erro" && (
        <p className="pform-error">Não conseguimos abrir o pagamento agora. Tente de novo — se persistir, veja os Logs da Vercel.</p>
      )}
      {searchParams.limite === "usuarios" && (
        <p className="pform-error">
          Você atingiu o limite de {fmtLimit(current.maxUsers)} usuários do plano {current.label}.
          Faça upgrade para adicionar mais pessoas ao time.
        </p>
      )}
      {searchParams.limite === "imoveis" && (
        <p className="pform-error">
          Você atingiu o limite de {fmtLimit(current.maxProperties)} imóveis do plano {current.label}.
          Faça upgrade para continuar cadastrando — ou arquive imóveis antigos.
        </p>
      )}

      <div className="kpis">
        <div className="kpi">
          <strong>{current.label}</strong>
          <span>plano atual · {fmtPrice(current.price)}</span>
        </div>
        <div className="kpi">
          <strong>{info.status === "TRIALING" ? `${info.trialDaysLeft} dias` : "Ativa"}</strong>
          <span>{info.status === "TRIALING" ? "restantes de teste grátis" : "assinatura"}</span>
        </div>
        <div className="kpi">
          <strong>{info.propertyCount}<small style={{ fontSize: "1rem", color: "var(--stone)" }}> / {fmtLimit(current.maxProperties)}</small></strong>
          <span>imóveis do plano</span>
          {current.maxProperties !== Infinity && (
            <div className="meta-bar"><i style={{ width: `${usagePct}%`, background: usagePct > 85 ? "#c66" : "var(--brass)" }} /></div>
          )}
        </div>
        <div className="kpi">
          <strong>{info.userCount}<small style={{ fontSize: "1rem", color: "var(--stone)" }}> / {fmtLimit(current.maxUsers)}</small></strong>
          <span>usuários</span>
        </div>
      </div>

      <h2 style={{ margin: "1.6rem 0 1rem" }}>Planos</h2>
      <div className="pricing">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const isCurrent = id === info.plan;
          return (
            <div className={"price-card" + (p.highlight ? " hi" : "") + (isCurrent ? " current" : "")} key={id}>
              {p.highlight && <span className="price-tag">⭐ Mais vendido</span>}
              <h3>{p.label}</h3>
              <p className="price-value">{fmtPrice(p.price)}</p>
              <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {isCurrent ? (
                <span className="btn-outline price-btn" style={{ opacity: .5, cursor: "default" }}>Plano atual</span>
              ) : stripeEnabled() && planPriceId(id) ? (
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value={id} />
                  <button className={(p.highlight ? "btn-solid" : "btn-outline") + " price-btn"} type="submit">
                    Assinar {p.label}
                  </button>
                </form>
              ) : (
                <a className={(p.highlight ? "btn-solid" : "btn-outline") + " price-btn"}
                   href={`https://wa.me/5541999003524?text=${encodeURIComponent(`Quero o plano ${p.label} para ${org.name} (${org.slug})`)}`}
                   target="_blank" rel="noopener">
                  {p.price === null ? "Falar com vendas" : "Fazer upgrade"}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {hasStripeCustomer && (
        <form action={openBillingPortal} style={{ marginTop: "1.4rem" }}>
          <button className="btn-outline" type="submit">Gerenciar pagamento e faturas</button>
        </form>
      )}

      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1.2rem" }}>
        {stripeEnabled()
          ? "Pagamento seguro com cartão via Stripe. Assinando durante o teste grátis, o cartão fica salvo e a primeira cobrança acontece só no fim do trial. Cancele quando quiser em \u201cGerenciar pagamento\u201d."
          : "Pagamento com cartão (Stripe) ainda não configurado neste ambiente — por enquanto o upgrade é ativado pelo nosso time via WhatsApp."}
      </p>
    </>
  );
}
