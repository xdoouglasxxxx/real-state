# Dashboard por período e corretor (CP3)

O dashboard do gestor agora tem abas **Mês / Trimestre / Ano** e filtro por **corretor**. Os dois ficam
na URL (`/painel?periodo=tri&corretor=...`), então dá para mandar o link de uma visão para alguém.
Quem entra como corretor continua vendo só o próprio painel (`Meu painel`), sem mudança.

## O que depende do período e o que não depende

| Número | Regra |
|---|---|
| Leads novos | leads **criados** no período |
| Visitas realizadas | visitas com status `DONE` e `scheduledAt` no período |
| Vendidos / valor realizado | contratos `CLOSED` com `closedAt` no período |
| **Conversão** | dos leads **criados no período**, % que já estão em `WON` |
| Funil do período | dos leads criados no período, quantos **chegaram** em cada etapa (ver abaixo) |
| De onde vêm | leads criados no período, por origem (top 6; o resto vira "Outros") |
| Meta | **soma das metas dos meses** do período (da imobiliária, ou do corretor filtrado) |
| Por corretor | leads criados, visitas realizadas e leads ganhos (`WON`, `updatedAt` no período) |
| Imóveis disponíveis, visitas marcadas, contratos aguardando, propostas em aberto | **situação de agora** — não mudam com o período |

Variações comparam com o **mesmo tempo decorrido** do período anterior (dia 12 do mês contra dia 12 do
mês passado; trimestre e ano idem). Os limites são em **horário de Brasília**, não do servidor.

> **Mudança de significado:** a "conversão" antes era *ganhos ÷ todos os leads de sempre*. Agora é por
> período (coorte). Para períodos recentes ela amadurece com o tempo: um lead de ontem ainda não teve
> chance de virar venda.

## Funil de conversão

Para cada lead criado no período, a etapa mais avançada que ele já alcançou é o maior entre a etapa atual
e qualquer etapa de destino no histórico de mudanças (`STAGE_CHANGE`). Lead **perdido** conta até onde
chegou. "Maior perda" é a passagem de menor conversão **entre as que têm pelo menos 5 leads na etapa de
origem** (0% de 1 lead é ruído, não perda).

## Filtro por corretor

Leads, visitas e imóveis → pelo `agentId` da própria linha. Propostas → pelo corretor do lead.
Contratos → pelo corretor do lead da proposta (contrato não tem corretor próprio).
Consequências: proposta ou contrato **sem lead** só aparece no total geral; lead **sem corretor** não
entra no ranking. Tarefas, alertas e o pipeline ponderado continuam sendo da imobiliária toda.

## Limitações conhecidas
- Leads criados antes de o sistema gravar o histórico de etapas têm só a etapa atual como piso.
- Teto de 20.000 leads por consulta de período (sobra folga para uma imobiliária de médio porte).
- Se o banco falhar, a página mostra um aviso e mantém alertas e tarefas, em vez de números falsos.

## Conferindo os números no Supabase

Rodei estas consultas, **num banco de teste**, contra o código: 52 de 52 resultados iguais em 4
cenários (mês, trimestre, corretor A e corretor B). **Não rodei no seu Supabase** — é você quem confirma.

1. No fim do dashboard, abra **"Conferir estes números no SQL"**: ele mostra os horários exatos usados
   (`INI`, `FIM`, `PINI`, `PFIM`), já em UTC e com `+00`.
2. Pegue o id da imobiliária: `SELECT id, slug FROM "Organization";`
3. Troque `ORG_ID`, `INI`, `FIM`, `PINI`, `PFIM` abaixo (mantenha as aspas simples) e rode no SQL Editor.
   Para o trimestre/ano, ajuste os meses da consulta 9.

Para filtrar por corretor, acrescente ao final do `WHERE` (troque `ID_DO_CORRETOR`):

| Tabela | Acrescente |
|---|---|
| Lead, Visit, Property | `AND "agentId" = 'ID_DO_CORRETOR'` |
| Proposal | `AND "leadId" IN (SELECT id FROM "Lead" WHERE "agentId" = 'ID_DO_CORRETOR')` |
| Contract | `AND "proposalId" IN (SELECT p.id FROM "Proposal" p JOIN "Lead" l ON l.id = p."leadId" WHERE l."agentId" = 'ID_DO_CORRETOR')` |

```sql
-- 1. Leads novos no período
SELECT count(*) AS leads_novos FROM "Lead"
WHERE "organizationId" = 'ORG_ID' AND "createdAt" >= 'INI' AND "createdAt" < 'FIM';

-- 2. Leads novos no período anterior
SELECT count(*) AS leads_novos_anterior FROM "Lead"
WHERE "organizationId" = 'ORG_ID' AND "createdAt" >= 'PINI' AND "createdAt" < 'PFIM';

-- 3. Visitas realizadas (período e anterior)
SELECT
  (SELECT count(*) FROM "Visit" WHERE "organizationId" = 'ORG_ID' AND status = 'DONE' AND "scheduledAt" >= 'INI' AND "scheduledAt" < 'FIM') AS visitas,
  (SELECT count(*) FROM "Visit" WHERE "organizationId" = 'ORG_ID' AND status = 'DONE' AND "scheduledAt" >= 'PINI' AND "scheduledAt" < 'PFIM') AS visitas_anterior;

-- 4. Vendas (contratos fechados) e valor realizado
SELECT count(*) AS vendas, coalesce(sum("totalAmount"), 0) AS realizado FROM "Contract"
WHERE "organizationId" = 'ORG_ID' AND status = 'CLOSED' AND "closedAt" >= 'INI' AND "closedAt" < 'FIM';

-- 5. Vendas no período anterior
SELECT count(*) AS vendas_anterior FROM "Contract"
WHERE "organizationId" = 'ORG_ID' AND status = 'CLOSED' AND "closedAt" >= 'PINI' AND "closedAt" < 'PFIM';

-- 6. Conversão (leads do período que já viraram venda)
SELECT count(*) FILTER (WHERE stage = 'WON') AS ganhos, count(*) AS total FROM "Lead"
WHERE "organizationId" = 'ORG_ID' AND "createdAt" >= 'INI' AND "createdAt" < 'FIM';
-- conversão % = ganhos / total * 100, arredondado

-- 7. Funil: quantos leads do período CHEGARAM em cada etapa
WITH coorte AS (
  SELECT id, stage FROM "Lead" WHERE "organizationId" = 'ORG_ID' AND "createdAt" >= 'INI' AND "createdAt" < 'FIM'
), atual AS (
  SELECT id, CASE stage WHEN 'CONTACTED' THEN 1 WHEN 'VISIT' THEN 2 WHEN 'PROPOSAL' THEN 3 WHEN 'FINANCING' THEN 4 WHEN 'CONTRACT' THEN 5 WHEN 'WON' THEN 6 ELSE 0 END AS n FROM coorte
), historico AS (
  SELECT a."leadId" AS id, max(CASE a.payload->>'to' WHEN 'CONTACTED' THEN 1 WHEN 'VISIT' THEN 2 WHEN 'PROPOSAL' THEN 3 WHEN 'FINANCING' THEN 4 WHEN 'CONTRACT' THEN 5 WHEN 'WON' THEN 6 ELSE 0 END) AS n
  FROM "Activity" a
  WHERE a.type = 'STAGE_CHANGE' AND a."leadId" IN (SELECT id FROM coorte)
  GROUP BY a."leadId"
), alcance AS (
  SELECT t.id, CASE WHEN coalesce(h.n, 0) > t.n THEN h.n ELSE t.n END AS topo
  FROM atual t LEFT JOIN historico h ON h.id = t.id
)
SELECT count(*) AS leads,
  count(*) FILTER (WHERE topo >= 1) AS contatados,
  count(*) FILTER (WHERE topo >= 2) AS visitas,
  count(*) FILTER (WHERE topo >= 3) AS propostas,
  count(*) FILTER (WHERE topo >= 4) AS financiamento,
  count(*) FILTER (WHERE topo >= 5) AS contratos,
  count(*) FILTER (WHERE topo >= 6) AS vendas
FROM alcance;

-- 8. Origem dos leads do período
SELECT source, count(*) AS leads, count(*) FILTER (WHERE stage = 'WON') AS vendas FROM "Lead"
WHERE "organizationId" = 'ORG_ID' AND "createdAt" >= 'INI' AND "createdAt" < 'FIM'
GROUP BY source ORDER BY leads DESC, CAST(source AS text);

-- 9. Meta do período (soma das metas dos meses)
SELECT coalesce(sum("targetAmount"), 0) AS meta FROM "Goal"
WHERE "organizationId" = 'ORG_ID' AND "agentId" IS NULL AND (("year" = 2026 AND "month" = 11));

-- 10. Por corretor (leads, visitas realizadas, vendas)
SELECT ag.name,
  (SELECT count(*) FROM "Lead" l WHERE l."organizationId" = 'ORG_ID' AND l."agentId" = ag.id AND l."createdAt" >= 'INI' AND l."createdAt" < 'FIM') AS leads,
  (SELECT count(*) FROM "Visit" v WHERE v."organizationId" = 'ORG_ID' AND v."agentId" = ag.id AND v.status = 'DONE' AND v."scheduledAt" >= 'INI' AND v."scheduledAt" < 'FIM') AS visitas,
  (SELECT count(*) FROM "Lead" l WHERE l."organizationId" = 'ORG_ID' AND l."agentId" = ag.id AND l.stage = 'WON' AND l."updatedAt" >= 'INI' AND l."updatedAt" < 'FIM') AS vendas
FROM "Agent" ag WHERE ag."organizationId" = 'ORG_ID'
ORDER BY vendas DESC, visitas DESC, leads DESC, ag.name;

-- 11. Situação de AGORA (não depende do período)
SELECT
  (SELECT count(*) FROM "Property" WHERE "organizationId" = 'ORG_ID' AND status IN ('FOR_SALE', 'EXCLUSIVE')) AS imoveis_disponiveis,
  (SELECT coalesce(sum(price), 0) FROM "Property" WHERE "organizationId" = 'ORG_ID' AND status IN ('FOR_SALE', 'EXCLUSIVE')) AS valor_disponivel,
  (SELECT count(*) FROM "Visit" WHERE "organizationId" = 'ORG_ID' AND status = 'SCHEDULED') AS visitas_marcadas,
  (SELECT count(*) FROM "Contract" WHERE "organizationId" = 'ORG_ID' AND status = 'AWAITING_SIGNATURE') AS contratos_aguardando,
  (SELECT count(*) FROM "Proposal" WHERE "organizationId" = 'ORG_ID' AND status = 'SENT') AS propostas_abertas;
```

Se algum número não bater, me mande o resultado da consulta e o que o dashboard mostra.
