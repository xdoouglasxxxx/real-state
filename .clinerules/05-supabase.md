# SUPABASE / PRISMA / MIGRAÇÕES

## REGRA DE OURO (a mais importante do projeto)

**NUNCA** alterar `prisma/schema.prisma`, criar migração Prisma
(`prisma migrate`, `db push`) ou rodar SQL por conta própria.
Mudança de banco = arquivo SQL **numerado** em `database/` (o próximo segue a
sequência; hoje vai até `23_portal_cliente.sql`), executado MANUALMENTE pelo
Douglas no SQL Editor do Supabase — **staging antes de produção**.
Se um fix exigir coluna nova: PARE e avise.

## PADRÃO DOS ARQUIVOS `database/*.sql`

- Cabeçalho comentado com número, tema e "Idempotente. Rodar ANTES do deploy".
- Idempotência: `IF NOT EXISTS`, `DO $$ ... EXCEPTION WHEN duplicate_object`.
- Backfills determinísticos e com guards (respeitar UNIQUEs).
- NUNCA editar migração já aplicada — sempre arquivo novo.

## ORDEM DE DEPLOY COM MUDANÇA DE SCHEMA

SQL no Supabase de produção **ANTES** do push que deploya o código.
O Prisma seleciona todos os escalares por padrão: coluna faltando no banco
quebra a query inteira (ex.: login) em produção.

Após schema novo chegar: `npx prisma generate` local, senão o tsc quebra.

## CONEXÃO & RLS

- `DATABASE_URL` = pooler (porta 6543) · `DIRECT_URL` = conexão direta.
- RLS no Supabase espelha o filtro `organizationId` da aplicação — nunca
  desabilite RLS para fazer algo passar; descubra a camada certa do erro
  (auth? policy? query? dado?).

## SEGURANÇA DE DADOS

- Nunca dados reais de cliente em teste; seeds sintéticos em `scripts/`.
- Nunca operação destrutiva em produção sem autorização explícita; SELECT de
  conferência antes de qualquer DELETE/UPDATE em massa.
