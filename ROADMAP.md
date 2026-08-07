# ROADMAP — Imobiliária OS
**Do estado atual à plataforma completa, em ondas de entrega contínua**

> Regra de ouro: cada onda entra em PRODUÇÃO ao terminar. Clientes recebem valor
> toda semana. Nada de big bang.
>
> Legenda: ✅ entregue em produção · 🔶 parcial (o que falta está anotado) · ⬜ a fazer
>
> Última atualização: 07/08/2026 (após entrega Multiusuário + Portal do Corretor)

---

## ✅ JÁ ENTREGUE (base)

Site multi-tenant de alto padrão (tema/logo por tenant) · Busca com filtros · Página de
imóvel com galeria, mapa, tour virtual e SEO (JSON-LD, sitemap, OG) · Formulários → Lead
automático · Painel com dashboard de KPIs, kanban do funil e tabela de imóveis
(encalhados sinalizados) · Banco multi-tenant com RLS · Deploy-ready Vercel+Supabase

---

## 🌊 ONDA 1 — Operação básica dos 5 clientes — **CONCLUÍDA** (exceto operacionais)

*Objetivo: clientes usando sozinhos, sem você no meio.*

- ✅ Deploy Vercel (maisonstate.vercel.app, CI/CD pela main, funções em gru1)
- 🔶 Domínio + wildcard (subdomínio por cliente) — *o código de resolução por
  subdomínio está pronto; falta a plataforma ter domínio próprio (adiado por decisão).
  Enquanto isso, tenants funcionam pelo cookie de preview.*
- ⬜ Provisionar os 5 tenants — **operacional do Douglas** (podem se cadastrar
  sozinhos pelo /criar, ou usar os seeds)
- ✅ CRUD de imóveis no painel — formulário completo, fotos (Cloudinary ou URL),
  status, slug único, editar/pausar/vender/arquivar
- ✅ CRUD de corretores e leads manuais no painel
- ✅ Auth real: login por usuário com papéis ADMIN/GERENTE/CORRETOR
  *(entregue em 07/08/2026 — auth própria leve com scrypt + cookie assinado,
  em vez de Better Auth: mesma função, menos dependência)*

## 🌊 ONDA 2 — CRM que vende — **CONCLUÍDA** (integrações externas pendentes)

- ✅ Kanban drag-and-drop
  - ⬜ Etapas personalizáveis por tenant (backlog)
- ✅ Ficha do cliente: timeline + anotações
  - ⬜ Tarefas / “próximo contato” (backlog)
- ✅ Agenda de visitas (status Realizada/No-show/Cancelada, integra timeline e funil)
  - ⬜ Integração Google Calendar (backlog)
- 🔶 WhatsApp: notificação de lead novo ao corretor — *código pronto (lib/notify.ts);
  falta o Douglas criar o app na Meta e preencher WHATSAPP_TOKEN/PHONE_ID (guia: WHATSAPP.md)*
- ✅ Distribuição automática de leads (rodízio justo, lib/assign.ts)
- ⬜ E-mail transacional (Resend)

## 🌊 ONDA 3 — Cobrança e portais — **EM ANDAMENTO** ← você está aqui

- ✅ Multiusuário por tenant com papéis (ADMIN/GERENTE/CORRETOR) + tela Usuários
  (criar, vincular corretor, redefinir senha, ativar/desativar, limite do plano)
  + tela “Minha conta” com alterar senha *(07/08/2026)*
- ✅ Portal do Corretor — dashboard próprio (meus leads, minha agenda, comissões,
  minha meta), kanban e agenda filtrados, blindagem server-side *(07/08/2026)*
  - ⬜ Ranking de corretores (backlog)
- ⬜ **Stripe: assinatura por plano + webhook (trial → cobrança automática)** ← PRÓXIMO
  *(pré-requisito do Douglas: criar conta em stripe.com e ter as chaves em mãos)*
- ⬜ Portal do Cliente (propostas, documentos, status, favoritos)
- ✅ Onboarding self-service “/criar” (tenant + assinatura TRIALING + admin automáticos)
- 🔶 Configurações do tenant: ✅ logo, cores, dados · ✅ usuários e permissões ·
  ⬜ domínio próprio por tenant via API da Vercel (cliente aponta CNAME,
  painel valida, SSL automático — funciona mesmo sem o domínio da plataforma)
- ⬜ Editar slug nas Configurações (backlog)

## 🌊 ONDA 4 — Financeiro + Contratos + Documentos

- ⬜ Fluxo de caixa, contas a pagar/receber, comissões, DRE simplificado
  *(as tabelas Commission/FinanceEntry já existem e o Portal do Corretor já lê comissões)*
- ⬜ Gerador de contratos por modelo + assinatura digital (Clicksign/ZapSign)
- ⬜ Pasta documental por imóvel/contrato (storage privado, versões, permissões)
- ⬜ Log de auditoria (quem/quando/o quê) — a tabela Activity já suporta

## 🌊 ONDA 5 — IA + Automações + BI completo

- ⬜ IA: descrição/título/SEO automáticos · sugestão de preço · chatbot de
  qualificação · consultas em linguagem natural no painel
- ⬜ Automação: lead → tarefa → WhatsApp → e-mail → follow-up
- ⬜ Integração Meta (Instagram/Facebook leads) e XML para portais (ZAP/VivaReal)
- ⬜ BI executivo completo: ROI, CAC, LTV, origem, mapa de calor, exportação
- ⬜ Busca semântica (pgvector no próprio Supabase)

## 🌊 ONDA 6 — Escala e plataforma (guiado por demanda)

- ⬜ API pública (REST + OpenAPI + API keys + webhooks)
- 🔶 App mobile — *PWA já entregue (manifest, ícones, safe-areas iPhone);
  nativo só se os clientes pedirem*
- ⬜ Website builder (temas/seções configuráveis por tenant)
- ⬜ Observabilidade (Sentry + Vercel Analytics) e hardening de performance
- ⬜ Infra avançada (filas, cache, k8s) **somente quando métricas exigirem**

---

## 🎯 PRÓXIMOS PASSOS (ordem combinada)

**Do Douglas (operacional, não depende de código):**
1. Confirmar login multiusuário em produção + criar corretor de teste (roteiro do chat de 07/08)
2. Criar conta em **stripe.com** e anotar as chaves (pré-requisito do próximo dev)
3. Ativar WhatsApp na Meta (guia WHATSAPP.md) e preencher as env vars
4. Onboarding dos 5 clientes reais (podem usar o /criar)
5. Trocar IDs mortos dos tours Matterport da demo (discover.matterport.com → painel → imóvel)

**De desenvolvimento (nas próximas sessões, nesta ordem):**
1. **Stripe** — checkout de assinatura + webhook (trial → cobrança) + gates de feature
2. **Portal do Cliente** — propostas, documentos, favoritos, status
3. **Domínio próprio por tenant** — via API da Vercel (CNAME + validação + SSL)
4. Backlog curto: Resend (e-mail transacional) · etapas customizáveis do funil ·
   editar slug · ranking de corretores

---

## Princípios

1. **Produção toda semana.** Feature pronta = feature no ar.
2. **Cliente pagante dita a ordem** dentro de cada onda.
3. **Supabase/Vercel até doer.** Complexidade de infra só com dor real medida.
4. **O documento IMOBILIÁRIA-OS é o mapa; este roadmap é a rota.**
