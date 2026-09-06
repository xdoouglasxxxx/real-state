-- =====================================================================
-- 23 — PORTAL DO CLIENTE: vínculo User ↔ Contact (User.contactId)
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- =====================================================================

-- Coluna opcional: nem todo usuário (admin/gerente/corretor) tem contato
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- Um contato só pode pertencer a um usuário (relação 1:1 opcional)
CREATE UNIQUE INDEX IF NOT EXISTS "User_contactId_key" ON "User"("contactId");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: cada User CLIENT/OWNER sem vínculo aponta para o Contact
-- MAIS ANTIGO com o mesmo e-mail na mesma organização (determinístico
-- quando há N contatos com o mesmo e-mail). O NOT EXISTS respeita o
-- UNIQUE quando o contato já pertence a outro usuário.
UPDATE "User" u
SET "contactId" = c.id
FROM (
  SELECT DISTINCT ON ("organizationId", lower(email))
         id, "organizationId", lower(email) AS email
  FROM "Contact"
  WHERE email IS NOT NULL
  ORDER BY "organizationId", lower(email), "createdAt" ASC, id ASC
) c
WHERE u."contactId" IS NULL
  AND u.role IN ('CLIENT', 'OWNER')
  AND u."organizationId" = c."organizationId"
  AND lower(u.email) = c.email
  AND NOT EXISTS (SELECT 1 FROM "User" u2 WHERE u2."contactId" = c.id);

-- Conferência pós-execução:
-- SELECT email, role, "contactId" FROM "User" WHERE role IN ('CLIENT','OWNER');
