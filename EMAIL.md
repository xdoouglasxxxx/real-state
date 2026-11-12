# E-mail transacional (Resend) — ativação em ~15 min

Hoje o e-mail serve ao **"Esqueci minha senha"** (`/esqueci` → `/redefinir`). O código usa
`fetch` direto na API do Resend (`src/lib/mailer.ts`) — sem dependência nova.

**Sem as envs, nada quebra:** a página `/esqueci` avisa que o envio não está ativo e orienta
a pedir ao admin da imobiliária (Painel → Usuários → redefinir senha).

## Passo a passo
1. Crie a conta em https://resend.com (há plano gratuito — confira os limites atuais no site).
2. **Domains → Add Domain** e crie no DNS do seu domínio os registros que o Resend mostrar
   (SPF/DKIM). Sem domínio verificado o Resend só entrega para o e-mail da própria conta —
   serve para testar, não para clientes.
3. **API Keys → Create** → copie a chave.
4. Vercel → Settings → Environment Variables (sem aspas):
   - `RESEND_API_KEY` = a chave
   - `MAIL_FROM` = `Sua Marca <nao-responda@seudominio.com.br>` (o domínio tem que ser o verificado)
5. **Redeploy.**

## Como testar
- `/esqueci` → seu e-mail de admin → o e-mail chega → o link abre `/redefinir`.
- Defina a nova senha (mín. 8) → volta ao `/login` com "Senha redefinida".
- Abra o MESMO link de novo → "inválido, expirou ou já foi usado" (uso único funcionando).
- Peça com um e-mail inexistente → mesma mensagem de sucesso (de propósito: não revela quem tem conta).

## Segurança do desenho
- Token stateless (HMAC com `AUTH_SECRET`, 1h). A "impressão" da senha atual vai dentro do token:
  trocou a senha → todo link anterior morre. Nada é guardado no banco.
- Link montado por `getBaseUrl()`, que só confia em hosts da plataforma/tenants cadastrados.
- Limites: 6 pedidos/h por IP e 3/h por e-mail (tabela `RateLimit`, database/27).
