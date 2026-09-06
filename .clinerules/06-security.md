# SEGURANÇA — PADRÕES OBRIGATÓRIOS

## MULTI-TENANT (inegociável)

- TODA query filtra por `organizationId`.
- TODA mutação valida posse ANTES:
  `findFirst({ where: { id, organizationId: ctx.org.id } })` — nunca confie
  no id vindo do form/URL.

## GUARDS DE PAPEL (`src/lib/perm.ts`)

- Painel: `requirePanel` / `requireManagerUp` / `requireAdmin`.
- Corretor (`ctx.isAgent`): só enxerga o que tem `agentId: ctx.agentId`.
- Portal do Cliente (CLIENT/OWNER): `requireClientPortal` — resolve o Contact
  por `session.contactId` (fallback e-mail) e as queries usam
  `contactId: { in: ctx.contactIds }` + escopo de org.
- Server actions do site público (ex.: createLead) validam e sanitizam input
  (LGPD: consentimento + IP).

## PORTAL DO CLIENTE — NUNCA EXPOR

Anotações internas (Activity NOTE, Visit.notes), autoria (`payload.by`),
comissões, `paymentMethod`/`cashAmount`/`coafReportedAt`, `adminFee`/repasse
de terceiros. Use `select` explícito campo a campo — nunca `include` cru.

## AUTH & SEGREDOS

- Sessão: cookie HMAC assinado (`AUTH_SECRET`), httpOnly, sameSite lax.
- Senha: scrypt `salt:hash` + `timingSafeEqual` (helpers em `src/lib/auth.ts`
  — nunca reimplemente).
- Comparação de credenciais master: `timingSafeStringEqual` (nunca `===`).
- Segredos SÓ no servidor (.env); nunca em código, log, commit ou resposta.
- Documentos: download SEMPRE por URL assinada (`storage.ts`), nunca URL
  pública de storage privado.

## AUDITORIA

Autoria nas timelines: payload `by` = `ctx.master ? "Master (plataforma)" :
ctx.email` (ou `"Cliente (portal)"` em ação do cliente).

## POSTURA

Nunca enfraquecer validação/autorização para passar teste ou destravar bug.
Erros ao usuário sem detalhes internos; log com `console.error("nome:", e)`.
Injeção: Prisma parametriza — nunca interpolar input em SQL cru.
