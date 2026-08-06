# Maison SaaS — Arquitetura e Roadmap

Plataforma multi-tenant para imobiliárias: site de alto padrão + CRM + portais +
financeiro + BI, com IA integrada.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Prisma · Postgres (Supabase) ·
Better Auth · Cloudinary (mídia pública) · Supabase Storage (documentos privados) ·
Stripe (assinaturas) · Resend (e-mail) · OpenAI (IA) · Google Maps · Vercel

## Multi-tenant

- **Isolamento por linha**: toda tabela de negócio tem `organizationId`
  (índices compostos já no schema). Em produção, ativar RLS no Supabase
  espelhando o filtro.
- **Resolução do tenant**: `middleware.ts` repassa o host; `src/lib/tenant.ts`
  resolve por domínio próprio (tabela `Domain`) ou subdomínio (`Organization.slug`).
- **Identidade visual por tenant**: colunas `theme*` viram CSS variables no
  `layout.tsx` — o design inteiro responde sem rebuild.
- **Planos**: `Subscription.plan` (STARTER / PRO / ENTERPRISE) controla o que o
  tenant acessa. Cobrança via Stripe.

## Modelo de dados (prisma/schema.prisma)

- **Pessoas**: `User` (auth + papel), `Agent` (corretor: comissão, metas, ranking),
  `Contact` (comprador/proprietário).
- **Imóveis**: `Property` (+ SEO por imóvel, lat/lng), `PropertyMedia`
  (foto/vídeo/drone/tour), `Document` (a "pasta": escritura, matrícula, IPTU...),
  `PropertyEvent` (histórico), `Favorite`.
- **CRM**: `Lead` (origem, estágio, score) → `Activity` (timeline do lead, o fluxo
  "entrou pelo Instagram → clicou → WhatsApp → visita → proposta") → `Visit` →
  `Proposal` → `Contract`.
- **Financeiro**: `Commission`, `FinanceEntry` (entradas/saídas/impostos/pró-labore),
  `Goal` (metas por corretor/mês).
- **Conteúdo**: `BlogPost`, `Testimonial`.

Todos os KPIs do BI saem dessas tabelas por agregação — nenhuma tabela extra é
necessária para começar (receita, conversão por estágio, tempo médio de venda,
imóveis encalhados = `Property` sem `Visit` recente, ranking = `Commission` por
`Agent`, origem de leads = `Lead.source`).

## SEO (fase 1)

- SSR/SSG por imóvel com `generateMetadata` (título/descrição/OG dinâmicos)
- JSON-LD `RealEstateListing` por página (já implementado)
- `sitemap.xml` dinâmico por tenant + `robots.txt`
- Próximos: páginas por bairro (`/imoveis/[bairro]`), breadcrumbs com
  `BreadcrumbList`, imagens otimizadas via `next/image` + Cloudinary

## IA (transversal)

1. **Busca/consulta natural do corretor** ("imóveis há 90 dias sem visita"):
   function calling → funções seguras que consultam o Prisma SEMPRE com
   `organizationId`. Nunca gerar SQL livre a partir do texto do usuário.
2. **Recomendação no site**: começa por similaridade de atributos
   (tipo/preço/região); evolui para embeddings de descrição (pgvector).
3. **Score de lead**: regras + histórico de `Activity`.

## Roadmap

| Fase | Entrega | Vendável como |
|------|---------|---------------|
| 1 | Site multi-tenant + SEO + mapas + tours | Site de luxo com gestão de anúncios |
| 2 | CRM: funil, distribuição de leads, WhatsApp, agenda, metas | Assinatura PRO |
| 3 | Portais cliente/proprietário + pasta de documentos | Diferencial de retenção |
| 4 | Financeiro + BI executivo | Assinatura ENTERPRISE |

## Rodando agora

```bash
npm install
npm run dev          # funciona SEM banco (dados demo)

# com Supabase:
cp .env.example .env # preencha DATABASE_URL
npm run db:push      # cria as tabelas
npm run db:seed      # organização demo + imóveis
```

## Segurança e LGPD

- Documentos (escritura, matrícula) em storage PRIVADO com URL assinada — nunca
  em bucket público.
- `Contact.document` (CPF): colete apenas quando necessário (proposta/contrato),
  não no primeiro formulário.
- Logs de `Activity` guardam o mínimo; mensagens completas de WhatsApp ficam no
  provedor.
- Nunca commitar `.env`; segredos só na Vercel/Supabase.
