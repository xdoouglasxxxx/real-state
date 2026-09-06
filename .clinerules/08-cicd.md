# CI/CD & FLUXO DE DEPLOY

## PIPELINE REAL

- **Vercel (região gru1)**: push na `main` → deploy de PRODUÇÃO automático.
  Build = `prisma generate && next build` (erro de TypeScript derruba o build).
- Branch de trabalho: `staging-maison`; `main` recebe por fast-forward.
- **GitHub Actions**: Smoke Check (ver 07) em push na main + diário.
- Não existe ambiente de staging na Vercel hoje — o "staging" é o branch +
  o banco de staging do Supabase quando aplicável.

## REGRAS DE GIT

- **Push é SEMPRE manual do Douglas** — nunca dê push sem ordem explícita
  dele naquela conversa. Pare após commitar.
- Commits temáticos (um tema por commit), mensagem em PT descrevendo o porquê.
- Antes de editar: `git status` limpo. Nunca commitar `.env` ou segredos.
- `prisma/schema.prisma` e `database/*.sql` só entram em commit quando vierem
  do canal externo ou com autorização explícita (ver 05).

## ORDEM DE DEPLOY COM MIGRAÇÃO

1. SQL numerado no Supabase de staging → validar
2. Mesmo SQL em produção
3. Só então push da `main` (código que depende da coluna nova)

Coluna nova no schema sem estar no banco = queries do Prisma quebram em
produção (inclusive login).

## PÓS-DEPLOY

Conferir build na Vercel, smoke check verde no Actions, e testar o fluxo
alterado em produção com dados sintéticos (limpar depois).
