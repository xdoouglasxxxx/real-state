# SMOKE CHECK & HEALTH

Implementação real (não é conceito genérico):

- `scripts/smoke-check.mjs` — Daily Health Check: registry de checks com
  severidade **P0–P3**, health score, categorias em PT. Roda direto no banco.
- `scripts/health-history.mjs` — tendências, regressões e drift entre execuções.
- Rodar local: `node --env-file=.env scripts/smoke-check.mjs`

## CI (`.github/workflows/smoke.yml`)

Dispara em push na `main`, diariamente às 8h BRT e manual (workflow_dispatch).
Usa o secret `DATABASE_URL` do GitHub (recomendado: usuário Postgres
somente-leitura). Gera job summary com score e severidades.

## QUANDO O SMOKE FALHAR

Descubra a camada certa antes de mexer:

1. Dado real mudou (ex.: registro de teste apagado)? → ajustar expectativa
2. Regressão de código? → corrigir o código, não o check
3. Ambiente/env ausente? → reportar, não mascarar
4. O check está errado/desatualizado? → corrigir o check COM justificativa

NUNCA afrouxe um check (P0→INFO, threshold, skip) só para ficar verde —
mudança de severidade precisa de justificativa no commit.

## AO ADICIONAR FEATURE RELEVANTE

Considere adicionar um check correspondente ao registry do smoke-check
(padrão existente no script), para o health diário cobrir a feature nova.
