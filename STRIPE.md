# STRIPE — Guia de ativação (passo a passo)

O código já está pronto e **desligado por padrão**: enquanto as variáveis não
existirem na Vercel, o painel continua mostrando o upgrade via WhatsApp.
Você pode fazer todo o roteiro abaixo em **modo teste** primeiro, sem risco.

> Segurança: nós nunca vemos nem guardamos dados de cartão. O checkout é a
> página do próprio Stripe — o cartão vai direto para eles.

---

## PARTE 1 — Conta e produtos (site do Stripe)

1. Crie a conta em **stripe.com** (país: Brasil, moeda BRL).
2. No topo do dashboard, deixe o seletor em **"Modo de teste"** (toggle laranja).
3. Menu **Catálogo de produtos → + Adicionar produto**. Crie 3 produtos,
   cada um com um preço **recorrente mensal em BRL**:

   | Produto  | Preço mensal |
   |----------|--------------|
   | Start    | R$ 149,00    |
   | Pro      | R$ 349,00    |
   | Business | R$ 699,00    |

   (Enterprise não entra — é "sob consulta" via WhatsApp, como hoje.)

4. Abra cada produto criado e copie o **ID do preço** — começa com `price_...`
   (cuidado: é o ID do PREÇO, não o do produto `prod_...`). Anote os 3.

## PARTE 2 — Chave secreta

5. Menu **Desenvolvedores → Chaves de API**. Copie a **chave secreta**
   (`sk_test_...` no modo teste). A publicável (`pk_...`) não é necessária —
   nosso checkout é hospedado pelo Stripe.

## PARTE 3 — Webhook (é o que atualiza o plano sozinho)

6. Menu **Desenvolvedores → Webhooks → + Adicionar endpoint**.
7. URL do endpoint:
   ```
   https://maisonstate.vercel.app/api/stripe/webhook
   ```
8. Em "Selecionar eventos", marque estes 4:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
9. Salve e copie o **Segredo de assinatura** do endpoint (`whsec_...`).

## PARTE 4 — Variáveis na Vercel

10. Vercel → projeto **maisonstate** → Settings → Environment Variables.
    Adicione (valores **sem aspas**, sem espaços, ambiente Production):

    | Nome                   | Valor            |
    |------------------------|------------------|
    | `STRIPE_SECRET_KEY`    | `sk_test_...`    |
    | `STRIPE_WEBHOOK_SECRET`| `whsec_...`      |
    | `STRIPE_PRICE_STARTER` | `price_...` (Start)    |
    | `STRIPE_PRICE_PRO`     | `price_...` (Pro)      |
    | `STRIPE_PRICE_BUSINESS`| `price_...` (Business) |

11. **REDEPLOY obrigatório** depois de salvar as variáveis
    (Deployments → ⋯ do último deploy → Redeploy).

## PARTE 5 — Testar (modo teste, sem dinheiro real)

12. Entre no painel como admin → **Assinatura**. Os botões agora dizem
    "Assinar Start/Pro/Business".
13. Clique em "Assinar Pro". Na página do Stripe, use o cartão de teste:
    - Número: `4242 4242 4242 4242`
    - Validade: qualquer data futura · CVC: qualquer 3 dígitos
14. Ao concluir, você volta ao painel com "✔ Assinatura confirmada".
    Em segundos o webhook atualiza o plano — recarregue e o card
    "plano atual" deve mostrar **Pro**.
15. O botão **"Gerenciar pagamento e faturas"** abre o portal do Stripe
    (trocar cartão, baixar faturas, cancelar).

### Como funciona o trial
Se a imobiliária ainda está no teste grátis (14 dias do cadastro) com **3+
dias restantes**, o checkout salva o cartão mas só cobra no fim do trial.
Com menos de 3 dias (ou trial vencido), cobra na hora.

## PARTE 6 — Ir para valer (quando quiser cobrar de verdade)

16. No Stripe: desligue o "Modo de teste", complete o cadastro da empresa
    (dados bancários para receber) e repita os passos 3–9 no modo real
    (produtos, chave `sk_live_...` e webhook geram valores NOVOS).
17. Troque as 5 variáveis na Vercel pelos valores do modo real + redeploy.

---

## Solução de problemas

- **Botões ainda mostram WhatsApp** → faltou variável ou faltou o redeploy.
- **"Não conseguimos abrir o pagamento"** → Vercel → Logs, procure
  `startCheckout:`. Causa comum: price ID errado (copiou `prod_` em vez de `price_`).
- **Paguei mas o plano não mudou** → Stripe → Desenvolvedores → Webhooks →
  seu endpoint → aba de tentativas. Erro 400 = `STRIPE_WEBHOOK_SECRET` errado
  ou sem redeploy. Nos Logs da Vercel, procure `stripe webhook`.
- Cancelamentos e falhas de cobrança também chegam pelo webhook: o status vira
  CANCELED / PAST_DUE sozinho no painel.
