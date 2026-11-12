# LANÇAMENTO — checklist na ordem certa

Estado: o código do produto está completo para operar com clientes reais. O que resta é
**deploy deste pacote** + **contas externas** (só você pode criar) + **verificações**.

## 1) Aplicar este pacote (nesta ordem)
1. **Staging primeiro** (`staging-maison`), conforme CLAUDE.md: extraia o ZIP na raiz do repo,
   `git add -A ; git commit -m "lancamento: dominio por tenant, reset de senha, rate limit, metas" ; git push`.
2. **Supabase → SQL Editor:** rode `database/27_ratelimit_rls.sql`. Idempotente. O resultado final
   (SELECT de conferência) deve vir **vazio**. Pode rodar antes ou depois do deploy — o rate limit
   é fail-open (sem a tabela ele só não limita).
3. Valide em staging (seção 2). Só então a mesma sequência na `main`.
4. As envs novas são **opcionais** (cada recurso liga quando você preencher): `RESEND_API_KEY` +
   `MAIL_FROM` (EMAIL.md) e `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` [+ `VERCEL_TEAM_ID`] (DOMINIOS.md).
   Env nova só vale após **Redeploy**.

## 2) Verificações pós-deploy (~10 min)
| # | Teste | Esperado |
|---|---|---|
| 1 | Faça 1 login e rode `SELECT * FROM "RateLimit";` | linhas `login:ip:...` e `login:email:...` |
| 2 | 11 logins errados seguidos com o mesmo e-mail | a 11ª tentativa mostra "Muitas tentativas" |
| 3 | `/esqueci` sem Resend configurado | aviso de que o envio não está ativo |
| 4 | `/esqueci` com Resend → e-mail → link → nova senha → mesmo link de novo | funciona 1 vez; o 2º uso diz "inválido/já usado" |
| 5 | Painel → **Metas** → defina a meta do mês → Dashboard | barra de meta passa a mostrar % |
| 6 | `/sitemap.xml` e `/robots.txt` | URLs com o host real (não `slug.maisonstate.vercel.app`) |
| 7 | Formulário de visita: preencher o campo escondido `website` (DevTools) | "sucesso", mas **nenhum lead** criado |
| 8 | Configurações → Domínio (com token) usando domínio de teste seu | fluxo completo do DOMINIOS.md |
| 9 | Cliente envia proposta pelo portal (com `WHATSAPP_*` ativos) | corretor recebe a mensagem |

Se o teste 2 não limitar, veja **Vercel → Logs** por `rateLimit (fail-open)`: indica que a
tabela não existe (SQL 27 não rodou) ou o SQL do limitador foi recusado.

## 3) O que só você pode fazer
- [ ] **Stripe:** conta + 5 env vars + teste com cartão 4242 (STRIPE.md)
- [ ] **WhatsApp:** app na Meta + `WHATSAPP_TOKEN`/`WHATSAPP_PHONE_ID` (WHATSAPP.md)
- [ ] **Resend** (EMAIL.md) e **token da Vercel** (DOMINIOS.md)
- [ ] **Domínio de cada cliente:** conectar ANTES de registrar o feed dele nos portais
- [ ] **Feed nos portais:** Configurações → Integração com portais → cadastrar a URL no ZAP/Canal Pro etc.
- [ ] **Onboarding dos 5 clientes** (por `/criar` ou assistido) + troque as senhas master (`PAINEL_PASS`)
- [ ] **Tours Matterport** da demo (trocar IDs mortos pelo painel)

## 4) Antes de cobrar clientes (infra)
- **Vercel Hobby:** o plano é destinado a uso pessoal/não comercial — leia os termos atuais e
  migre para um plano compatível com operação comercial antes de cobrar.
- **Supabase free:** pausa por inatividade e não tem backups diários — migre para plano pago
  antes de armazenar dados reais de clientes (LGPD pede capacidade de recuperação).
- Se o Supabase pausar, o site e o login caem. Isso é o risco nº 1 do plano gratuito.

## 5) Fora deste pacote (de propósito)
| Item | Por quê |
|---|---|
| Onda 5 (IA, BI com ROI/CAC, automações, busca semântica) | open-ended; ROI/CAC exigem registrar custo de mídia (decisão de produto + schema) |
| Etapas do funil customizáveis | `LeadStage` é enum do banco; mexe em dados/kanban/dashboards — pede desenho próprio |
| Assinatura digital (Clicksign/ZapSign), Google Calendar | dependem de contas externas suas |
| Log de auditoria universal, badges documentais | exigem tabela/desenho novos; a autoria na timeline já cobre o essencial |
| LGPD: exportar/excluir dados de um contato | próximo item de segurança (C1) |
| Papel SUPERVISOR + times, API pública, website builder | Onda 6 — só com demanda de cliente |

## 6) O que NÃO foi verificado neste pacote
- Sem `node_modules`/rede no ambiente de desenvolvimento: **não rodei `tsc` completo nem `next build`**.
  Usei verificador estático (testado com erros injetados) + conferência dos campos contra o
  `schema.prisma` + 13 testes unitários. **O build da Vercel é o juiz** — se acusar erro, é pequeno
  e localizado; mande o log.
- SQL 27 e as chamadas à API da Vercel nunca rodaram contra sistemas reais.
