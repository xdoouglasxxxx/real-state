-- =====================================================================
-- 18 — ONDA 4.4: MÓDULO DE LOCAÇÃO (MVP) — contratos + réguas de cobrança
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================

-- Categorias novas no financeiro (DRE de locação usa o motor existente)
ALTER TYPE "FinCategory" ADD VALUE IF NOT EXISTS 'ALUGUEL_RECEBIDO';
ALTER TYPE "FinCategory" ADD VALUE IF NOT EXISTS 'REPASSE_LOCACAO';

-- Enums do módulo
DO $$ BEGIN
  CREATE TYPE "RentalType" AS ENUM ('LONG_STAY','FLEX','CORPORATE','TEMPORADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RentalStatus" AS ENUM ('ATIVO','ENCERRADO','RESCINDIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GuaranteeType" AS ENUM ('PROPRIA','SEGURO_FIANCA','CAUCAO','FIADOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RentPayStatus" AS ENUM ('PREVISTO','PAGO','ATRASADO','CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Contrato de locação
CREATE TABLE IF NOT EXISTS "RentalContract" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "propertyId" TEXT NOT NULL REFERENCES "Property"("id") ON UPDATE CASCADE,
  "ownerId" TEXT NOT NULL REFERENCES "Contact"("id") ON UPDATE CASCADE,
  "tenantId" TEXT NOT NULL REFERENCES "Contact"("id") ON UPDATE CASCADE,
  "agentId" TEXT REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "type" "RentalType" NOT NULL DEFAULT 'LONG_STAY',
  "status" "RentalStatus" NOT NULL DEFAULT 'ATIVO',
  "rentValue" DECIMAL(12,2) NOT NULL,
  "adminFeePct" DECIMAL(5,2) NOT NULL DEFAULT 10,
  "setupFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "guaranteeType" "GuaranteeType" NOT NULL DEFAULT 'FIADOR',
  "guaranteeFeePct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "dueDay" INTEGER NOT NULL DEFAULT 5,
  "reajusteIndex" TEXT NOT NULL DEFAULT 'IGP-M',
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "RentalContract_org_status_idx" ON "RentalContract"("organizationId","status");
CREATE INDEX IF NOT EXISTS "RentalContract_property_idx" ON "RentalContract"("propertyId");

-- Régua de cobrança (12+ parcelas pré-geradas por contrato)
CREATE TABLE IF NOT EXISTS "RentPayment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "contractId" TEXT NOT NULL REFERENCES "RentalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "referenceMonth" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "rentValue" DECIMAL(12,2) NOT NULL,
  "adminFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "guaranteeFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalBilled" DECIMAL(12,2) NOT NULL,
  "status" "RentPayStatus" NOT NULL DEFAULT 'PREVISTO',
  "paidAt" TIMESTAMP(3),
  "repasseAt" TIMESTAMP(3),
  "repasseValue" DECIMAL(12,2),
  "financeEntryId" TEXT
);
CREATE INDEX IF NOT EXISTS "RentPayment_org_status_due_idx" ON "RentPayment"("organizationId","status","dueDate");
CREATE INDEX IF NOT EXISTS "RentPayment_contract_idx" ON "RentPayment"("contractId");
