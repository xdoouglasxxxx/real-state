# ROADMAP — Imobiliária OS
### Do estado atual à plataforma completa, em ondas de entrega contínua

> Regra de ouro: cada onda entra em PRODUÇÃO ao terminar. Clientes recebem
> valor toda semana. Nada de big bang.

---

## ✅ JÁ ENTREGUE (você está aqui)

Site multi-tenant de alto padrão (tema/logo por tenant) · Busca com filtros ·
Página de imóvel com galeria, mapa, tour virtual e SEO (JSON-LD, sitemap, OG) ·
Formulários → Lead automático · Painel com dashboard de KPIs, kanban do funil e
tabela de imóveis (encalhados sinalizados) · Banco multi-tenant com RLS (25
tabelas cobrindo TODAS as entidades do documento) · Deploy-ready Vercel+Supabase

---

## 🌊 ONDA 1 — Operação básica dos 5 clientes (esta semana)
*Objetivo: clientes usando sozinhos, sem você no meio.*

- [ ] Deploy Vercel + domínio + wildcard (subdomínio por cliente)
- [ ] Provisionar os 5 tenants (script pronto em database/)
- [ ] **CRUD de imóveis no painel** — formulário completo, upload de fotos
      (Cloudinary), editar/pausar/vender  ← *a feature que destrava tudo*
- [ ] CRUD de corretores e leads manuais no painel
- [ ] Auth real (Better Auth): login por usuário, papéis ADMIN/GERENTE/CORRETOR
      (substitui o Basic Auth)

## 🌊 ONDA 2 — CRM que vende (semanas 2-4)
*Documento: CRM, Pipeline, Agenda, Notificações (parte)*

- [ ] Kanban drag-and-drop + etapas personalizáveis por tenant
- [ ] Ficha do cliente: timeline, anotações, tarefas, próximo contato
- [ ] Agenda de visitas (+ Google Calendar)
- [ ] WhatsApp: notificação de lead novo ao corretor + primeiro contato
- [ ] Distribuição automática de leads (rodízio/regras)
- [ ] E-mail transacional (Resend)

## 🌊 ONDA 3 — Cobrança e portais (mês 2)
*Documento: Portal do Cliente, Portal do Corretor, Configurações, Planos*

- [ ] Stripe: assinatura por plano (STARTER/PRO/ENTERPRISE) + gates de feature
- [ ] Portal do Corretor (dashboard próprio: leads, agenda, comissões, ranking)
- [ ] Portal do Cliente (propostas, documentos, status, favoritos)
- [ ] Onboarding self-service: "crie sua imobiliária" (tenant automático)
- [ ] Configurações do tenant: logo, cores, domínio, usuários, permissões

## 🌊 ONDA 4 — Financeiro + Contratos + Documentos (mês 3)
*Documento: Financeiro, Contratos, Gestão Documental, Auditoria*

- [ ] Fluxo de caixa, contas a pagar/receber, comissões, DRE simplificado
- [ ] Gerador de contratos por modelo + assinatura digital (Clicksign/ZapSign)
- [ ] Pasta documental por imóvel/contrato (storage privado, versões, permissões)
- [ ] Log de auditoria (quem/quando/o quê) — a tabela Activity já suporta

## 🌊 ONDA 5 — IA + Automações + BI completo (mês 4)
*Documento: IA, Automações, BI, Busca Inteligente*

- [ ] IA: descrição/título/SEO automáticos do imóvel · sugestão de preço ·
      chatbot de qualificação · consultas em linguagem natural no painel
      ("imóveis 90 dias sem visita") — function calling sobre o Prisma
- [ ] Automação de publicação: lead → tarefa → WhatsApp → e-mail → follow-up
- [ ] Integração Meta (Instagram/Facebook leads) e XML para portais (ZAP/VivaReal)
- [ ] BI executivo completo: ROI, CAC, LTV, origem, mapa de calor, exportação
- [ ] Busca semântica (pgvector no próprio Supabase — sem Elasticsearch)

## 🌊 ONDA 6 — Escala e plataforma (mês 5+, guiado por demanda)
*Documento: Mobile, API pública, Website Builder, Performance, Escalabilidade*

- [ ] API pública (REST + OpenAPI + API keys + webhooks)
- [ ] App mobile (PWA primeiro; nativo se os clientes pedirem)
- [ ] Website builder (temas/seções configuráveis por tenant — evolução do
      sistema de temas atual)
- [ ] Observabilidade (Sentry + Vercel Analytics) e hardening de performance
- [ ] Infra avançada (filas, cache, k8s) **somente quando métricas exigirem**

---

## Princípios

1. **Produção toda semana.** Feature pronta = feature no ar.
2. **Cliente pagante dita a ordem** dentro de cada onda.
3. **Supabase/Vercel até doer.** Complexidade de infra só com dor real medida.
4. **O documento IMOBILIÁRIA-OS é o mapa; este roadmap é a rota.**
