-- =====================================================================
-- PLANOS — rodar no SQL Editor do Supabase (uma vez)
-- Adiciona o plano BUSINESS (Start 149 / Pro 349 / Business 699 / Enterprise)
-- =====================================================================
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'BUSINESS' AFTER 'PRO';
