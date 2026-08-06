-- =====================================================================
-- QUERIES DO BI — os KPIs do dashboard executivo, prontos
-- (todas parametrizadas por organizationId = 'org_maison' no exemplo)
-- =====================================================================

-- Receita realizada no mês
SELECT COALESCE(SUM(amount),0) AS receita_mes
FROM "FinanceEntry"
WHERE "organizationId"='org_maison' AND direction='IN'
  AND "paidAt" >= date_trunc('month', now());

-- Ticket médio das vendas concluídas
SELECT ROUND(AVG("totalAmount"),2) AS ticket_medio
FROM "Contract"
WHERE "organizationId"='org_maison' AND status='CLOSED';

-- Conversão por estágio do funil
SELECT stage, COUNT(*) AS leads,
       ROUND(100.0*COUNT(*)/SUM(COUNT(*)) OVER (),1) AS pct
FROM "Lead" WHERE "organizationId"='org_maison'
GROUP BY stage ORDER BY MIN(CASE stage
  WHEN 'NEW' THEN 1 WHEN 'CONTACTED' THEN 2 WHEN 'VISIT' THEN 3
  WHEN 'PROPOSAL' THEN 4 WHEN 'FINANCING' THEN 5 WHEN 'CONTRACT' THEN 6
  WHEN 'WON' THEN 7 ELSE 8 END);

-- Origem dos leads
SELECT source, COUNT(*) AS total
FROM "Lead" WHERE "organizationId"='org_maison'
GROUP BY source ORDER BY total DESC;

-- Tempo médio de venda (publicação -> fechamento)
SELECT ROUND(AVG(EXTRACT(EPOCH FROM (c."closedAt" - p."publishedAt"))/86400),0) AS dias_medio_venda
FROM "Contract" c
JOIN "Proposal" pr ON pr.id = c."proposalId"
JOIN "Property" p  ON p.id = pr."propertyId"
WHERE c."organizationId"='org_maison' AND c.status='CLOSED';

-- Imóveis "encalhados": há mais de 90 dias publicados e sem visita nos últimos 90 dias
SELECT p.title, p.neighborhood, p.price,
       now()::date - p."publishedAt"::date AS dias_no_ar
FROM "Property" p
WHERE p."organizationId"='org_maison'
  AND p.status IN ('FOR_SALE','EXCLUSIVE')
  AND p."publishedAt" < now() - interval '90 days'
  AND NOT EXISTS (
    SELECT 1 FROM "Visit" v
    WHERE v."propertyId" = p.id AND v."scheduledAt" > now() - interval '90 days'
  )
ORDER BY dias_no_ar DESC;

-- Ranking de corretores (vendas fechadas + comissões)
SELECT a.name,
       COUNT(DISTINCT c.id)            AS vendas,
       COALESCE(SUM(c."totalAmount"),0) AS volume,
       COALESCE(SUM(cm.amount),0)       AS comissoes
FROM "Agent" a
LEFT JOIN "Commission" cm ON cm."agentId"=a.id
LEFT JOIN "Contract"  c  ON c.id=cm."contractId" AND c.status='CLOSED'
WHERE a."organizationId"='org_maison'
GROUP BY a.name ORDER BY volume DESC;

-- Meta do mês vs realizado (a barra "76%" do seu rascunho)
SELECT g."targetAmount" AS meta,
       COALESCE(SUM(c."totalAmount"),0) AS realizado,
       ROUND(100.0*COALESCE(SUM(c."totalAmount"),0)/NULLIF(g."targetAmount",0),0) AS pct
FROM "Goal" g
LEFT JOIN "Contract" c ON c."organizationId"=g."organizationId"
  AND c.status='CLOSED'
  AND EXTRACT(YEAR FROM c."closedAt")=g.year
  AND EXTRACT(MONTH FROM c."closedAt")=g.month
WHERE g."organizationId"='org_maison' AND g."agentId" IS NULL
  AND g.year=EXTRACT(YEAR FROM now()) AND g.month=EXTRACT(MONTH FROM now())
GROUP BY g."targetAmount";

-- Bairro que mais vende
SELECT p.neighborhood, COUNT(*) AS vendas, SUM(c."totalAmount") AS volume
FROM "Contract" c
JOIN "Proposal" pr ON pr.id=c."proposalId"
JOIN "Property" p ON p.id=pr."propertyId"
WHERE c."organizationId"='org_maison' AND c.status='CLOSED'
GROUP BY p.neighborhood ORDER BY volume DESC;

-- Pipeline: receita prevista (propostas em aberto x probabilidade por estágio)
SELECT SUM(pr.amount * CASE l.stage
    WHEN 'PROPOSAL' THEN 0.4 WHEN 'FINANCING' THEN 0.7 WHEN 'CONTRACT' THEN 0.9 ELSE 0.1
  END)::bigint AS receita_prevista
FROM "Proposal" pr
JOIN "Lead" l ON l.id = pr."leadId"
WHERE pr."organizationId"='org_maison' AND pr.status='SENT';
