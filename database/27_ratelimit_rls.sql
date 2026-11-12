-- =====================================================================
-- 27 — RATE LIMIT + RLS EM TODAS AS TABELAS  (backlog C1 de segurança)
-- Idempotente. Seguro rodar ANTES ou DEPOIS do deploy: o código do rate
-- limit é fail-open (sem esta tabela ele só deixa de limitar, não quebra).
--
-- PARTE A — tabela do limitador (login, /criar, formulários, reset de senha).
--   Fica FORA do schema.prisma de propósito (acesso por SQL cru).
-- PARTE B — liga RLS em TODA tabela de public que ainda não tem.
--   Só o 03_rls.sql ativava RLS; tabelas criadas depois (Task, locação,
--   vistoria, contratos-modelo...) ficaram abertas à API REST/anon key do
--   Supabase. Com RLS ligado e SEM policy, anon/authenticated não leem nada.
--   O Prisma NÃO é afetado: conecta como dono das tabelas (ignora RLS) —
--   prova disso é o app já funcionar com as policies do 03 (que dependem de
--   app.current_org, que o app nunca define).
-- =====================================================================

-- ---------- PARTE A ----------
CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key"     TEXT PRIMARY KEY,
  "count"   INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- ---------- PARTE B ----------
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- ---------- CONFERÊNCIA (deve retornar 0 linhas) ----------
SELECT tablename AS "tabela_sem_rls"
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
