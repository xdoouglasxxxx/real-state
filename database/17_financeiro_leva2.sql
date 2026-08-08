-- =====================================================================
-- 17 — FINANCEIRO LEVA 2: parcelamento de comissão (valor pago parcial)
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================
ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill: comissões já pagas ficam com o valor integral quitado
UPDATE "Commission" SET "paidAmount" = "amount" WHERE "status" = 'PAID' AND "paidAmount" = 0;
