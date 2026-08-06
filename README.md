# Real State — Plataforma Imobiliária (SaaS)

Site de alto padrão + painel CRM, multi-tenant, pronto para Supabase e Vercel.

## Estrutura do repositório

| Pasta | O que é |
|---|---|
| `src/` | App **Next.js** — site público `(site)` + painel CRM `painel/` |
| `prisma/` | Schema do banco (multi-tenant, 25 tabelas) + seed |
| `database/` | SQL do Supabase: schema, seed, RLS e queries de BI |
| `legacy/vite-site/` | Primeira versão (Vite) — apenas referência histórica |
| `SETUP.md` | **Passo a passo completo** para rodar e publicar |
| `ARCHITECTURE.md` | Arquitetura, roadmap por fases, decisões de IA/SEO |

## Início rápido

```bash
npm install
cp .env.example .env   # preencha com a connection string do Supabase
npx prisma generate
npm run dev            # site: localhost:3000 · painel: /painel
```

Sem `.env`, o site roda com dados de demonstração.

## Deploy

Vercel → Import deste repositório → adicionar as variáveis do `.env.example`
em Environment Variables → Deploy. Detalhes (domínios, multi-tenant, checklist
de SEO) no `SETUP.md`.
