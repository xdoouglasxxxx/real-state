# ROADMAP — Imobiliária OS
**Do estado atual à plataforma completa, em ondas de entrega contínua**

> Regra de ouro: cada onda entra em PRODUÇÃO ao terminar. Clientes recebem valor
> toda semana. Nada de big bang.
>
> Legenda: ✅ entregue em produção · 🔶 parcial (o que falta está anotado) · ⬜ a fazer
>
> Última atualização: 07/08/2026 (após Dashboard 2.0 + demo Maison Prime +
> consolidação das auditorias estratégicas "Copiloto de Vendas")

---

## ✅ JÁ ENTREGUE (base)

Site multi-tenant de alto padrão · Busca com filtros · Página de imóvel com galeria,
mapa, tour virtual e SEO · Formulários → Lead automático · Banco multi-tenant com RLS ·
Deploy Vercel + Supabase · PWA.

## 🌊 ONDA 1 — Operação básica — **CONCLUÍDA** (exceto operacionais do Douglas)
✅ Deploy Vercel (gru1) · 🔶 Domínio/wildcard (código pronto; domínio da plataforma adiado) ·
⬜ Provisionar 5 clientes reais · ✅ CRUD de imóveis · ✅ CRUD de corretores **com edição
completa** (07/08) · ✅ Auth real com papéis ADMIN/GERENTE/CORRETOR (07/08)

## 🌊 ONDA 2 — CRM que vende — **CONCLUÍDA** (integrações externas pendentes)
✅ Kanban drag-and-drop · ✅ Ficha com timeline **+ autoria em cada evento (auditoria
leve, 07/08)** · ✅ Agenda (status, funil) **+ agendamento com contexto do lead
pré-preenchido e bloqueio de data passada (07/08)** · ✅ Rodízio automático ·
🔶 WhatsApp (código pronto; falta app na Meta) · ⬜ Resend · ⬜ Google Calendar ·
⬜ Etapas customizáveis · ⬜ Tarefas/próximo contato

## 🌊 ONDA 3 — Cobrança e portais — **QUASE FECHADA** ← você está aqui
- ✅ Multiusuário + papéis + tela Usuários + Minha conta *(07/08)*
- ✅ Portal do Corretor (dashboard próprio, meus leads, minha agenda, blindagem) *(07/08)*
- ✅ **Stripe** — checkout + trial + webhook + portal de cobrança *(07/08 — código no ar,
  desligado até o Douglas criar a conta e preencher as 5 env vars; guia STRIPE.md)*
- ✅ **Dashboard 2.0** *(07/08)* — "Requer sua atenção hoje" (alertas acionáveis),
  deltas vs mês anterior, funil visual, origem dos leads, ranking de corretores,
  projeção de meta + pipeline ponderado, moeda compacta
- ✅ **Tenant demo Maison Prime** *(07/08)* — 110 imóveis, 320 leads, 22 usuários,
  12 meses de história, financeiro e metas (database/11 + 12; logins no cabeçalho do SQL)
- ✅ Onboarding self-service /criar · 🔶 Configurações (falta domínio por tenant)
- ⬜ **Portal do Cliente — PRÓXIMA ENTREGA** (login do comprador, favoritos, propostas,
  documentos, status da negociação com timeline — espelho do motor do Dashboard 2.0)
- ⬜ Domínio próprio por tenant via API da Vercel (CNAME + validação + SSL)

## 🌊 ONDA 3.5 — Quick wins "Copiloto" (baratos, alto impacto percebido)
*Consolidado das auditorias de 07/08 — tudo SEM IA externa, só regras + queries:*
- ⬜ Painel do corretor v2: "Top 3 leads para atacar hoje" (score já existe no banco!),
  comissão projetada da carteira quente, alerta de leads esfriando (72h sem contato)
- ⬜ Menu lateral com badges de pendência (ex.: Leads **(3)** esfriando · Agenda **(2)** hoje)
- ⬜ Mensagem de permissão mais gentil (dizer qual área e quem tem acesso) — nota: o
  aviso atual é o RBAC funcionando, não um bug
- ⬜ Score do lead visível na ficha e no kanban (frio/morno/quente) — coluna `score` já existe
- ⬜ Campo "objeções/observações do cliente" estruturado na ficha (hoje vive nas anotações)
- ⬜ Simulador de financiamento na ficha do imóvel (entrada + parcela por taxa — cálculo
  local, sem API externa; tabela Price/SAC)

## 🌊 ONDA 4 — Financeiro + Contratos + Documentos (o ERP)
- ⬜ Fluxo de caixa, contas a pagar/receber, comissões, DRE (tabelas prontas; demo já populada)
- ⬜ Gerador de contratos por modelo + assinatura digital (Clicksign/ZapSign)
- ⬜ **Ficha documental do imóvel com badges** ("Matrícula ✅ · IPTU em dia ✅ · Ônus 🟡")
  + checklist jurídico por negociação — *dado alimentado por upload; não existe API pública
  de matrícula/certidão: o sistema organiza e alerta, o humano anexa* (das auditorias)
- ⬜ Pasta documental por imóvel/contrato (storage privado, versões, permissões)
- ⬜ Log de auditoria universal (quem/quando/o quê em TODAS as entidades — a autoria
  na timeline de leads de 07/08 é o embrião)
- ⬜ Metas por corretor editáveis no painel (tabela Goal pronta)

## 🌊 ONDA 5 — IA + Automações + BI (o "Copiloto" completo)
*Aqui entram os itens de IA das auditorias — nesta ordem de valor:*
- ⬜ Alertas inteligentes POR CARGO (corretor: "lead X esfriou, mande o vídeo do imóvel";
  gerente: "imóvel Y 120 dias parado, similares giram em 60 — reduza 3%";
  diretor: "receita caiu 10% com vendas estáveis — comissão média subiu")
- ⬜ Score de compra dinâmico (comportamento: visitas ao site, respostas, financiamento)
- ⬜ Argumentos de venda gerados por IA (perfil do lead × características do imóvel)
  + quebra de objeções sugerida
- ⬜ Resumo executivo diário em linguagem natural + perguntas livres sobre a base
  (function calling sobre o Prisma)
- ⬜ Comparativo de mercado (m² da região vs pedido, tempo médio de giro) — *exige fonte
  externa paga (ex.: dados de portais) ou base própria acumulada; começar com a base própria*
- ⬜ Automação lead → tarefa → WhatsApp → e-mail → follow-up · Meta Ads · XML portais
- ⬜ BI executivo: ROI, CAC por origem, LTV, ano vs ano · Busca semântica (pgvector)

## 🌊 ONDA 6 — Escala e plataforma
- ⬜ **Papel SUPERVISOR + times de corretores** (RBAC granular: supervisor vê só o time
  dele; gerente vê tudo sem folha individual) — *exige nova entidade Team; das auditorias*
- ⬜ API pública · Website builder · Observabilidade (Sentry) · 🔶 PWA entregue
- ⬜ Infra avançada somente quando métricas exigirem

---

## 🎯 PRÓXIMOS PASSOS

**Do Douglas (operacional):**
1. Stripe: criar conta + preencher as 5 env vars (STRIPE.md) + testar com cartão 4242
2. Rodar database/12 (boost do demo) se ainda não rodou · WhatsApp na Meta · onboarding
   dos 5 clientes · tours Matterport

**De desenvolvimento (nesta ordem):**
1. **Portal do Cliente** — fecha a Onda 3
2. **Onda 3.5 (quick wins Copiloto)** — 1 entrega, ~6 itens baratos acima
3. **Domínio próprio por tenant** — última pendência estrutural da Onda 3
4. **Onda 4 módulo a módulo** — começando por Financeiro (fluxo de caixa + comissões),
   depois documentos com badges, depois contratos/assinatura

## Princípios
1. **Produção toda semana.** 2. **Cliente pagante dita a ordem.** 3. **Supabase/Vercel até
doer.** 4. **O documento IMOBILIÁRIA-OS é o mapa; este roadmap é a rota.**
5. *(novo, 07/08)* **Inteligência por regras antes de IA** — 80% do valor percebido do
"copiloto" são queries bem feitas; IA entra quando as regras esgotarem.
