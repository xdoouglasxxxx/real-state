# CLAUDE.md — Convenções do projeto (Imobiliária OS / maison-saas)

Este arquivo orienta o Claude Code. Leia antes de qualquer edição.
`ROADMAP.md` (raiz) é a rota canônica do produto — consulte antes de propor
feature nova. `.clinerules/` espelha estas regras para o Cline: mudou aqui,
sincronize lá.

## O que é este projeto
SaaS multi-tenant para imobiliárias de alto padrão, EM PRODUÇÃO
(maisonstate.vercel.app): site público white-label + painel (CRM, agenda,
financeiro, locação, contratos, documentos) + Portal do Corretor + Portal do
Cliente/Proprietário (v2, set/2026). Stack: Next.js 14 App Router + TypeScript
+ Prisma 5 + Postgres (Supabase, pooler 6543) + Stripe + Vercel (gru1).
Dono: Douglas (Windows + PowerShell).

## REGRAS INEGOCIÁVEIS
1. **Banco muda por SQL numerado em `database/`** (hoje até o 23), executado
   MANUALMENTE pelo Douglas no Supabase — staging antes de produção, e SEMPRE
   antes do push que depende do schema novo (coluna faltando quebra o Prisma
   em produção, inclusive login). Você NÃO altera `prisma/schema.prisma` nem
   cria migração por conta própria; com **autorização explícita do Douglas na
   conversa**, pode redigir o próximo `database/NN_*.sql` (idempotente, padrão
   dos anteriores) e commitar o schema junto. Se um fix exigir coluna nova sem
   essa autorização: PARE e avise. Após schema novo: `npx prisma generate`.
2. **NUNCA** adicionar dependências sem aprovação explícita. O stack é enxuto
   de propósito; quase tudo se resolve com Node/Web APIs nativas.
3. **Estilo = design system + Tailwind com tokens do tema.**
   - Classes do design system em `src/app/globals.css` para padrões repetidos:
     `.kpi(s) .ficha-box .pform .pgrid(.span2/3/4) .pill .table .meta-bar
     .btn-solid .btn-outline .pform-error .ok .nav-badge .panel-link .timeline`.
   - Utilitárias do Tailwind LIBERADAS para composição local (layout,
     espaçamento) e cores DO TEMA — `bg-ink`, `text-brass`, `bg-cream`,
     `border-stone` etc. já mapeadas em `tailwind.config.ts` para as CSS vars
     do tenant.
   - **PROIBIDO hex arbitrário** (`bg-[#c6a15b]`, `text-[#333]`): quebra o
     white-label. Cor nova = token no `:root` do globals.css + tailwind.config.
   - PROIBIDO Shadcn, lucide ou qualquer lib de UI/ícones sem aprovação.
4. **Push é manual por padrão** — pare após commitar; só dê push com ordem
   explícita do Douglas na conversa (aí pode sincronizar `main` e
   `staging-maison`, local e origin, por fast-forward). Commits temáticos,
   mensagem longa via arquivo (`Write` + `git commit -F arquivo`).
5. Terminal é **PowerShell**: sem `&&` (use `;`), sem heredoc bash, comandos
   curtos (parser trava acima de ~965 bytes).
6. Não tocar em `legacy/` nem criar arquivos soltos na raiz (legítimos:
   `middleware.ts`, `next-env.d.ts`, `tailwind.config.ts`,
   `playwright.config.ts`, `CLAUDE.md`, `ROADMAP.md`, docs).
7. **Dados de teste em produção**: só sintéticos (padrão `cliente@teste.com`
   dos seeds em `scripts/`), marcados como teste, e LIMPOS ao final do ciclo
   (SELECT de conferência antes de qualquer DELETE).

## Armadilhas conhecidas do codebase
- `page.tsx` só exporta `default` / `dynamic` / `metadata`. Arquivos
  `"use server"` só exportam **função async** — constantes compartilhadas vão
  para `src/lib/` (ex.: `doc-kinds.ts`, labels em `data.ts`).
- `redirect()` do Next **lança exceção**: em try/catch, a primeira linha do
  catch é `rethrowRedirect(e)` (`src/lib/redirect.ts`).
- Campos que parecem string podem ser **enum do Prisma** (`DocKind`,
  `ContactKind`, `LeadStage`, `ProposalStatus`...) — confira o schema.
  Progresso de `LeadStage` compara por ÍNDICE em array espelhando o enum,
  nunca por ordem alfabética.
- `Decimal` do Prisma: grave como string (`amount.toFixed(2)`), renderize com
  `brl(Number(x))`. `MoneyInput` submete texto formatado ("R$ 1.250,50") →
  parse no servidor: `Number(String(v).replace(/[^\d,]/g, "").replace(",", "."))`.
- Playwright (`tests/e2e/`) tem `baseURL` de **PRODUÇÃO** por padrão — para
  local use `BASE_URL=http://localhost:3000`; nunca teste de escrita contra
  produção sem autorização.
- Warnings git "LF will be replaced by CRLF" são ruído esperado no Windows;
  para revisar diff real de arquivo reescrito use `git diff -w`.
- Build local pode falhar por env ausente (ex.: Stripe) — **a Vercel é a
  juíza**; valide com `npx tsc --noEmit` e distinga erro pré-existente de
  regressão.

## Segurança (padrões obrigatórios em toda action/query)
- Toda query filtra por `organizationId`. Toda mutação valida posse ANTES:
  `findFirst({ where: { id, organizationId: ctx.org.id } })` — nunca confie
  em id vindo de form/URL.
- Guardas de papel (`src/lib/perm.ts`): `requirePanel` / `requireManagerUp` /
  `requireAdmin`; corretor (`ctx.isAgent`) só enxerga `agentId: ctx.agentId`;
  Portal do Cliente (CLIENT/OWNER): `requireClientPortal` — Contact via
  `session.contactId` (fallback e-mail), queries com
  `contactId: { in: ctx.contactIds }`.
- Portal do Cliente NUNCA recebe: anotações internas (Activity NOTE,
  Visit.notes), autoria (`payload.by`), comissões, paymentMethod/cashAmount/
  coafReportedAt, adminFee/repasse de terceiros. `select` explícito sempre —
  nunca `include` cru.
- Autoria nas timelines: `by` = `ctx.master ? "Master (plataforma)" :
  ctx.email` (ação do cliente: `"Cliente (portal)"`).
- Segredos só no servidor; downloads de documentos por URL assinada
  (`storage.ts`); senha com helpers de `auth.ts` (scrypt + timingSafe) —
  nunca reimplemente.
- Gap conhecido (backlog C1 do ROADMAP): rate limit em login/createLead e
  verificação de RLS ativo no Supabase.

## Regras de negócio vigentes
- **Rodízio de leads:** imóvel com corretor ATIVO vinculado → lead vai para
  ele (`fromProperty`); rodízio justo é fallback; timeline registra o motivo.
- **Lead de imóvel SOLD/RESERVED:** cria normalmente, mantém vínculo, nota
  automática de aviso (+ `wantSimilar`) e pill na ficha.
- **Lead manual:** "Perfil do contato" (BUYER/OWNER/BOTH); contato existente
  não tem o kind sobrescrito.
- Visitas só em imóveis disponíveis; datas passadas bloqueadas.
- **Portal do cliente:** proposta só em negociação ABERTA (não WON/LOST) do
  próprio contato; cria Proposal SENT e avança o funil para PROPOSAL com
  STAGE_CHANGE (único tipo que o portal exibe; NOTE é interna do painel).
- **Locação:** repasse ao proprietário SÓ após pagamento (aluguel − taxa adm).

## Fluxo de trabalho
- Antes de editar: `git status` limpo. Um tema por commit.
- Ao final de qualquer tarefa: `npx tsc --noEmit` e corrigir apenas erros
  causados pelos próprios diffs.
- Validações disponíveis: smoke do banco
  (`node --env-file=.env scripts/smoke-check.mjs`), E2E
  (`npx playwright test` com BASE_URL local), smoke manual (`npm run dev` +
  seeds de `scripts/`). CI: `.github/workflows/smoke.yml` (push main + diário).
- Grandes módulos/arquitetura seguem o `ROADMAP.md` e são combinados antes;
  aqui: fixes, refactors locais, auditorias, features aprovadas etapa a etapa.
