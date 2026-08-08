# WHATSAPP — Guia de ativação (Cloud API da Meta)

O código já está pronto e **desligado por padrão**: sem as 2 variáveis abaixo,
cada lead novo apenas registra a mensagem nos Logs da Vercel (procure por
`[notifyNewLead]`) e a operação segue normal. Com as variáveis, o corretor
que recebeu o lead ganha a mensagem no WhatsApp dele em segundos.

O que o sistema envia hoje (automático):
> 🏠 *Maison Estate* — novo lead!
> 👤 Fernanda Ryu
> 📱 (11) 94444-3333
> 🔎 Garden perto do Ibirapuera
> ➡️ Distribuído para: Rafael Moreno

> ⚠ Pré-requisitos: uma conta no Facebook e um número de telefone que NÃO
> esteja registrado num WhatsApp comum (a Meta fornece um número de teste
> grátis — comece por ele!).

---

## PARTE 1 — App na Meta (15 min, uma vez só)

1. Acesse **developers.facebook.com** → entre com sua conta do Facebook →
   **Meus apps → Criar app**.
2. Tipo: **Empresa (Business)** → dê um nome (ex.: "Imobiliaria OS") → criar.
3. Na tela do app, ache o card **WhatsApp** → **Configurar**. A Meta cria
   (ou pede para vincular) um **Portfólio empresarial** — siga o assistente.
4. Você cai em **WhatsApp → Configuração da API**. Essa é A TELA. Nela existem:
   - **Número de teste** já provisionado pela Meta (grátis, serve para validar tudo);
   - **"De" (Identificação do número de telefone)** → esse número longo é o
     **`WHATSAPP_PHONE_ID`** — copie;
   - **Token de acesso temporário** (24h) — serve para o primeiro teste.

## PARTE 2 — Destinatários de teste

5. Na mesma tela, em **"Para"**, adicione os números que vão RECEBER
   (o seu + o dos corretores de teste): **Gerenciar lista de números de
   telefone → adicionar** — cada número recebe um código de confirmação
   no WhatsApp. *(No modo teste, só números dessa lista recebem.)*

## PARTE 3 — Variáveis na Vercel

6. Vercel → projeto → Settings → Environment Variables (Production):

   | Nome                | Valor                                        |
   |---------------------|----------------------------------------------|
   | `WHATSAPP_TOKEN`    | o token de acesso (temporário ou permanente) |
   | `WHATSAPP_PHONE_ID` | a Identificação do número de telefone        |

7. **Redeploy** (Deployments → ⋯ → Redeploy).

## PARTE 4 — Testar

8. Confirme que o corretor de teste tem **telefone preenchido** no cadastro
   (Painel → Corretores) — é para o telefone DELE que a mensagem vai.
   O sistema adiciona o 55 do Brasil sozinho se faltar.
9. Abra o site público e preencha um formulário de visita num imóvel desse
   corretor. Em segundos: 🏠 *novo lead!* no WhatsApp dele.
10. Se não chegar: Vercel → Logs → procure `[notifyNewLead]` — o erro da Meta
    aparece na linha seguinte (token vencido e número fora da lista de teste
    são os dois clássicos).

## PARTE 5 — Token PERMANENTE (quando o teste funcionar)

O token da tela de configuração **expira em 24h**. Para produção:

11. **business.facebook.com → Configurações → Usuários → Usuários do sistema**
    → **Adicionar** (nome: "imobiliaria-os-bot", função: Administrador).
12. No usuário criado: **Adicionar ativos** → selecione o seu app → marque
    **Gerenciar app**.
13. **Gerar token** → selecione o app → marque as permissões
    **`whatsapp_business_messaging`** e **`whatsapp_business_management`**
    → gerar → **copie (ele não aparece de novo!)** → substitua o
    `WHATSAPP_TOKEN` na Vercel → Redeploy.

## PARTE 6 — Número oficial (produção de verdade, quando quiser)

O número de teste da Meta serve para operar internamente por semanas. Para
usar o número da imobiliária: WhatsApp → Configuração da API → **Adicionar
número de telefone** → verificação por SMS → o novo `WHATSAPP_PHONE_ID`
substitui o antigo na Vercel. A Meta pode pedir verificação do Portfólio
empresarial (CNPJ) — processo deles, 1-3 dias.

> 💳 Custo: conversas iniciadas pela empresa são cobradas pela Meta por
> conversa/24h (centavos). Com o volume de leads de uma imobiliária, é
> irrelevante — mas exige cartão cadastrado no Portfólio para sair do teste.

## Onde isso pluga no produto (hoje e amanhã)

- **Hoje:** lead novo → mensagem automática ao corretor responsável (rodízio
  ou corretor do imóvel).
- **Já construído, liga sozinho junto:** os alertas do painel (vencimentos,
  aluguéis em atraso) usam a mesma infraestrutura — próximos a ganhar canal.
- **Roadmap:** cobrança de aluguel ao locatário, aviso de repasse ao
  proprietário, confirmação de visita ao cliente.
