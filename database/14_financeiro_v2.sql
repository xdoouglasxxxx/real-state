-- =====================================================================
-- 14 — FINANCEIRO V2: rastreabilidade + vínculo com imóvel/corretor
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================
ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "agentId" TEXT;

DO $$ BEGIN
  ALTER TABLE "FinanceEntry"
    ADD CONSTRAINT "FinanceEntry_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinanceEntry"
    ADD CONSTRAINT "FinanceEntry_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "FinanceEntry_propertyId_idx" ON "FinanceEntry"("propertyId");
CREATE INDEX IF NOT EXISTS "FinanceEntry_agentId_idx" ON "FinanceEntry"("agentId");
