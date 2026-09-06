-- =====================================================================
-- 26 — TAREFAS / FOLLOW-UP DO CRM (mercado A2)
-- Idempotente. Rodar ANTES do deploy desta etapa.
-- O "próximo contato" do lead: tarefa com prazo, opcionalmente atribuída
-- a um corretor; aparece na ficha do lead, no dashboard e como badge.
-- =====================================================================

CREATE TABLE IF NOT EXISTS "Task" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "leadId"         TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "agentId"        TEXT REFERENCES "Agent"("id") ON DELETE SET NULL,
  "title"          TEXT NOT NULL,
  "dueAt"          TIMESTAMP(3) NOT NULL,
  "doneAt"         TIMESTAMP(3),
  "createdBy"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Task_organizationId_dueAt_idx"
  ON "Task"("organizationId", "dueAt");

CREATE INDEX IF NOT EXISTS "Task_leadId_idx"
  ON "Task"("leadId");

-- Conferência pós-execução:
-- SELECT count(*) FROM "Task";
