# WhatsApp no lead novo — guia de ativação (15–20 min)

O código já está pronto. Falta só criar o app na Meta e colar 2 variáveis.

## Passo a passo
1. Acesse https://developers.facebook.com -> **My Apps -> Create App**
   - Tipo: **Business** -> dê um nome (ex.: "Maison Notificações")
2. No app, adicione o produto **WhatsApp** (botão "Set up")
3. Na tela **API Setup** do WhatsApp você encontra:
   - **Temporary access token** -> é o `WHATSAPP_TOKEN` (para testar; depois gere um permanente em System Users)
   - **Phone number ID** -> é o `WHATSAPP_PHONE_ID`
   - Um número de teste da Meta já vem pronto; adicione os telefones dos
     corretores em "To" -> **Manage phone number list** (modo teste exige
     cadastrar os destinatários; em produção com número próprio, não)
4. Vercel -> Settings -> Environment Variables:
   - `WHATSAPP_TOKEN` = o token
   - `WHATSAPP_PHONE_ID` = o phone number id
5. **Redeploy** -> pronto: todo lead do site dispara WhatsApp ao corretor.

## Como funciona no código
- `src/lib/notify.ts` monta a mensagem e chama a Cloud API
- `src/app/actions.ts` chama o notify quando o formulário do site cria lead,
  já com o corretor escolhido pelo rodízio (`src/lib/assign.ts`)
- Sem as envs, nada quebra: a mensagem aparece em Vercel -> Logs

## Produção de verdade (depois)
- Conecte um número real da imobiliária (Business Manager -> WhatsApp Accounts)
- Gere token permanente: Business Settings -> System Users -> Add -> token com
  escopo `whatsapp_business_messaging`
- Fora da janela de 24h de conversa, a Meta exige *templates* aprovados —
  para notificação interna ao corretor (que pode iniciar conversa com o número
  de teste/da empresa), texto simples resolve na maioria dos casos.
