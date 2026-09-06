# PLAYWRIGHT E2E

Config real: `playwright.config.ts` + `tests/e2e/` (hoje: `site-publico.spec.ts`).

⚠️ **O baseURL padrão é PRODUÇÃO** (`https://maisonstate.vercel.app`).
Para desenvolver/testar local: `$env:BASE_URL="http://localhost:3000"` antes
de `npx playwright test` (com `npm run dev` rodando). NUNCA rode testes que
ESCREVEM dados contra produção sem autorização explícita.

Comandos: `npx playwright test` · `npx playwright test --headed` (ver o robô).

## FLUXOS PRIORITÁRIOS (do projeto real — não crie teste de feature inexistente)

Site público: home carrega, busca com filtros, `/imovel/[slug]` com galeria,
formulário de interesse → lead (com consentimento LGPD).

Autenticação: login válido/inválido por papel; CLIENT/OWNER → `/cliente`;
time → `/painel`; rota protegida sem sessão → `/login`; logout.

Painel: kanban de leads (drag), ficha com timeline, agenda (bloqueio de data
passada), financeiro, locação (pagamento → repasse).

Portal do Cliente: home com jornadas, favoritos (link `/imovel/[slug]`),
propostas + enviar nova proposta (ok=1 / erro=valor / erro=lead), visitas,
contratos com documentos, trocar senha em configurações.

## LOCATORS & ESPERA

Prefira `getByRole` / `getByLabel` / `getByPlaceholder` / `getByTestId`.
Evite nth-child, classes geradas e cadeias CSS frágeis.
NUNCA `page.waitForTimeout()` — use auto-waiting e web-first assertions.

## ISOLAMENTO & DADOS

Testes independentes de ordem; cada teste estabelece o próprio estado.
Dados sintéticos (seeds de `scripts/`); nunca dados reais de cliente.
Artefatos: screenshot/vídeo só em falha (já configurado); não acumular lixo.
