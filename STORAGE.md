# SUPABASE STORAGE — Guia de ativação (5 minutos)

O módulo Documentos usa um bucket PRIVADO no mesmo projeto Supabase do banco.
Sem os passos abaixo, a tela funciona (lista/baixa documentos antigos por URL),
mas o botão de upload avisa que o storage está desligado.

## PARTE 1 — Criar o bucket

1. Supabase → seu projeto → menu **Storage** → **New bucket**.
2. Nome: `documentos` (exatamente assim, minúsculo).
3. **Public bucket: DESLIGADO** (privado — o app gera links assinados de 1h).
4. Create.

## PARTE 2 — Variáveis na Vercel

5. Supabase → **Settings → API**. Copie dois valores:
   - **Project URL** (ex.: `https://abcdefgh.supabase.co`)
   - **service_role key** (⚠ a SECRETA, não a anon — role para baixo até "service_role")
6. Vercel → maisonstate → Settings → Environment Variables (Production):

   | Nome                        | Valor                       |
   |-----------------------------|-----------------------------|
   | `SUPABASE_URL`              | Project URL                 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key            |

7. **Redeploy** (Deployments → ⋯ → Redeploy).

## PARTE 3 — Testar

8. Painel → **Documentos** → escolha um PDF pequeno → tipo "Matrícula" →
   vincule a um imóvel → **Enviar com rastreabilidade**.
9. O arquivo aparece na tabela; **Baixar** abre via link assinado.
10. Abra a ficha do imóvel vinculado: o badge **Matrícula ✅** acende.

## Segurança (como funciona)

- A service_role NUNCA vai ao navegador: o servidor gera URLs assinadas curtas
  (upload e download) e só entrega a quem passou pela sessão do painel.
- Cliente do portal só baixa documentos dos CONTRATOS das negociações dele.
- Upload vai DIRETO do navegador ao bucket (não passa pelo nosso servidor) —
  por isso aceita arquivos grandes sem mexer em limites do Next.

## Problemas comuns

- **"Storage não configurado"** → faltou variável ou redeploy.
- **Falha 400/404 no envio** → o bucket não se chama exatamente `documentos`.
- **Baixar dá 503** → service_role errada (copiou a anon?).
