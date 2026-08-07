-- =====================================================================
-- 12 — BOOST DO DEMO MAISON PRIME: vendas do mês atual + ranking vivo
-- Idempotente (IDs mp2_* + ON CONFLICT DO NOTHING; UPDATEs re-aplicáveis).
-- Rodar DEPOIS do 11_demo_maison_prime.sql.
-- =====================================================================

INSERT INTO "Lead" ("id", "organizationId", "contactId", "propertyId", "agentId", "source", "stage", "score", "budgetMax", "interest", "lostReason", "createdAt", "updatedAt") VALUES
('mp2_l_0', 'mp_org', 'mp_ct_030', 'mp_p_05', 'mp_ag_00', 'INDICACAO', 'WON', 92, 5093000, 'Comprou Mansão Prime', NULL, '2026-06-13 10:00:00', '2026-08-05 10:00:00'),
('mp2_l_1', 'mp_org', 'mp_ct_037', 'mp_p_15', 'mp_ag_03', 'INDICACAO', 'WON', 92, 12573000, 'Comprou Studio Boulevard', NULL, '2026-06-12 10:00:00', '2026-08-03 10:00:00'),
('mp2_l_2', 'mp_org', 'mp_ct_044', 'mp_p_30', 'mp_ag_06', 'INDICACAO', 'WON', 92, 935000, 'Comprou Studio Imperial', NULL, '2026-06-22 10:00:00', '2026-08-01 10:00:00')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Activity" ("id", "leadId", "type", "payload", "createdAt") VALUES
('mp2_a_0_0', 'mp2_l_0', 'FORM_SUBMIT', '{"message": "Indicação de cliente antigo", "kind": "visit"}'::jsonb, '2026-06-13 10:00:00'),
('mp2_a_0_1', 'mp2_l_0', 'STAGE_CHANGE', '{"from": "NEW", "to": "CONTACTED", "by": "Mariana Castro"}'::jsonb, '2026-06-15 10:00:00'),
('mp2_a_0_2', 'mp2_l_0', 'STAGE_CHANGE', '{"from": "CONTACTED", "to": "VISIT", "by": "Mariana Castro"}'::jsonb, '2026-06-19 10:00:00'),
('mp2_a_0_3', 'mp2_l_0', 'STAGE_CHANGE', '{"from": "VISIT", "to": "PROPOSAL", "by": "Mariana Castro"}'::jsonb, '2026-06-25 10:00:00'),
('mp2_a_0_4', 'mp2_l_0', 'STAGE_CHANGE', '{"from": "PROPOSAL", "to": "CONTRACT", "by": "Mariana Castro"}'::jsonb, '2026-07-30 10:00:00'),
('mp2_a_0_5', 'mp2_l_0', 'STAGE_CHANGE', '{"from": "CONTRACT", "to": "WON", "by": "Mariana Castro"}'::jsonb, '2026-08-05 10:00:00'),
('mp2_a_1_0', 'mp2_l_1', 'FORM_SUBMIT', '{"message": "Indicação de cliente antigo", "kind": "visit"}'::jsonb, '2026-06-12 10:00:00'),
('mp2_a_1_1', 'mp2_l_1', 'STAGE_CHANGE', '{"from": "NEW", "to": "CONTACTED", "by": "Marcelo Esteves"}'::jsonb, '2026-06-14 10:00:00'),
('mp2_a_1_2', 'mp2_l_1', 'STAGE_CHANGE', '{"from": "CONTACTED", "to": "VISIT", "by": "Marcelo Esteves"}'::jsonb, '2026-06-18 10:00:00'),
('mp2_a_1_3', 'mp2_l_1', 'STAGE_CHANGE', '{"from": "VISIT", "to": "PROPOSAL", "by": "Marcelo Esteves"}'::jsonb, '2026-06-24 10:00:00'),
('mp2_a_1_4', 'mp2_l_1', 'STAGE_CHANGE', '{"from": "PROPOSAL", "to": "CONTRACT", "by": "Marcelo Esteves"}'::jsonb, '2026-07-28 10:00:00'),
('mp2_a_1_5', 'mp2_l_1', 'STAGE_CHANGE', '{"from": "CONTRACT", "to": "WON", "by": "Marcelo Esteves"}'::jsonb, '2026-08-03 10:00:00'),
('mp2_a_2_0', 'mp2_l_2', 'FORM_SUBMIT', '{"message": "Indicação de cliente antigo", "kind": "visit"}'::jsonb, '2026-06-22 10:00:00'),
('mp2_a_2_1', 'mp2_l_2', 'STAGE_CHANGE', '{"from": "NEW", "to": "CONTACTED", "by": "Camila Machado"}'::jsonb, '2026-06-24 10:00:00'),
('mp2_a_2_2', 'mp2_l_2', 'STAGE_CHANGE', '{"from": "CONTACTED", "to": "VISIT", "by": "Camila Machado"}'::jsonb, '2026-06-28 10:00:00'),
('mp2_a_2_3', 'mp2_l_2', 'STAGE_CHANGE', '{"from": "VISIT", "to": "PROPOSAL", "by": "Camila Machado"}'::jsonb, '2026-07-04 10:00:00'),
('mp2_a_2_4', 'mp2_l_2', 'STAGE_CHANGE', '{"from": "PROPOSAL", "to": "CONTRACT", "by": "Camila Machado"}'::jsonb, '2026-07-26 10:00:00'),
('mp2_a_2_5', 'mp2_l_2', 'STAGE_CHANGE', '{"from": "CONTRACT", "to": "WON", "by": "Camila Machado"}'::jsonb, '2026-08-01 10:00:00')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Visit" ("id", "organizationId", "propertyId", "leadId", "contactId", "agentId", "scheduledAt", "status", "feedback", "createdAt") VALUES
('mp2_v_s0', 'mp_org', 'mp_p_05', 'mp2_l_0', 'mp_ct_030', 'mp_ag_00', '2026-06-19 10:00:00', 'DONE', 'Cliente decidiu na primeira visita.', '2026-06-18 10:00:00'),
('mp2_v_s1', 'mp_org', 'mp_p_15', 'mp2_l_1', 'mp_ct_037', 'mp_ag_03', '2026-06-18 10:00:00', 'DONE', 'Cliente decidiu na primeira visita.', '2026-06-17 10:00:00'),
('mp2_v_s2', 'mp_org', 'mp_p_30', 'mp2_l_2', 'mp_ct_044', 'mp_ag_06', '2026-06-28 10:00:00', 'DONE', 'Cliente decidiu na primeira visita.', '2026-06-27 10:00:00'),
('mp2_v_r0', 'mp_org', 'mp_p_35', NULL, 'mp_ct_090', 'mp_ag_00', '2026-08-03 09:00:00', 'DONE', 'Vai trazer o marido no sábado.', '2026-08-02 09:00:00'),
('mp2_v_r1', 'mp_org', 'mp_p_43', NULL, 'mp_ct_091', 'mp_ag_01', '2026-08-06 09:00:00', 'DONE', 'Gostou muito; pediu planta.', '2026-08-05 09:00:00'),
('mp2_v_r2', 'mp_org', 'mp_p_44', NULL, 'mp_ct_092', 'mp_ag_02', '2026-08-05 05:00:00', 'DONE', 'Gostou muito; pediu planta.', '2026-08-04 05:00:00'),
('mp2_v_r3', 'mp_org', 'mp_p_45', NULL, 'mp_ct_093', 'mp_ag_03', '2026-08-03 04:00:00', 'DONE', 'Vai trazer o marido no sábado.', '2026-08-02 04:00:00'),
('mp2_v_r4', 'mp_org', 'mp_p_46', NULL, 'mp_ct_094', 'mp_ag_04', '2026-08-04 08:00:00', 'DONE', 'Achou pequeno para a família.', '2026-08-03 08:00:00'),
('mp2_v_r5', 'mp_org', 'mp_p_49', NULL, 'mp_ct_095', 'mp_ag_05', '2026-08-01 05:00:00', 'DONE', 'Vai trazer o marido no sábado.', '2026-07-31 05:00:00'),
('mp2_v_r6', 'mp_org', 'mp_p_52', NULL, 'mp_ct_096', 'mp_ag_06', '2026-08-06 04:00:00', 'DONE', 'Vai trazer o marido no sábado.', '2026-08-05 04:00:00'),
('mp2_v_r7', 'mp_org', 'mp_p_54', NULL, 'mp_ct_097', 'mp_ag_07', '2026-08-01 06:00:00', 'DONE', 'Gostou muito; pediu planta.', '2026-07-31 06:00:00'),
('mp2_v_r8', 'mp_org', 'mp_p_56', NULL, 'mp_ct_098', 'mp_ag_00', '2026-08-02 10:00:00', 'DONE', 'Encantada com a varanda.', '2026-08-01 10:00:00'),
('mp2_v_r9', 'mp_org', 'mp_p_57', NULL, 'mp_ct_099', 'mp_ag_01', '2026-08-05 05:00:00', 'DONE', 'Gostou muito; pediu planta.', '2026-08-04 05:00:00'),
('mp2_v_r10', 'mp_org', 'mp_p_58', NULL, 'mp_ct_100', 'mp_ag_02', '2026-08-05 11:00:00', 'DONE', 'Encantada com a varanda.', '2026-08-04 11:00:00'),
('mp2_v_r11', 'mp_org', 'mp_p_59', NULL, 'mp_ct_101', 'mp_ag_03', '2026-08-06 06:00:00', 'DONE', 'Gostou muito; pediu planta.', '2026-08-05 06:00:00'),
('mp2_v_r12', 'mp_org', 'mp_p_62', NULL, 'mp_ct_102', 'mp_ag_04', '2026-08-04 08:00:00', 'DONE', 'Encantada com a varanda.', '2026-08-03 08:00:00'),
('mp2_v_r13', 'mp_org', 'mp_p_65', NULL, 'mp_ct_103', 'mp_ag_05', '2026-08-07 06:00:00', 'DONE', 'Vai trazer o marido no sábado.', '2026-08-06 06:00:00')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Proposal" ("id", "organizationId", "propertyId", "leadId", "contactId", "amount", "conditions", "status", "createdAt", "respondedAt") VALUES
('mp2_pr_0', 'mp_org', 'mp_p_05', 'mp2_l_0', 'mp_ct_030', 4491100, 'À vista com desconto', 'ACCEPTED', '2026-07-26 10:00:00', '2026-07-28 10:00:00'),
('mp2_pr_1', 'mp_org', 'mp_p_15', 'mp2_l_1', 'mp_ct_037', 11087100, 'À vista com desconto', 'ACCEPTED', '2026-07-24 10:00:00', '2026-07-26 10:00:00'),
('mp2_pr_2', 'mp_org', 'mp_p_30', 'mp2_l_2', 'mp_ct_044', 824500, 'À vista com desconto', 'ACCEPTED', '2026-07-22 10:00:00', '2026-07-24 10:00:00')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Contract" ("id", "organizationId", "proposalId", "status", "totalAmount", "signedAt", "closedAt", "createdAt") VALUES
('mp2_k_0', 'mp_org', 'mp2_pr_0', 'CLOSED', 4491100, '2026-07-30 10:00:00', '2026-08-05 10:00:00', '2026-07-27 10:00:00'),
('mp2_k_1', 'mp_org', 'mp2_pr_1', 'CLOSED', 11087100, '2026-07-28 10:00:00', '2026-08-03 10:00:00', '2026-07-25 10:00:00'),
('mp2_k_2', 'mp_org', 'mp2_pr_2', 'CLOSED', 824500, '2026-07-26 10:00:00', '2026-08-01 10:00:00', '2026-07-23 10:00:00')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Commission" ("id", "organizationId", "contractId", "agentId", "amount", "status", "paidAt") VALUES
('mp2_cm_0', 'mp_org', 'mp2_k_0', 'mp_ag_00', 58384, 'PENDING', NULL),
('mp2_cm_1', 'mp_org', 'mp2_k_1', 'mp_ag_03', 110871, 'PENDING', NULL),
('mp2_cm_2', 'mp_org', 'mp2_k_2', 'mp_ag_06', 11543, 'PENDING', NULL)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "FinanceEntry" ("id", "organizationId", "contractId", "direction", "category", "description", "amount", "dueDate", "paidAt") VALUES
('mp2_f_0a', 'mp_org', 'mp2_k_0', 'IN', 'COMISSAO_RECEBIDA', 'Comissão venda Mansão Prime', 224555, '2026-08-15 10:00:00', NULL),
('mp2_f_0b', 'mp_org', 'mp2_k_0', 'OUT', 'COMISSAO_PAGA', 'Repasse Mariana Castro — Mansão Prime', 58384, '2026-08-20 10:00:00', NULL),
('mp2_f_1a', 'mp_org', 'mp2_k_1', 'IN', 'COMISSAO_RECEBIDA', 'Comissão venda Studio Boulevard', 554355, '2026-08-13 10:00:00', NULL),
('mp2_f_1b', 'mp_org', 'mp2_k_1', 'OUT', 'COMISSAO_PAGA', 'Repasse Marcelo Esteves — Studio Boulevard', 110871, '2026-08-18 10:00:00', NULL),
('mp2_f_2a', 'mp_org', 'mp2_k_2', 'IN', 'COMISSAO_RECEBIDA', 'Comissão venda Studio Imperial', 41225, '2026-08-11 10:00:00', NULL),
('mp2_f_2b', 'mp_org', 'mp2_k_2', 'OUT', 'COMISSAO_PAGA', 'Repasse Camila Machado — Studio Imperial', 11543, '2026-08-16 10:00:00', NULL)
ON CONFLICT ("id") DO NOTHING;

UPDATE "Property" SET "status" = 'SOLD', "updatedAt" = now() WHERE "id" = 'mp_p_05' AND "organizationId" = 'mp_org';
UPDATE "Property" SET "status" = 'SOLD', "updatedAt" = now() WHERE "id" = 'mp_p_15' AND "organizationId" = 'mp_org';
UPDATE "Property" SET "status" = 'SOLD', "updatedAt" = now() WHERE "id" = 'mp_p_30' AND "organizationId" = 'mp_org';