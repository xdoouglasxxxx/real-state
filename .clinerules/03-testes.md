# TESTES — ESTADO REAL DO PROJETO

**Não existe Vitest nem suíte de unit tests configurada.** Não invente
`npm test` — o script não existe. A validação padrão é:

1. `npx tsc --noEmit` — obrigatório ao final de qualquer tarefa
2. `node --env-file=.env scripts/smoke-check.mjs` — smoke do banco/regras (ver 07)
3. Playwright E2E em `tests/e2e/` (ver 04)
4. Smoke manual: `npm run dev` + navegar o fluxo alterado

## SE FOR CRIAR UNIT TESTS

Adicionar Vitest é dependência nova → exige aprovação explícita do Douglas
ANTES (regra core). Se aprovado, priorize lógica pura já isolada em
`src/lib/`: `financing.ts`, `score.ts`, `format.ts`, `validators.ts`,
`assign.ts` (rodízio), `contract-render.ts`.

Estrutura AAA (Arrange, Act, Assert); testes determinísticos, isolados e
independentes de ordem.

## EDGE CASES DO DOMÍNIO

- valores BRL como texto formatado ("R$ 1.250,50") e Decimal do Prisma
- enums do Prisma (LeadStage, ProposalStatus...) — nunca comparar por ordem
  alfabética; use a ordem do funil espelhada em array
- contatos duplicados com mesmo e-mail no tenant (N:1 e-mail→Contact)
- sessões antigas sem campos novos no cookie (role, contactId) — fallbacks
- tenant não resolvido → DEMO_ORG (modo demonstração sem banco)
