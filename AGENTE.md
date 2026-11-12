# Agente do dia (CP5, fase 1)

Tela **Agente do dia** (`/painel/agente`, no menu logo abaixo do Dashboard). Ela junta, num lugar só, o que pede
ação hoje, **por regras sobre os dados do próprio sistema**. Sem IA externa, sem custo, e nenhum dado sai da plataforma.

## O que ele NÃO faz
- **Não envia nada.** O botão "Abrir no WhatsApp" abre a conversa já preenchida (link `wa.me`); quem lê e envia é o corretor.
- **Não usa IA.** Os rascunhos são modelos fixos, preenchidos com o **primeiro nome** do cliente e o título do imóvel.
  Nunca sobrenome, telefone, e-mail nem endereço. O telefone só aparece dentro do link, não como texto na tela.

## Regras (as mesmas do resto do painel, para os números baterem)
| Sugestão | Regra |
|---|---|
| Contrato aguardando assinatura | `AWAITING_SIGNATURE` criado há **5+ dias** (alerta do dashboard) |
| Visita de amanhã | `SCHEDULED` no dia seguinte, **no horário de Brasília** |
| Lead esfriando | **novo ou contatado, sem movimento há 72h+** (o mesmo do selo "Leads" do menu) |
| Imóveis sem visita | disponível, criado há 90+ dias e **sem nenhuma visita nos últimos 90** (dashboard e mapa); atalho abre `/painel/mapa?filtro=parado` |
| Leads sem corretor | só para gerente/admin; leads ativos sem `agentId` |
| Tarefas | não concluídas, vencidas ou de hoje (selo do menu e caixa do dashboard) |

Observação: o alerta "lead sem contato" do **dashboard do gestor** usa uma regra mais estreita (novo há 72h+). O
Agente usa a do selo do menu, que também pega os "contatados" parados; por isso as contagens podem diferir.
Os fusos também diferem de propósito: visitas usam Brasília (o rascunho diz "amanhã"; errar o dia seria pior),
e tarefas seguem o horário do servidor, como o selo do menu.

## Quem vê o quê
- **Gerente e administrador:** a imobiliária toda.
- **Corretor:** só o que é dele (leads, visitas, imóveis, contratos dos seus leads e tarefas).
- **Corretor sem perfil vinculado:** nada (nunca os dados da imobiliária), com o aviso de sempre.

## Marcar como feito / dispensar
Grava **uma anotação na timeline do lead** (sem tabela nova) e esconde a sugestão: **3 dias** para lead esfriando e
contrato (depois volta, se continuar parado) e **30 dias** para visita (é pontual). Não duplica: clicar duas vezes,
recarregar ou "dispensar" depois de "feito" não grava outra anotação. Só dá para marcar sugestões ligadas a um lead.
Contrato cuja proposta não tem lead, visita sem lead e os resumos (imóveis, sem corretor) não têm o botão.
A anotação tem a chave `agentKey` no JSON; a regra de posse (lead da imobiliária e, para corretor, dele) e a conferência
de que o contrato/visita pertence àquele lead ficam em `resolveSuggestion` (`src/lib/agent-day.ts`, testada).

## Limites desta versão
- Mostra os **8** leads esfriando mais antigos de cada vez e informa o total.
- Cliente sem telefone válido no cadastro: sem botão do WhatsApp (há o aviso e o rascunho para copiar).
- "Dispensar" também fica na timeline do lead (serve de histórico do porquê de não ter ligado).
- É a fase 1. O chat com IA (CP6) e a resposta automática no WhatsApp (CP7) vêm depois e reaproveitam estas consultas.

## Conferindo no Supabase
Rodei estas regras, como consultas SQL, **num banco de teste** com o mesmo cenário dos testes: **22 de 22 resultados
iguais** ao código, em 4 visões (gerente, dois corretores e outra imobiliária). **Não rodei no seu Supabase**, e as
expressões de horário abaixo (`now()`, fuso de Brasília) são o padrão do PostgreSQL, mas eu não as executei no Postgres.

Troque `ORG_ID` (veja com `SELECT id, slug FROM "Organization";`) e rode no SQL Editor. O resultado de cada consulta é a lista
**antes** de esconder as sugestões já resolvidas; a consulta 7 mostra as resolvidas (descarte as que estiverem dentro da
janela: 3 dias para `agente:lead_frio:` e `agente:contrato:`, 30 dias para `agente:visita:`).

Para ver só o que é de UM corretor, acrescente ao final do `WHERE` (troque `ID_DO_CORRETOR`):

| Consulta | Acrescente |
|---|---|
| 1 (contratos) | `AND l."agentId" = 'ID_DO_CORRETOR'` |
| 2, 3, 4 e 6 (visitas, leads, imóveis, tarefas) | `AND "agentId" = 'ID_DO_CORRETOR'` (na 4, use `p."agentId"`) |

```sql
-- 1. Contratos aguardando assinatura há 5+ dias
SELECT c.id FROM "Contract" c
JOIN "Proposal" p ON p.id = c."proposalId"
LEFT JOIN "Lead" l ON l.id = p."leadId"
WHERE c."organizationId" = 'ORG_ID' AND c.status = 'AWAITING_SIGNATURE' AND c."createdAt" < now() - interval '5 days'
ORDER BY c."createdAt";

-- 2. Visitas de amanhã (horário de Brasília)
SELECT id FROM "Visit"
WHERE "organizationId" = 'ORG_ID' AND status = 'SCHEDULED' AND "scheduledAt" >= ((date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + interval '1 day') AT TIME ZONE 'America/Sao_Paulo') AND "scheduledAt" < ((date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + interval '2 days') AT TIME ZONE 'America/Sao_Paulo')
ORDER BY "scheduledAt";

-- 3. Leads novos/contatados sem movimento há 72h+
SELECT id FROM "Lead"
WHERE "organizationId" = 'ORG_ID' AND stage IN ('NEW', 'CONTACTED') AND "updatedAt" < now() - interval '72 hours'
ORDER BY "updatedAt";

-- 4. Imóveis disponíveis há 90+ dias sem nenhuma visita nos últimos 90
SELECT p.title FROM "Property" p
WHERE p."organizationId" = 'ORG_ID' AND p.status IN ('FOR_SALE', 'EXCLUSIVE') AND p."createdAt" < now() - interval '90 days'
  AND NOT EXISTS (SELECT 1 FROM "Visit" v WHERE v."propertyId" = p.id AND v."scheduledAt" >= now() - interval '90 days')
ORDER BY p."createdAt";

-- 5. Leads sem corretor (só gerente/admin)
SELECT count(*) FROM "Lead"
WHERE "organizationId" = 'ORG_ID' AND "agentId" IS NULL AND stage NOT IN ('WON', 'LOST');

-- 6. Tarefas vencidas ou de hoje
SELECT id FROM "Task"
WHERE "organizationId" = 'ORG_ID' AND "doneAt" IS NULL AND "dueAt" <= (date_trunc('day', now()) + interval '1 day' - interval '1 millisecond')
ORDER BY "dueAt";

-- 7. Sugestões já resolvidas (últimos 30 dias)
SELECT a.payload->>'agentKey' AS chave, a."createdAt" FROM "Activity" a
JOIN "Lead" l ON l.id = a."leadId"
WHERE l."organizationId" = 'ORG_ID' AND a.type = 'NOTE' AND a."createdAt" >= now() - interval '30 days'
  AND a.payload->>'agentKey' LIKE 'agente:%';
```

Se algum número não bater, me mande o resultado da consulta e o que a tela mostra.
