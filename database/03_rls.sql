-- =====================================================================
-- RLS — Row Level Security (isolamento multi-tenant no banco)
-- Estratégia: o backend define o tenant da sessão com
--   SET app.current_org = '<organizationId>';
-- e as políticas garantem que NENHUMA linha de outro tenant vaza,
-- mesmo se uma query esquecer o WHERE organizationId.
-- =====================================================================

-- Função auxiliar
CREATE OR REPLACE FUNCTION current_org() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_org', true)
$$;

-- Ative por tabela (repita o bloco para cada tabela com organizationId)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Agent','Contact','Property','Lead','Visit','Proposal',
    'Contract','Commission','FinanceEntry','Goal','BlogPost','Testimonial','Domain'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
        USING ("organizationId" = current_org())
        WITH CHECK ("organizationId" = current_org())
    $f$, t);
  END LOOP;
END $$;

-- Tabelas filhas (sem organizationId direto) — isolam via pai:
ALTER TABLE "PropertyMedia" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "PropertyMedia" USING (
  EXISTS (SELECT 1 FROM "Property" p WHERE p."id" = "propertyId" AND p."organizationId" = current_org())
);

ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Activity" USING (
  EXISTS (SELECT 1 FROM "Lead" l WHERE l."id" = "leadId" AND l."organizationId" = current_org())
);

ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Document" USING (
  ("propertyId" IS NOT NULL AND EXISTS (SELECT 1 FROM "Property" p WHERE p."id" = "propertyId" AND p."organizationId" = current_org()))
  OR
  ("contractId" IS NOT NULL AND EXISTS (SELECT 1 FROM "Contract" c WHERE c."id" = "contractId" AND c."organizationId" = current_org()))
);

ALTER TABLE "PropertyEvent" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "PropertyEvent" USING (
  EXISTS (SELECT 1 FROM "Property" p WHERE p."id" = "propertyId" AND p."organizationId" = current_org())
);

ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Favorite" USING (
  EXISTS (SELECT 1 FROM "Property" p WHERE p."id" = "propertyId" AND p."organizationId" = current_org())
);

-- IMPORTANTE (Prisma): a conexão do Prisma usa um único usuário de banco.
-- Para o RLS valer, execute em cada request/transação:
--   await prisma.$executeRaw`SELECT set_config('app.current_org', ${orgId}, true)`;
-- (o `true` limita ao escopo da transação)
