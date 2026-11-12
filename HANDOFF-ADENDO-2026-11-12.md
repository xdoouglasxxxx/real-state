# HANDOFF — ADENDO 12/11/2026 — Pacote de lançamento

Anexar junto de HANDOFF.md e HANDOFF-ADENDO-2026-08-07-noite.md.

## O que entrou (código pronto; depende de deploy + SQL 27 + contas externas)
- **Domínio próprio por tenant:** `src/lib/vercel-domains.ts` (API Vercel, tolerante a falha),
  `src/components/painel/DomainsSection.tsx`, actions `addTenantDomain/verifyTenantDomain/removeTenantDomain`
  em `painel/configuracoes/actions.ts`. `tenant.ts` trata www↔apex (exato tem prioridade).
- **Esqueci minha senha:** `/esqueci`, `/redefinir`, `reset-token.ts` (stateless), `mailer.ts` (Resend), `base-url.ts`.
- **Rate limit:** `ratelimit.ts` — `allow(chave, limite, janelaSeg)`, tabela `RateLimit` (database/27,
  fora do schema.prisma, fail-open). Em login, /criar, forms públicos, reset, domínio. Honeypot `website`.
- **database/27:** RateLimit + RLS ligado em toda tabela de `public`.
- **Metas:** `/painel/metas` (gerente+), grava `Goal` (meta da imobiliária = agentId null).
- **URL pública correta:** `public-url.ts` (`tenantBaseUrl`), sitemap/robots via `getBaseUrl()`, feed XML e
  Configurações corrigidos (antes montavam `slug.maisonstate.vercel.app`, inexistente).
- **notifyNewProposal** (portal do cliente → WhatsApp ao corretor); `notify.ts` refatorado (`sendWhatsApp`).
- **Correções:** assinatura do cookie em tempo constante (`auth.ts`); `redirect` engolido pelo catch na agenda.
- **Testes:** `npm run test:unit` (13 testes; também no CI `smoke.yml`).

## Armadilhas novas
- `rateLimit` e o código de domínio **nunca devem lançar**; mantenha fail-open/defensivo.
- Tabela nova por SQL → ligar RLS na própria migração. Tabela de infra pode ficar fora do schema.prisma
  se acessada só por `$queryRaw` (publicar código antes do SQL fica seguro).
- Nunca montar URL de tenant na mão: use `tenantBaseUrl()` / `getBaseUrl()`.

## Pendências que atravessam
- [ ] Deploy (staging → main) + `database/27` + checklist de LANCAMENTO.md
- [ ] Testar domínio com domínio descartável (integração Vercel nunca rodou ao vivo)
- [ ] Contas: Stripe · Meta · Resend · token Vercel · feed nos portais · 5 clientes
- [ ] Plano Vercel compatível com uso comercial · Supabase pago
- [ ] Próximas frentes: LGPD export/exclusão · A3 BI v2 (decisão sobre custo de mídia) · A4 SEO pro ·
      aceite eletrônico · log de auditoria
