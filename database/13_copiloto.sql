-- =====================================================================
-- 13 — ONDA 3.5 (COPILOTO): campo estruturado de objeções do cliente
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "objections" TEXT;
