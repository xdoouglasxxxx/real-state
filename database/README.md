# Banco de dados — Maison SaaS

## Arquivos

| Arquivo | O que é |
|---|---|
| `01_schema.sql` | DDL Postgres completo (25 tabelas, 17 enums, índices multi-tenant) |
| `02_seed.sql` | Dados demo: imobiliária, 3 corretores, 6 imóveis, funil de leads completo (o "Douglas"), venda fechada, financeiro e metas |
| `03_rls.sql` | Row Level Security — isolamento por tenant DENTRO do banco |
| `04_queries_bi.sql` | Os KPIs do dashboard prontos: receita, ticket médio, conversão por estágio, origem de leads, tempo médio de venda, imóveis encalhados, ranking, meta do mês, receita prevista |
| `maison_demo.sqlite` | Banco SQLite JÁ POPULADO — abra no DB Browser ou na extensão SQLite do VS Code para explorar sem configurar nada |

## Como usar no Supabase (produção)

1. Crie o projeto no [supabase.com](https://supabase.com)
2. SQL Editor → cole e rode na ordem: `01_schema.sql` → `02_seed.sql` → `03_rls.sql`
3. Copie a connection string (Settings → Database) para o `.env` do maison-saas
4. No projeto: `npx prisma db pull && npx prisma generate` (sincroniza o client)

## Como usar com Prisma direto (alternativa)

Se preferir que o Prisma crie as tabelas (sem colar SQL):
`npm run db:push && npm run db:seed` — resultado equivalente ao 01+02.
Use os arquivos SQL como referência e para o RLS (03), que o Prisma não gerencia.

## Importante — RLS com Prisma

O Prisma conecta com um único usuário de banco. Para o RLS valer, defina o tenant
em cada transação:

```ts
await prisma.$transaction([
  prisma.$executeRaw`SELECT set_config('app.current_org', ${orgId}, true)`,
  // ...suas queries
]);
```

Isso cria DUAS camadas de proteção: o filtro `organizationId` no código
(src/lib/data.ts) + o RLS no banco. Se uma falhar, a outra segura.
