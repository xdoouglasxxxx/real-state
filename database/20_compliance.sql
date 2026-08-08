-- =====================================================================
-- 20 — ONDA 4.5: COMPLIANCE CAMADA 1 (LGPD + COAF + CRECI)
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================

-- LGPD (Lei 13.709): registro do consentimento na captação
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lgpdConsentAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lgpdIp" TEXT;

-- CRECI (Lei 6.530): validade e UF do registro do corretor
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "creciUf" TEXT;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "creciValidUntil" TIMESTAMP(3);

-- COAF (Lei 9.613 / COFECI): pagamento em espécie no contrato de venda
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "cashAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "coafReportedAt" TIMESTAMP(3);
