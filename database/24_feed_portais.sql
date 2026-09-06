-- =====================================================================
-- 24 — FEED XML PARA PORTAIS: Organization.feedToken
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- Token secreto na URL do feed (/api/feed/vrsync?token=...) — permite
-- ZAP/VivaReal/OLX lerem os imóveis do tenant sem autenticação de sessão.
-- =====================================================================

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "feedToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_feedToken_key"
  ON "Organization"("feedToken");

-- Backfill: token aleatório de 32 hex para quem ainda não tem.
-- (md5 de random+relógio+id — suficiente como segredo de URL; pode ser
--  regenerado a qualquer momento pela tela de Configurações.)
UPDATE "Organization"
SET "feedToken" = md5(random()::text || clock_timestamp()::text || id)
WHERE "feedToken" IS NULL;

-- Conferência pós-execução:
-- SELECT slug, "feedToken" FROM "Organization";
