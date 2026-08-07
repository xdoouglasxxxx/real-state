# HANDOFF — Contexto completo do projeto (para retomar em novo chat)
> **Como usar:** anexe este arquivo na primeira mensagem de um novo chat com o
> Claude e diga qual etapa quer atacar. Ele contém tudo o que foi construído,
> decidido e combinado até aqui.

## 1. O QUE É O PROJETO
SaaS multi-tenant para imobiliárias ("Imobiliária OS"): site de alto padrão +
CRM + agenda + planos pagos, self-service. Dono: Douglas (iniciante em dev —
explicar passos com paciência, um comando por vez, PowerShell no Windows).
Visão completa em `ROADMAP.md` (6 ondas). **5 clientes reais aguardando onboarding.**

## 2. INFRAESTRUTURA (produção, funcionando)
- **Repo GitHub:** github.com/xdoouglasxxxx/real-state (branch main)
- **Pasta local:** C:\Users\d.paes\Desktop\REALSTATE-AGENCY\repo-github (ÚNICA pasta de trabalho)
- **Deploy:** Vercel, projeto "maisonstate" → https://maisonstate.vercel.app (CI/CD: push na main = deploy)
- **Funções Vercel:** região gru1 (São Paulo) via vercel.json
- **Banco:** Supabase região sa-east-1 (São Paulo). Schema em database/01..09 (rodados no SQL Editor)
- **Env vars na Vercel (valores SEM aspas):** DATABASE_URL (pooler 6543 + ?pgbouncer=true),
  DIRECT_URL (5432), PAINEL_USER, PAINEL_PASS (acesso master a qualquer tenant),
  AUTH_SECRET, NEXT_PUBLIC_ROOT_DOMAIN=maisonstate.vercel.app
- **.env local** espelha as mesmas (com aspas). Validação local: `npx prisma db pull` → deve dar ✔ 21 models

## 3. STACK E DECISÕES
Next.js 14.2 (App Router) + TypeScript + Prisma 5.22 + Postgres/Supabase + CSS próprio
(globals.css, design dark-luxury, fonte display Instrument Serif, dourado #c6a15b).
Sem NestJS/Redis/K8s por decisão: simplicidade até doer (ver ROADMAP "Princípios").
- **Multi-tenant por linha** (organizationId em tudo + RLS no banco).
  Resolução do tenant: domínio próprio (tabela Domain) → subdomínio slug.ROOT_DOMAIN →
  **cookie tenant_preview** (modo atual, sem domínio) → primeira org → demo.
- **Auth própria leve** (src/lib/auth.ts): scrypt + cookie assinado HMAC (AUTH_SECRET).
  Login por e-mail do admin (slug opcional). Master = PAINEL_USER/PASS entra em qualquer tenant.
- **Fallback demo** (demo-data.ts) SÓ quando não há DATABASE_URL — nunca para lista vazia.
- **Planos** em src/lib/plans.ts (Start 149 / Pro 349 ⭐ / Business 699 / Enterprise) com
  enforcement de limite de imóveis; upgrade via WhatsApp (Stripe pendente).

## 4. O QUE JÁ EXISTE (Ondas 1 e 2 completas)
**Site público:** home (hero vídeo, busca, destaques, bairros, equipe, depoimentos, blog),
/imoveis com filtros, página do imóvel (galeria, tour virtual iframe, mapa, SEO/JSON-LD,
form → lead; imóvel VENDIDO/RESERVADO vira captação "quero um similar"), /vender, /sobre,
/blog, sitemap, PWA (manifest, ícones, menu hamburger, safe-areas iPhone).
**Self-service:** /criar (cria Organization+Subscription TRIALING+admin) e /login.
**Painel (/painel):** Dashboard KPIs reais · Leads kanban DRAG-AND-DROP + ficha com
timeline + lead manual + **rodízio automático** (lib/assign.ts) · Agenda de visitas
(status Realizada/No-show/Cancelada, integra timeline e move estágio) · Imóveis CRUD
completo (fotos Cloudinary-ou-URL, status, slug único) · Corretores CRUD · Assinatura
(planos, trial, uso) · Configurações (marca/cores/logo).
**Notificações:** lib/notify.ts com WhatsApp Cloud API pronto — falta o Douglas criar o
app na Meta e preencher WHATSAPP_TOKEN/WHATSAPP_PHONE_ID (guia: WHATSAPP.md).
**Demo de vendas:** tenant Maison Estate populado (database/07) com funil cheio, agenda,
metas, contratos. Login demo: demo@maisonestate.com.br / MaisonDemo2026.

## 5. CONVENÇÕES DE TRABALHO (importante seguir!)
1. **Ritual de entrega:** Claude edita a cópia dele → valida → gera ZIP com paths
   relativos à raiz → Douglas: `Expand-Archive -Path "$env:USERPROFILE\Downloads\X.zip"
   -DestinationPath . -Force` (dentro do repo-github) → `git add -A` → `git commit` →
   `git push` → Vercel deploya. UM CANAL SÓ (nunca upload pela web do GitHub).
2. **PowerShell:** sem `&&` (usar `;` ou linhas separadas). Warnings CRLF = inofensivos.
3. **Armadilha nº1 do Next:** `redirect()` lança exceção — NUNCA dentro de try/catch
   (usar helper rethrowRedirect ou redirect fora do try). Já causou 2 bugs.
4. **Actions:** sempre validar agentId/propertyId/leadId contra organizationId (blindagem).
5. **Env na Vercel:** valores sem aspas, sem espaços; editar variável exige REDEPLOY.
6. **Debug:** Vercel → Logs (console.error aparece lá). Validar credenciais localmente
   com `npx prisma db pull` antes de mexer na Vercel.
7. **NUNCA** rodar `npm audit fix --force`.
8. Seeds SQL idempotentes; auditoria de colunas vs schema antes de entregar SQL grande.

## 6. PENDÊNCIAS / BACKLOG IMEDIATO
- [ ] Douglas: ativar WhatsApp (WHATSAPP.md) e onboarding dos 5 clientes reais
- [ ] Tours Matterport da demo: trocar IDs mortos via discover.matterport.com (painel → imóvel)
- **PRÓXIMA PAUTA ESCOLHIDA (Onda 3, SEM o item domínio/landing — adiado):**
  1. Multiusuário por tenant com papéis (ADMIN/GERENTE/CORRETOR) + tela "alterar senha"
  2. Stripe: checkout de assinatura + webhook (trial → cobrança automática)
     [pré-requisito do Douglas: criar conta stripe.com e ter as chaves]
  3. Portal do Corretor (dashboard próprio: meus leads, agenda, comissões)
  4. Portal do Cliente (propostas, documentos, favoritos)
  5. Conexão de domínio próprio POR TENANT via API da Vercel (funciona mesmo sem
     o domínio da plataforma — cliente aponta CNAME, painel valida, SSL automático)
- Backlog geral: e-mail transacional (Resend), etapas customizáveis do funil,
  editar slug nas Configurações, Ondas 4-6 no ROADMAP.md.

## 7. GLOSSÁRIO RÁPIDO DE ARQUIVOS
src/lib: tenant.ts (resolução) · auth.ts (sessão) · plans.ts · assign.ts (rodízio) ·
notify.ts (WhatsApp) · data.ts (todas as queries) · demo-data.ts (fallback).
src/app: (site)/ páginas públicas · painel/ CRM · criar/ e login/ auth ·
actions.ts (leads do site) · auth-actions.ts. database/: SQLs 01-09. Docs:
ROADMAP.md, ARCHITECTURE.md, SETUP.md, WHATSAPP.md, este HANDOFF.md.
