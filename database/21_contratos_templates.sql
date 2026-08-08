-- =====================================================================
-- 21 — ONDA 4.3 FASE 1: MODELOS DE CONTRATO (gerador de documentos)
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE "TemplateKind" AS ENUM ('VENDA','LOCACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ContractTemplate" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "kind" "TemplateKind" NOT NULL,
  "name" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ContractTemplate_org_kind_idx" ON "ContractTemplate"("organizationId","kind");
