# CLAUDE.md — Convenções do projeto (Imobiliária OS / maison-saas)

Este arquivo orienta o Claude Code. Leia antes de qualquer edição.

## O que é este projeto
SaaS multi-tenant para imobiliárias de alto padrão: site público + painel (CRM,
agenda, financeiro, documentos) + Portal do Corretor + Portal do Cliente.
Stack: Next.js 14 App Router + TypeScript + Prisma 5 + Postgres (Supabase) +
Vercel (gru1). Dono: Douglas (Windows + PowerShell).

## REGRAS INEGOCIÁVEIS
1. **NUNCA** alterar `prisma/schema.prisma`, criar migrações ou rodar SQL —
   mudanças de banco passam por outro canal (arquivos numerados em `database/`,
   executados manualmente no Supabase). Se um fix exigir coluna nova: PARE e avise.
2. **NUNCA** adicionar dependências sem aprovação explícita.
3. **CSS próprio** em `src/app/globals.css` (design system dark-luxury, dourado
   `--brass`). PROIBIDO introduzir Tailwind, Shadcn, lucide ou libs de UI.
   Classes existentes: `.kpi(s) .ficha-box .pform .pgrid(.span2/.span3/.span4)
   .pill .table .meta-bar .btn-solid .btn-outline .pform-error .ok .nav-badge`.
4. **Push é manual do Douglas** — pare após commitar. Commits temáticos, mensagem
   longa via arquivo (`Write` + `git commit -F arquivo` + `Remove-Item arquivo`).
5. Terminal é **PowerShell**: sem `&&` encadeando (use `;`), sem heredoc bash,
   comandos curtos (parser trava acima de ~965 bytes).
6. Não tocar em `legacy/` nem em arquivos soltos na raiz (só são legítimos:
   `middleware.ts`, `next-env.d.ts`, `tailwind.config.ts`, `CLAUDE.md`, docs).

## Armadilhas conhecidas do codebase
- `page.tsx` só exporta `default` / `dynamic` / `metadata` (build quebra com
  export extra). Arquivos `"use server"` só exportam **função async** —
  constantes compartilhadas vão para módulos em `src/lib/` (ex.: `doc-kinds.ts`).
- `redirect()` do Next **lança exceção**: nunca dentro de try/catch sem
  re-throw (padrão do projeto: helper `rethrowRedirect`).
- Campos que parecem string podem ser **enum do Prisma** (`DocKind`,
  `ContactKind` = BUYER/OWNER/BOTH, `LeadStage`, `PropertyStatus`...) —
  confira o schema antes de gravar.
- Build local pode falhar por env ausente (ex.: Stripe) — **a Vercel é a juíza**;
  valide com `npx tsc --noEmit` e distinga erro pré-existente de regressão.

## Segurança (padrões obrigatórios em toda action/query)
- Toda query filtra por `organizationId` (multi-tenant). Toda mutação valida
  posse antes: `findFirst({ where: { id, organizationId: ctx.org.id } })`.
- Guardas de papel: `requirePanel` / `requireManagerUp` / `requireAdmin`
  (`src/lib/perm.ts`). Corretor (`ctx.isAgent`) só enxerga o que tem
  `agentId: ctx.agentId`.
- Autoria nas timelines: payload `by` = `ctx.master ? "Master (plataforma)" :
  ctx.email` (padrão em leads, financeiro, documentos, PropertyEvent).
- Portal do Cliente NUNCA recebe: anotações internas, autoria, comissões.
- Segredos só no servidor; downloads de documentos sempre por URL assinada.

## Regras de negócio vigentes (decididas em 08/2026)
- **Rodízio de leads:** se o imóvel de interesse tem corretor ATIVO vinculado,
  o lead vai para ele (`fromProperty`); rodízio justo é fallback. Timeline
  registra o motivo da atribuição.
- **Lead de imóvel SOLD/RESERVED:** cria normalmente, MANTÉM o vínculo,
  nota automática de aviso (+ `wantSimilar` quando marcado) e pill na ficha.
- **Lead manual:** campo "Perfil do contato" (BUYER/OWNER/BOTH); contato
  existente não tem o kind sobrescrito.
- Visitas só em imóveis disponíveis; datas passadas bloqueadas.

## Fluxo de trabalho
- Antes de editar: `git status` limpo. Um tema por commit.
- Ao final de qualquer tarefa: `npx tsc --noEmit` e corrigir apenas erros
  causados pelos próprios diffs.
- Grandes módulos/arquitetura são feitos em outra frente (sessões Claude.ai
  com o histórico do projeto); aqui: fixes, refactors locais, auditorias,
  perguntas sobre o código.
