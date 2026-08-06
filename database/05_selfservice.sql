-- =====================================================================
-- SELF-SERVICE — rodar no SQL Editor do Supabase (uma vez)
-- Adiciona credenciais de admin por tenant (login individual do painel)
-- =====================================================================
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "adminEmail" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "panelPassHash" TEXT;
