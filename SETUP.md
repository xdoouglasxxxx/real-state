# 🚀 SETUP COMPLETO — do zero ao ar

Você já criou as tabelas no Supabase (01_schema.sql). Siga na ordem:

## 1. Dados iniciais no Supabase (se ainda não rodou)

SQL Editor do Supabase:
1. `02_seed.sql`  → dados demo (imobiliária, imóveis, leads, financeiro)
2. `03_rls.sql`   → segurança multi-tenant no banco

## 2. Conectar o projeto

```bash
cd maison-saas
npm install
cp .env.example .env
```

Edite o `.env`:
- **DATABASE_URL / DIRECT_URL**: Supabase → Settings → Database → Connection string (URI).
  Troque `SENHA` pela senha do banco. DATABASE_URL usa a porta **6543** (pooler),
  DIRECT_URL usa a **5432**.
- **PAINEL_USER / PAINEL_PASS**: login do painel /painel.

## 3. Gerar o client do Prisma

```bash
npx prisma generate
```

(As tabelas já existem — NÃO precisa de `db:push`. Se quiser conferir que o
schema bate com o banco: `npx prisma db pull` e compare.)

## 4. Rodar

```bash
npm run dev
```

- Site:   http://localhost:3000
- Painel: http://localhost:3000/painel  (login do .env)

Teste o ciclo completo: abra um imóvel → envie o formulário "Agendar visita" →
veja o lead aparecer em **/painel/leads** na coluna "Novo" (e na tabela `Lead`
do Supabase).

## 5. Deploy na Vercel

```bash
npm i -g vercel
vercel
```

1. Importe o repositório (ou `vercel` direto na pasta)
2. Em **Settings → Environment Variables**, adicione as mesmas variáveis do `.env`
3. Build command já está pronto (`prisma generate && next build`)

### Domínios (multi-tenant)
- Domínio da plataforma: adicione `seudominio.com.br` + wildcard `*.seudominio.com.br`
  na Vercel e configure `NEXT_PUBLIC_ROOT_DOMAIN=seudominio.com.br`
- Domínio próprio de cada imobiliária: adicione o domínio na Vercel **e**
  insira uma linha na tabela `Domain` do Supabase
  (`host = 'www.imobiliariax.com.br'`, `organizationId` do tenant)

## 6. Checklist pós-deploy

- [ ] `https://seusite/sitemap.xml` responde com os imóveis
- [ ] Compartilhe um link de imóvel no WhatsApp → preview com foto/título (Open Graph)
- [ ] Formulário cria lead no Supabase
- [ ] `/painel` pede usuário e senha
- [ ] Google Search Console: enviar o sitemap

## O que vem depois (fase 2)

- Better Auth no lugar do Basic Auth (multiusuário, papéis)
- Kanban interativo (arrastar leads entre estágios)
- WhatsApp API (notificar corretor a cada lead novo)
- Upload de imóveis pelo painel (Cloudinary)
- IA: "quais imóveis estão há 90 dias sem visita?" via function calling
