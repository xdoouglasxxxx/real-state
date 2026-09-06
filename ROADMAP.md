# ROADMAP — Imobiliária OS
**Do estado atual à plataforma completa, em ondas de entrega contínua**

> Regra de ouro: cada onda entra em PRODUÇÃO ao terminar. Clientes recebem valor
> toda semana. Nada de big bang.
>
> Legenda: ✅ entregue em produção · 🔶 parcial (o que falta está anotado) · ⬜ a fazer
>
> Última atualização: **06/09/2026** (Portal do Cliente v2 em produção; substitui
> também o PDF "ROADMAP_ATUALIZADO" de 13/08)

---

## ✅ JÁ ENTREGUE (base)

Site multi-tenant de alto padrão · Busca com filtros · Página de imóvel com galeria,
mapa, tour virtual e SEO · Formulários → Lead automático · Banco multi-tenant com RLS ·
Deploy Vercel + Supabase · PWA.

## 🌊 ONDA 1 — Operação básica — **CONCLUÍDA** (exceto operacionais do Douglas)
✅ Deploy Vercel (gru1) · 🔶 Domínio/wildcard (código pronto; domínio da plataforma adiado) ·
⬜ Provisionar 5 clientes reais · ✅ CRUD de imóveis · ✅ CRUD de corretores com edição
completa · ✅ Auth real com papéis ADMIN/GERENTE/CORRETOR

## 🌊 ONDA 2 — CRM que vende — **CONCLUÍDA** (integrações externas pendentes)
✅ Kanban drag-and-drop · ✅ Ficha com timeline + autoria · ✅ Agenda com contexto do
lead e bloqueio de data passada · ✅ Rodízio automático (prioridade ao corretor do
imóvel) · 🔶 WhatsApp (código pronto; falta app na Meta) · ⬜ Resend ·
⬜ Google Calendar · ⬜ Etapas customizáveis · ⬜ Tarefas/próximo contato

## 🌊 ONDA 3 — Cobrança e portais — **CONCLUÍDA em 06/09/2026** 🎉
- ✅ Multiusuário + papéis + tela Usuários + Minha conta
- ✅ Portal do Corretor (dashboard próprio, meus leads, minha agenda, blindagem)
- ✅ Stripe — checkout + trial + webhook + portal de cobrança *(código no ar,
  desligado até criar a conta e preencher as 5 env vars; guia STRIPE.md)*
- ✅ Dashboard 2.0 — alertas acionáveis, deltas, funil, origem, ranking, projeção
- ✅ Tenant demo Maison Prime (database/11 + 12)
- ✅ Onboarding self-service /criar · 🔶 Configurações (falta domínio por tenant)
- ✅ **PORTAL DO CLIENTE — v2 em produção (06/09/2026):**
  - Login CLIENT **e OWNER** → `/cliente`; sessão com `contactId`
    (migração `database/23_portal_cliente.sql` + backfill; rodada em produção)
  - Guard `requireClientPortal` (`src/lib/perm.ts`) — posse por
    `contactId: { in: ctx.contactIds }` + `organizationId` em toda query
  - Home: jornadas com timeline segura, propostas, contrato + documentos por
    URL assinada, visitas, locação (inquilino e proprietário), favoritos
  - Páginas: `/cliente/portal/favoritos · propostas · visitas · contratos ·
    configuracoes` + nav no layout
  - **Cliente envia nova proposta** (Proposal SENT + avanço do funil com
    STAGE_CHANGE; NOTE interna quando o funil já passou)
  - **Trocar senha pelo portal** (reusa `changePassword`, destino pela role)
  - Seeds sintéticos: `scripts/criar-cliente.mjs` (cliente@teste.com / 123456)
    e `scripts/criar-proposta-teste.mjs`
- ⬜ Domínio próprio por tenant via API da Vercel (CNAME + validação + SSL) —
  única pendência estrutural da onda

## 🌊 ONDA 3.5 — Quick wins "Copiloto" — **CONCLUÍDA** (database/13)
✅ Copiloto por regras no painel (sem IA externa) · ✅ Score visível (frio/morno/quente) ·
✅ Campo objeções estruturado na ficha do lead · ✅ Simulador de financiamento
(`FinancingSimulator`, taxas por banco em database/22) · ✅ Badges de pendência (.nav-badge)

## 🌊 ONDA 4 — Financeiro + Contratos + Documentos (o ERP) — **CONCLUÍDA no essencial**
- ✅ Financeiro v2: fluxo de caixa, contas a pagar/receber, comissões, exportação
  (database/14 + 17)
- ✅ Documentos por imóvel/contrato com tipos (DocKind), upload rastreado e
  download por URL assinada (database/15 + 16)
- ✅ Locação: RentalContract + RentPayment, pagamento do inquilino → caixa,
  **repasse ao proprietário** (aluguel − taxa adm, só após pagamento; database/18 + 19)
- ✅ Compliance camada 1: LGPD (consentimento no lead), CRECI (UF/validade por
  corretor), COAF (espécie no contrato + marcação de reporte) — database/20
- ✅ Gerador de contratos por modelo do tenant (database/21) — 🔶 assinatura
  digital externa (Clicksign/ZapSign) pendente
- ⬜ Ficha documental com badges ("Matrícula ✅ · IPTU ✅ · Ônus 🟡") + checklist
  jurídico por negociação
- ⬜ Log de auditoria universal (a autoria na timeline é o embrião)
- ⬜ Metas por corretor editáveis no painel (tabela Goal pronta)

## 🌊 ONDA 5 — IA + Automações + BI (o "Copiloto" completo)
- ⬜ Alertas inteligentes POR CARGO (corretor/gerente/diretor)
- ⬜ Score de compra dinâmico (comportamento) · ⬜ Argumentos de venda por IA
- ⬜ Resumo executivo diário + perguntas livres sobre a base (function calling)
- ⬜ Comparativo de mercado (começar com a base própria acumulada)
- ⬜ Automação lead → tarefa → WhatsApp → e-mail → follow-up · Meta Ads · XML portais
- ⬜ BI executivo: ROI, CAC por origem, LTV, ano vs ano · Busca semântica (pgvector)

## 🌊 ONDA 6 — Escala e plataforma
- ⬜ Papel SUPERVISOR + times de corretores (exige entidade Team)
- ⬜ API pública · Website builder · Observabilidade (Sentry) · 🔶 PWA entregue
- ⬜ Infra avançada somente quando métricas exigirem

---

## 🎯 PRÓXIMOS PASSOS

**Do Douglas (operacional):**
1. **Limpar dados de teste em produção** (corretores "teste"/"Corretor2026"/"aaa…",
   depoimento "teste", proposta de teste R$ 530.000) — SQL de limpeza combinado
2. Stripe: criar conta + 5 env vars (STRIPE.md) + testar com cartão 4242
3. WhatsApp na Meta · onboarding dos 5 clientes · tours Matterport

**De desenvolvimento (nesta ordem):**
1. **Domínio próprio por tenant** (API Vercel) — fecha de vez a Onda 3
2. Polimento do Portal do Cliente: `notifyNewProposal` (WhatsApp ao corretor),
   estado ativo na nav, agendar visita pelo portal
3. Onda 4 restante: badges documentais → assinatura digital → metas editáveis
4. Avaliar remoção do Tailwind do build (regra 3 do CLAUDE.md; exige build
   validado na Vercel)

## Princípios
1. **Produção toda semana.** 2. **Cliente pagante dita a ordem.** 3. **Supabase/Vercel até
doer.** 4. **O documento IMOBILIÁRIA-OS é o mapa; este roadmap é a rota.**
5. **Inteligência por regras antes de IA** — 80% do valor percebido do "copiloto"
são queries bem feitas; IA entra quando as regras esgotarem.
