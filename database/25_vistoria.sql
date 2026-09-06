-- =====================================================================
-- 25 — VISTORIA DIGITAL DE LOCAÇÃO (entrada/saída)
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- Uma vistoria de ENTRADA e uma de SAÍDA por contrato de locação;
-- ambientes/fotos ficam em JSON (rooms) — v1 sem tabelas auxiliares.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE "InspectionKind" AS ENUM ('ENTRADA', 'SAIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionStatus" AS ENUM ('RASCUNHO', 'CONCLUIDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Inspection" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "organizationId"   TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "rentalContractId" TEXT NOT NULL REFERENCES "RentalContract"("id") ON DELETE CASCADE,
  "kind"             "InspectionKind" NOT NULL,
  "status"           "InspectionStatus" NOT NULL DEFAULT 'RASCUNHO',
  "inspectedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "inspectorName"    TEXT,
  "notes"            TEXT,
  "rooms"            JSONB NOT NULL DEFAULT '[]',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Inspection_rentalContractId_kind_key"
  ON "Inspection"("rentalContractId", "kind");

CREATE INDEX IF NOT EXISTS "Inspection_organizationId_idx"
  ON "Inspection"("organizationId");

-- Conferência pós-execução:
-- SELECT count(*) FROM "Inspection";
