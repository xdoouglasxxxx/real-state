-- =====================================================================
-- 10 — MULTIUSUÁRIO POR TENANT (rodar no SQL Editor do Supabase)
-- Adiciona senha e status por usuário + backfill dos admins existentes.
-- Idempotente: pode rodar mais de uma vez sem quebrar nada.
-- RODAR ANTES do deploy do código desta etapa.
-- =====================================================================

-- 1) Novas colunas no User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- 2) Organizações antigas que têm adminEmail mas NENHUM usuário correspondente:
--    cria o usuário ORG_ADMIN faltante (o /criar sempre criou, mas seeds antigos não).
INSERT INTO "User" ("id", "email", "name", "role", "organizationId")
SELECT gen_random_uuid()::text, lower(o."adminEmail"), 'Administrador', 'ORG_ADMIN', o."id"
FROM "Organization" o
WHERE o."adminEmail" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."organizationId" = o."id" AND lower(u."email") = lower(o."adminEmail")
  );

-- 3) Backfill da senha: o usuário admin herda o hash que hoje vive na Organization
--    (mesmo formato scrypt salt:hash — o app lê os dois lugares).
UPDATE "User" u
SET "passHash" = o."panelPassHash"
FROM "Organization" o
WHERE u."organizationId" = o."id"
  AND lower(u."email") = lower(o."adminEmail")
  AND u."passHash" IS NULL
  AND o."panelPassHash" IS NOT NULL;

-- 4) Garante papel de admin para esses usuários (caso algum tenha ficado como AGENT)
UPDATE "User" u
SET "role" = 'ORG_ADMIN'
FROM "Organization" o
WHERE u."organizationId" = o."id"
  AND lower(u."email") = lower(o."adminEmail")
  AND u."role" NOT IN ('ORG_ADMIN', 'PLATFORM_ADMIN');

-- Conferência rápida (opcional): deve listar 1 admin com senha por organização
-- SELECT o."slug", u."email", u."role", (u."passHash" IS NOT NULL) AS tem_senha
-- FROM "Organization" o LEFT JOIN "User" u ON u."organizationId" = o."id"
-- ORDER BY o."slug";
