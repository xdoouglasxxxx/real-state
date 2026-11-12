# Domínio próprio por imobiliária — como ligar e operar

O admin da imobiliária entra em **Configurações → Domínio próprio**, digita
`www.suaimobiliaria.com.br`, cria o registro de DNS que a tela mostra e clica **Verificar**.
O certificado SSL é emitido pela Vercel automaticamente. Código: `src/lib/vercel-domains.ts`.

## Ligar o recurso (uma vez, você)
1. Vercel → Account Settings → **Tokens** → Create (escopo da conta/time do projeto).
2. Vercel → seu projeto → Settings → General → copie o **Project ID**.
3. Se o projeto está dentro de um **Team**, copie também o Team ID (Team Settings → General).
4. Vercel → Environment Variables (sem aspas): `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`
   e, se houver Team, `VERCEL_TEAM_ID`. **Redeploy.**

Sem as duas primeiras, a tela fica em modo informativo (não quebra nada).

## ⚠️ Teste primeiro com um domínio descartável
Essa integração foi escrita contra a documentação da API da Vercel, mas **nunca foi executada
contra a API real**. Antes de oferecer a um cliente: conecte um domínio seu de teste, siga o
fluxo inteiro (adicionar → DNS → verificar → abrir o site → remover). Se algo falhar, o painel
mostra uma mensagem genérica e o motivo exato aparece em **Vercel → Logs**
(procure `addTenantDomain` / `verifyTenantDomain`).

## O que o cliente cria no DNS
| Domínio digitado | Registro |
|---|---|
| `www.cliente.com.br` (subdomínio) | **CNAME** `www` → valor mostrado na tela (padrão `cname.vercel-dns.com`) |
| `cliente.com.br` (raiz) | **A** `@` → valor mostrado na tela (padrão `76.76.21.21`) |
| se a tela pedir | **TXT** com o nome/valor exibidos (prova de posse) |

Dica comercial: oriente o cliente a conectar `www` **e** a raiz (são 2 cadastros). O sistema
trata `site.com.br` e `www.site.com.br` como o mesmo tenant.

## Regras embutidas
- Máximo de 3 domínios por imobiliária; só ADMIN (ou master) gerencia.
- Bloqueados: domínio da plataforma, `*.vercel.app`, `localhost`. Um host só pertence a um tenant.
- O 1º domínio **verificado e ativo** vira "principal" e passa a ser usado no feed de portais,
  no sitemap e no robots.
- Cookies de login são por host: no domínio próprio o usuário faz login de novo (normal).

## Por que isso é essencial hoje
Sem domínio da plataforma com curinga (`*.suaplataforma.com.br`), **só um tenant abre
publicamente em maisonstate.vercel.app** — os demais só aparecem para quem logou (cookie).
Domínio próprio por cliente resolve isso sem você comprar nada. Quando comprar o domínio da
plataforma, `NEXT_PUBLIC_ROOT_DOMAIN` passa a apontar para ele e os subdomínios ligam sozinhos.
