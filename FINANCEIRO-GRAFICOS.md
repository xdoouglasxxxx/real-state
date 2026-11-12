# Financeiro: gráficos (CP4)

A tela do Financeiro ganhou um gráfico de **12 meses** (entradas × saídas + linha do saldo do mês)
e duas roscas (**receitas por tipo** e **despesas por tipo**). Ele **substitui** o gráfico de 6 meses
em barras horizontais. Todo o resto da tela (KPIs clicáveis, previsão de 90 dias, DRE, comissões,
novo lançamento, extrato e exportação CSV) continua igual.

## Como usar
- Cada mês do gráfico é um **link**: clicar leva ao `?mes=AAAA-MM`, e os KPIs, a DRE, as roscas e o
  extrato passam a mostrar aquele mês. O mês selecionado fica destacado.
- Passar o mouse (ou navegar com Tab) mostra entradas, saídas e saldo do mês.
- A janela termina no mês atual. Se você escolher um mês futuro, ela termina nele; se escolher um mês
  mais antigo que 12 meses, ele vira o primeiro da janela.
- `?mes=` inválido (por exemplo `2026-13` ou `abc`) agora volta ao mês atual. Antes, `2026-13`
  rolava em silêncio para janeiro do ano seguinte.

## Base de cálculo (a mesma do resto da tela)
- **Caixa:** só entra o que foi efetivamente pago/recebido, pela data do pagamento (`paidAt`).
  Lançamentos previstos (não pagos) não aparecem no gráfico; eles estão em "Previsão de caixa".
- **Mesma janela dos KPIs e da DRE:** do 1º dia 00:00:00 ao último dia 23:59:59 do mês. Por isso a barra
  do mês selecionado é igual ao KPI "recebido no mês" / "pago no mês".
- **Saldo do mês** = entradas pagas − saídas pagas, do próprio mês (não é acumulado).
- **Roscas:** vêm dos mesmos números da DRE do mês selecionado (categoria a categoria), sem consulta nova.

## Uma questão antiga de fuso, que o gráfico herda de propósito
O Financeiro separa os meses pelo relógio do **servidor** (UTC na Vercel), e o `paidAt` é gravado no
instante do pagamento. Na prática, **um pagamento feito entre 21h e 23h59 (horário de Brasília) do último
dia do mês é contado no mês seguinte**, tanto nos KPIs e na DRE quanto na exportação e agora no gráfico.
O gráfico segue a mesma regra de propósito, para os números baterem entre si. Se isso incomodar (fechamento
do mês à noite), a correção é trocar os limites do mês por horário de Brasília em `getFinance`, no gráfico
e na exportação, tudo de uma vez. É uma mudança de números existentes, então fica para você decidir.

## Limites desta versão
- Máximo de 50.000 lançamentos pagos na janela de 12 meses (sobra muita folga).
- O gráfico mostra só o realizado. A "posição de caixa prevista" (acumulado com os lançamentos
  pendentes), citada em `FINANCEIRO-MELHORIAS.md` item 2, é uma extensão separada.
- Se a consulta do gráfico falhar, a tela avisa "Não foi possível carregar o gráfico agora" e mantém
  KPIs, DRE e extrato. Ela **não** diz "sem movimento" nesse caso.

## Conferindo no Supabase
Rodei esta consulta, num banco de teste com 400 lançamentos aleatórios (duas imobiliárias, pagos e não
pagos, com casos exatos nas bordas do mês), contra o código: **24 de 24 resultados iguais** (12 meses ×
entradas e saídas). **Não rodei no seu Supabase**: confirme 2 ou 3 meses.

1. Pegue o id da imobiliária: `SELECT id, slug FROM "Organization";`
2. Troque `ORG_ID`, o mês e o último dia (no servidor da Vercel o fuso é UTC) e rode no SQL Editor:

```sql
SELECT direction, coalesce(sum(amount), 0) AS total
FROM "FinanceEntry"
WHERE "organizationId" = 'ORG_ID'
  AND "paidAt" >= '2026-11-01 00:00:00+00'
  AND "paidAt" <= '2026-11-30 23:59:59+00'
GROUP BY direction;
```

`IN` = entradas (KPI "recebido no mês"); `OUT` = saídas (KPI "pago no mês"). O saldo do mês é IN − OUT.
Se algum número não bater, me mande o resultado da consulta e o que a tela mostra.
