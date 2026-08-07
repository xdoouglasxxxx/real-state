-- =====================================================================
-- 16 — DOCUMENTOS: novos tipos no enum DocKind (idempotente)
-- Rodar ANTES do deploy. Complementa o 15_documentos.sql.
-- =====================================================================
ALTER TYPE "DocKind" ADD VALUE IF NOT EXISTS 'ONUS';
ALTER TYPE "DocKind" ADD VALUE IF NOT EXISTS 'COMPROVANTE';
ALTER TYPE "DocKind" ADD VALUE IF NOT EXISTS 'RG';
ALTER TYPE "DocKind" ADD VALUE IF NOT EXISTS 'CPF';
