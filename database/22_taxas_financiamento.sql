-- =====================================================================
-- 22 — SIMULADOR v2: tabela de taxas de financiamento por banco (por tenant)
-- Idempotente. Rodar ANTES do deploy do adendo do simulador.
-- Formato do JSON: [{"banco":"Caixa","taxa":10.49},{"banco":"Itaú","taxa":11.29}]
-- =====================================================================
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "financingRates" JSONB;
