-- =====================================================================
-- 15 — ONDA 4.2 DOCUMENTOS: escopo por tenant, autor e vínculo financeiro
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "financeEntryId" TEXT;

-- Backfill do tenant a partir do imóvel ou do contrato já vinculados
UPDATE "Document" d SET "organizationId" = p."organizationId"
FROM "Property" p WHERE d."propertyId" = p."id" AND d."organizationId" IS NULL;

UPDATE "Document" d SET "organizationId" = c."organizationId"
FROM "Contract" c WHERE d."contractId" = c."id" AND d."organizationId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "Document"
    ADD CONSTRAINT "Document_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Document"
    ADD CONSTRAINT "Document_financeEntryId_fkey"
    FOREIGN KEY ("financeEntryId") REFERENCES "FinanceEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "Document_organizationId_idx" ON "Document"("organizationId");
CREATE INDEX IF NOT EXISTS "Document_financeEntryId_idx" ON "Document"("financeEntryId");
