-- =====================================================================
-- 19 — LOCAÇÃO 2B: status RENTED, multa rescisória e vínculo formal
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================
ALTER TYPE "PropStatus" ADD VALUE IF NOT EXISTS 'RENTED';
ALTER TYPE "FinCategory" ADD VALUE IF NOT EXISTS 'MULTA_RESCISORIA';

-- Vínculo formal RentPayment → FinanceEntry (era referência solta)
DO $$ BEGIN
  ALTER TABLE "RentPayment"
    ADD CONSTRAINT "RentPayment_financeEntryId_fkey"
    FOREIGN KEY ("financeEntryId") REFERENCES "FinanceEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "RentPayment_financeEntryId_idx" ON "RentPayment"("financeEntryId");
