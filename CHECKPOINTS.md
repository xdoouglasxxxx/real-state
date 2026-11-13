# CHECKPOINTS — plano ativo (do mais fácil ao mais difícil)

Atualizado em 12/11/2026. O `ROADMAP.md` é o mapa grande do produto; este arquivo é a
**rota curta que estamos percorrendo agora**. Um checkpoint por vez. Ao cumprir, troque
`[ ]` por `[x]` e faça commit.

Tamanho (relativo, não é prazo): **P** pequeno · **M** médio · **G** grande · **GG** grande e
depende de terceiros.

## Visão geral

| CP | Entrega | Tam. | Depende de | Estado |
|---|---|---|---|---|
| **0** | Fechar o lançamento (validar, limpar, publicar na `main`) | P | — | 🔶 em andamento |
| **1** | Mapa dos imóveis | P | CP0 | 🔶 aplicado; falta validar |
| **2** | Visual B (grafite) no painel | P–M | CP0 | 🔶 código pronto |
| **3** | Dashboard interativo (período, corretor, funil, origem) | M | CP2 (recomendado) | 🔶 código pronto |
| **4** | Financeiro com gráficos | M | CP3 (reaproveita os gráficos) | 🔶 código pronto |
| **5** | Agente IA, fase 1: resumo do dia por regras (sem IA externa) | M | CP1 | 🔶 código pronto |
| **S** | Site público modernizado (vitrine escura, direção D) — antes do CP6 | M | CP2 | 🔶 código pronto |
| **6** | Agente IA, fase 2: chat com IA real | G | CP5 e T6 | ⬜ |
| **7** | Agente IA, fase 3: respostas automáticas no WhatsApp | GG | CP6 e T2 | ⬜ |

A trilha **T** (contas e infra, só você faz) corre em paralelo e está no fim do arquivo.

## Como trabalhamos cada checkpoint

1. **Base atual:** você gera um ZIP limpo do repositório e me envia. Nunca trabalhamos sobre
   cópia velha (foi assim que um fix meu desfez o seu JSON-LD).
   `git archive --format=zip -o "$env:USERPROFILE\Downloads\repo-atual.zip" HEAD`
2. **Entrega:** eu devolvo um ZIP testado (verificador estático + testes unitários; quando é
   tela, também teste em navegador).
3. **Aplicar na `staging-maison`:** `Expand-Archive ... -DestinationPath . -Force` →
   `git status` (a lista tem que bater com a que eu informar) → commit → push → Vercel *Ready*.
4. **Validar** pela lista "Pronto quando" → marcar `[x]` → publicar na `main`.
5. Build quebrou? Cole o log aqui. Costuma ser correção pequena e localizada.

---

## CP0 — Fechar o lançamento  ·  P  ·  🔶

Sem código novo; é conferir e arrumar o que já está no ar.

Pronto quando:
- [ ] **RLS ligado em tudo.** No SQL Editor:
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;`
      retorna **0 linhas**.
- [x] Rate limit gravando e bloqueando (provado: tabela `RateLimit` com contadores e a tela
      "Muitas tentativas" no login).
- [ ] Deploy da `staging-maison` **Ready** com o fix da página do imóvel (breadcrumbs, JSON-LD
      e honeypot juntos).
- [ ] Testes 3 a 6 do `LANCAMENTO.md` §2: `/esqueci` avisa que o e-mail está inativo; metas
      salvam e mexem na barra do dashboard; `/sitemap.xml` e `/robots.txt` com o host real.
- [ ] **Apagar a imobiliária "TESTE LANÇAMENTO"** (rode um `SELECT` antes do `DELETE`).
- [ ] **Remover arquivos soltos na raiz:** `git rm page.tsx globals.css`. O `page.tsx` é cópia
      da página do imóvel e dispara o alerta de "arquivos-fantasma" do smoke check; o
      `globals.css` da raiz não é usado (o app importa `src/app/globals.css`).
- [ ] **Publicar na `main`** (staging e produção usam o mesmo banco; o SQL 27 já vale):
      `git switch main ; git merge --ff-only staging-maison ; git push ; git switch staging-maison`
- [ ] Smoke Check do GitHub verde na `main`.

## CP1 — Mapa dos imóveis  ·  P  ·  🔶

Entrega: `/painel/mapa` com pins por status, filtros (inclui "Sem visita 90+ dias", a mesma
regra do alerta do dashboard), agrupamento, lista lateral, detalhe e link para o cadastro.
Sem biblioteca nova. Guia: `MAPA.md`.

Pronto quando:
- [ ] ZIP aplicado: `git status` mostra **7 arquivos novos** e **2 alterados** (`layout.tsx`
      e `ROADMAP.md`); commit; push; Vercel *Ready*.
- [ ] Login na demo Maison → menu **Mapa** → imóveis aparecem (pins ou agrupamentos).
- [ ] Chips com contagens coerentes; **"Sem visita 90+ dias"** tem a mesma contagem do alerta
      do dashboard.
- [ ] Clicar num imóvel mostra o detalhe; **Abrir imóvel** abre o cadastro certo.
- [ ] Celular: sem rolagem lateral; rótulos não cortados.
- [ ] Um imóvel sem latitude/longitude gera o aviso (e preencher a localização o faz aparecer).
- [ ] **Decisão:** provedor de tiles. Fica no OpenStreetMap por ora (uso moderado). Se a base
      crescer, trocar por provedor com chave via `NEXT_PUBLIC_MAP_TILE_URL` (ver `MAPA.md`).

## CP2 — Visual B (grafite) no painel  ·  P–M  ·  🔶

Entrega: painel em grafite com a cor da marca do tenant como único destaque; rótulos legíveis
(contraste AA); ícones desenhados no lugar dos emojis dos alertas. **Só `/painel/*`**: o site
público e o portal do cliente não mudam.

Como: variáveis de cor **escopadas no painel** (`.panel`), para os componentes atuais
(`.kpi`, `.ficha-box`, `.table`, `.pill`...) se re-tematizarem sem reescrever tela por tela.
Arquivos: `src/app/painel/painel-theme.css` (tema), `src/lib/contrast.ts` (cor da marca → acento
legível), `NavLink` (menu com item ativo), `AlertIcon` (ícones dos alertas), fonte Inter no
`globals.css`. Medido em navegador: todos os textos da amostra com contraste AA em 4 cores de
marca (dourado, azul-marinho, preto, vinho). **Fora deste checkpoint:** os emojis coloridos das
outras telas (✔ ⚠ simples ficam; 💬 do WhatsApp fica) e o tema claro.

Pronto quando:
- [ ] Todas as telas do painel revisadas em desktop **e** celular: dashboard, leads (kanban e
      ficha), agenda, imóveis, mapa, corretores, metas, documentos, locação, financeiro,
      usuários, assinatura, modelos, configurações, conta.
- [ ] Site público e portal do cliente **idênticos** ao de antes.
- [ ] Rótulos e textos pequenos com contraste ≥ 4,5:1.
- [ ] Testado com um tenant de cor de marca diferente do dourado.
- [ ] Decisão registrada: tema claro (opção A do protótipo) fica para depois ou não.

## CP3 — Dashboard interativo  ·  M  ·  🔶

Entrega: abas **Mês / Trimestre / Ano**, filtro por **corretor**, funil com conversão por etapa
e destaque, rosca "De onde vêm", lista "Por corretor" clicável, variação contra o período
anterior. Período e corretor ficam **na URL** (dá para compartilhar o link da visão).

Arquivos: `src/lib/dashboard.ts` (consultas), `periods.ts`, `funnel.ts`, `dash-calc.ts` (lógica
pura), `DashFilters`/`FunnelCard`/`SourceDonut` (peças interativas), `page.tsx`. O `data.ts` não
foi tocado. Gráficos próprios (CSS/SVG), sem biblioteca. Regras de cálculo e consultas de
conferência: `DASHBOARD.md`.

Pronto quando:
- [ ] Os números de dois períodos batem com uma conferência por SQL.
- [ ] Usuário com papel corretor só enxerga os próprios números.
- [ ] Trocar de período/corretor responde rápido (funções em `gru1`, banco em `sa-east-1`).
- [ ] Período sem dados mostra estado vazio, sem quebrar nem dividir por zero.
- [ ] Funciona no celular.

## CP4 — Financeiro com gráficos  ·  M  ·  🔶

Entrega: fluxo de caixa de 10–12 meses (receitas × despesas + linha de saldo) com tooltip e
seleção de mês; cartões do mês escolhido; receitas por tipo. Reaproveita os componentes de
gráfico do CP3.

Arquivos: `src/lib/finance-chart.ts` (série e escala), `CashFlowChart` (gráfico), `DonutCard` (rosca
genérica, que o dashboard do CP3 também usa), `financeiro/page.tsx`. O `data.ts` não foi tocado. O gráfico
usa a mesma base de caixa e a mesma janela de mês dos KPIs/DRE. Detalhes, a questão antiga de fuso e a
consulta de conferência: `FINANCEIRO-GRAFICOS.md`.

Pronto quando:
- [ ] Os totais batem com a tabela e com a exportação atuais do financeiro.
- [ ] Mês sem movimento não quebra o gráfico.
- [ ] Continua restrito a administrador (como hoje).
- [ ] Valores usam `Decimal` como string (regra do `CLAUDE.md`).

## CP5 — Agente IA, fase 1: resumo do dia por regras  ·  M  ·  🔶

Entrega: tela **Agente** com as sugestões do dia **geradas por regras** (nenhuma IA externa):
contrato parado, imóveis sem visita (com atalho para o **mapa já filtrado**), leads sem
resposta, visitas de amanhã, tarefas vencidas. Cada sugestão traz um **rascunho de mensagem**
por modelo; **Aprovar** abre o WhatsApp com a mensagem pronta (`wa.me`). Nada sai sozinho.
"Feito" grava na timeline do lead (sem tabela nova).

Por que antes da IA real: 80% do valor percebido do "copiloto" são consultas bem feitas
(princípio nº 5 do `ROADMAP.md`) — e sai sem custo, sem risco de privacidade.

Arquivos: `src/lib/agent-day.ts` (regras e "feito/dispensar"), `agent-drafts.ts` (rascunhos, telefone, link do
WhatsApp), `src/app/painel/agente/` (tela e ação), item "Agente do dia" no menu e o atalho `?filtro=parado` do mapa.
Mexe também em `toggleTask` (aceita `back=agente`). Regras, o que ele não faz e consultas de conferência: `AGENTE.md`.

Pronto quando:
- [ ] Cada sugestão corresponde a dado real (conferido com o dashboard).
- [ ] Corretor só vê as sugestões dos próprios leads e visitas.
- [ ] Rascunhos usam só o primeiro nome do cliente; nenhum dado sai do sistema.
- [ ] Aprovar/dispensar não duplica anotações na timeline.

## CPS — Site público: vitrine moderna em escuro refinado (direção D)  ·  M  ·  🔶

Entrega: cabeçalho com busca, WhatsApp e **logo do tenant**; home (busca, destaques, **mapa público**,
como funciona, bairros reais, equipe, depoimentos, vender); listagem com busca por texto, quartos,
exclusivos e **vista em mapa**; cartão de imóvel novo; páginas internas re-temadas. Detalhes e regras: `SITE.md`.

**Pronto quando:**
- [ ] ZIP aplicado e build da Vercel **Ready** (os tipos do Prisma só a Vercel confere).
- [ ] Home da Maison em computador **e** celular: sem rolagem lateral, menu abre/fecha, botão de WhatsApp no menu.
- [ ] Tenant de teste **sem** logo, telefone e CRECI: sem botão de WhatsApp, sem rodapé com "·" solto.
- [ ] Cadastrar um logo `https://` em Configurações → aparece no cabeçalho e no rodapé; um `http://` é ignorado.
- [ ] Trocar a cor da marca (inclusive uma muito escura ou muito clara) → destaque continua legível.
- [ ] `/imoveis?type=xyz&price=abc` mostra a lista normal (nunca imóveis de demonstração).
- [ ] Mapa: pins levam ao imóvel; condomínio com vários imóveis na mesma célula abre uma lista.
- [ ] Página do imóvel: **sem** mapa do Google; só o círculo de região; "Ver código-fonte" não mostra a coordenada exata (JSON-LD arredondado).
- [ ] **Decisão:** textos de promessa ("48 h", "sem custo", "assessoria jurídica") ficam fixos ou o cliente edita?
- [ ] **Decisão:** provedor de tiles para o tráfego público (`NEXT_PUBLIC_MAP_TILE_URL`).
- [ ] **Decisão:** remover os campos "tinta" e "creme" de Configurações (agora sem efeito).

## CP6 — Agente IA, fase 2: chat com IA real  ·  G  ·  ⬜

Entrega: pergunta livre ("Quais imóveis estão há 90+ dias sem visita?") respondida por um
modelo de IA que **só consulta dados por funções somente-leitura**, sempre filtradas por
imobiliária e por papel. O agente sugere; a ação continua sendo aprovada por uma pessoa.

Pronto quando:
- [ ] Chave de API de IA na Vercel; **teto mensal de custo** definido e aplicado.
- [ ] Limite de uso por tenant/plano e por IP (reaproveita `allow()`).
- [ ] Telefones e e-mails **mascarados** antes de ir ao modelo; logs sem dados pessoais.
- [ ] **Teste de isolamento:** usuário da imobiliária A nunca recebe dado da B.
- [ ] **Teste de injeção:** texto malicioso escrito por um lead não muda o comportamento.
- [ ] Política de Privacidade atualizada citando o fornecedor de IA.
- [ ] Custo médio por pergunta medido e comparado ao preço do plano.

Decisões suas: modelo/teto de custo, quais planos incluem, por quanto tempo guardar o
histórico das conversas.

## CP7 — Agente IA, fase 3: WhatsApp automático  ·  GG  ·  ⬜

Entrega: o agente responde leads no WhatsApp (por exemplo, fora do horário comercial) e
**passa para o corretor** quando precisa, com consentimento e histórico na timeline.

Pronto quando:
- [ ] Webhook de entrada com **verificação de assinatura** da Meta.
- [ ] Janela de 24 h e modelos de mensagem aprovados respeitados.
- [ ] Cliente consegue sair ("parar") e isso é respeitado.
- [ ] Tabela de conversas (`database/28`) já nascendo com RLS ligado.
- [ ] Passagem para humano testada ponta a ponta.
- [ ] Número de produção verificado na Meta.

Atenção: a aprovação da Meta (verificação do negócio e modelos) é prazo de terceiro e pode
levar bem mais que o código. Comece **T2** cedo.

---

## Trilha T — contas e infra (só você faz)

| # | Item | Guia | Destrava |
|---|---|---|---|
| T1 | Conta **Stripe** + 5 variáveis + teste com cartão 4242 | `STRIPE.md` | cobrança automática |
| T2 | App na **Meta** (WhatsApp Cloud API) | `WHATSAPP.md` | notificações; **CP7** |
| T3 | Conta **Resend** | `EMAIL.md` | "esqueci minha senha" |
| T4 | Token da Vercel + **teste com domínio descartável** | `DOMINIOS.md` | domínio próprio dos clientes |
| T5 | **Planos pagos:** Vercel (termos comerciais) e Supabase (backup, sem pausa) | `LANCAMENTO.md` §4 | cobrar clientes com segurança |
| T6 | Chave de API de IA + teto de custo | — | **CP6** |
| T7 | Onboarding dos 5 clientes + domínio de cada um + feed nos portais | `LANCAMENTO.md` §3 | uso real |

**T4 antes de T7:** hoje só um tenant abre publicamente em `maisonstate.vercel.app`; cada
cliente precisa do próprio domínio (ou do domínio da plataforma) para o site ser visto por
quem não fez login. Só cadastre o feed de um cliente nos portais depois do domínio dele.

## Fora do plano por enquanto

Landing page e domínio da plataforma (adiados por decisão sua) · etapas do funil
customizáveis (`LeadStage` é enum do banco) · assinatura digital (Clicksign/ZapSign) ·
log de auditoria universal · exportação/exclusão de dados pessoais (LGPD) · Onda 6 do
`ROADMAP.md`. Entram quando o cliente pagante pedir.

## Regras que valem em todos os checkpoints

- Toda consulta filtra por `organizationId`; toda mutação valida a posse antes de gravar.
- Banco muda **só por SQL numerado** em `database/`, e tabela nova já nasce com RLS ligado.
- Sem dependência nova sem a sua aprovação.
- Cor só por token do tema; **nunca** hex solto em classe do Tailwind.
- `redirect()` fora de `try/catch` (ou `rethrowRedirect` na primeira linha do `catch`).
- Ação pública ou sensível usa `allow()` (rate limit).
