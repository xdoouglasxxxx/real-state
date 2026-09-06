# ARQUITETURA & QUALIDADE DE CÓDIGO

## MAPA DO REPO

- `src/app/(site)/` — site público (home, imóveis, `/imovel/[slug]`, blog, vender)
- `src/app/painel/` — CRM (leads kanban, agenda, imóveis, financeiro, locação,
  contratos, modelos, corretores, usuários, assinatura, configurações, conta)
- `src/app/cliente/` — Portal do Cliente/Proprietário (home + `portal/
  {favoritos,propostas,visitas,contratos,configuracoes}`)
- `src/lib/` — núcleo: `perm.ts` (guards), `tenant.ts`, `auth.ts`, `data.ts`
  (queries agregadas + labels), `format.ts` (brl), `validators.ts`,
  `redirect.ts` (rethrowRedirect), `storage.ts` (URL assinada), `notify.ts`
- `src/components/{site,painel}/` — client components (ex.: MoneyInput)
- `prisma/schema.prisma` (NÃO editar — ver 05) · `database/*.sql` (migrações
  manuais numeradas) · `scripts/` (seeds sintéticos + smoke) · `tests/e2e/`
- NÃO tocar em `legacy/` nem criar arquivos soltos na raiz.

## ARMADILHAS DO NEXT (quebram build/runtime)

- `page.tsx` exporta SÓ `default` / `dynamic` / `metadata`.
- Arquivo `"use server"` exporta SÓ função async — constantes compartilhadas
  vão para `src/lib/`.
- `redirect()` LANÇA exceção: em try/catch, primeira linha do catch é
  `rethrowRedirect(e)` (import de `@/lib/redirect`).
- Campos que parecem string podem ser enum do Prisma (`LeadStage`, `DocKind`,
  `ContactKind`, `ProposalStatus`...) — confira o schema antes de gravar.
- `Decimal` do Prisma: renderize com `brl(Number(x))`; grave com string
  (`amount.toFixed(2)`), nunca float.

## CSS / UI

Design system próprio em `src/app/globals.css` (dark-luxury, dourado `--brass`):
`.kpi .ficha-box .pform .pgrid(.span2/3/4) .pill .table .meta-bar .btn-solid
.btn-outline .pform-error .ok .nav-badge .panel-link .timeline`.
Tailwind está ativo no build por legado, mas classes utilitárias são
PROIBIDAS no código (`bg-[#...]`, `flex`, `p-4`...). PROIBIDO Shadcn, lucide
ou qualquer lib de UI. Estilo pontual: `style={{}}` inline.

## TYPESCRIPT

Tipagem estrita; evite `any` desnecessário; prefira `unknown` + narrowing.
Tipo não é validação: input externo (FormData, URL, API) valida em runtime
com parse explícito (`String(formData.get(...) ?? "")`, `validators.ts`).
Sem código morto, sem abstração prematura, funções pequenas.
