# Financeiro — Melhorias e Lacunas de Mercado
**Documento gerado em 07/08/2026 — baseado na auditoria de código e análise de mercado imobiliário BR**

> Legenda de esforço: 🟢 baixo (1-2 dias) · 🟡 médio (3-5 dias) · 🔴 alto (1+ semana)
> Legenda de impacto: ⭐ essencial · 🔶 importante · 🔹 nice-to-have

---

## PARTE 1 — Melhorias no que já existe

### 1. Alertas de vencimento via WhatsApp 🟢 ⭐
**Problema:** Um lançamento vence amanhã — o admin não sabe a não ser que abra o sistema
e veja o badge "Vencido" depois. Receita escorregando em silêncio.

**Como implementar:** Job de verificação (ou trigger no carregamento do painel) que consulta
entradas com `dueDate` nos próximos N dias e `paidAt = null`, disparando WhatsApp via a
infraestrutura já existente em `src/lib/notify.ts`. Sem nova dependência.

**Impacto:** Zero lançamento esquecido. Cobrança proativa, não reativa.

---

### 2. Previsão de caixa (entradas e saídas pendentes) 🟢 ⭐
**Problema:** O gráfico de 6 meses mostra só o que *foi pago*. Não há visão do que está
*previsto para entrar/sair* nos próximos 30-60-90 dias com base nos lançamentos pendentes.
É gestão reativa — o caixa estoura e o admin descobre depois.

**Como implementar:** Query nos `FinanceEntry` com `paidAt = null`, agrupados por semana/mês
futuro. Novo gráfico de linha "Posição de caixa prevista" com acumulado (saldo atual +
entradas previstas - saídas previstas). Sem schema novo, só nova query em `data.ts`.

**Impacto:** Admin vê em 10 segundos se o caixa aguenta o mês. Decisão proativa de crédito.

---

### 3. Lançamentos recorrentes 🟡 ⭐
**Problema:** Aluguel do escritório, salários, planos de software — todo mês o admin
lança na mão. Em imobiliárias com 15-20 despesas fixas, são 20 minutos perdidos por mês
e risco de esquecimento.

**Como implementar:** Campo `recurrence: "MONTHLY" | "WEEKLY" | null` e `recurrenceEnd: Date?`
no `FinanceEntry`. Ao salvar com recorrência, gerar as entradas dos próximos N meses de
uma vez. Exibiria uma tag "Recorrente" no extrato. **Requer migration.**

**Impacto:** Elimina trabalho manual repetitivo. Previsão de caixa automaticamente mais precisa.

---

### 4. Exportação CSV do extrato e DRE 🟢 ⭐
**Problema:** Nenhuma forma de extrair os dados para o contador. Em qualquer imobiliária
real, o envio mensal ao contador é obrigatório. Hoje o admin tira print ou copia célula
a célula.

**Como implementar:** Route handler `/painel/financeiro/exportar?mes=2026-08&tipo=extrato`
que retorna `text/csv` com os campos da tabela. Zero schema. Zero dependência — `Array.join`
gera CSV nativo.

**Impacto:** Remove fricção com contador. Reduz risco de erro manual na transcrição.

---

### 5. DRE com comparativo mês anterior 🟡 🔶
**Problema:** O DRE mostra só o mês atual por categoria. Sem coluna do mês anterior ou
variação percentual, é impossível enxergar tendência: "Despesa com marketing cresceu 40%
esse mês — por quê?"

**Como implementar:** Segunda query `getFinance(orgId, prevYear, prevMonth)` em paralelo.
Coluna adicional no DRE com delta e seta colorida (▲ verde / ▼ vermelho). Sem schema novo.

**Impacto:** Tomada de decisão baseada em tendência, não em número isolado.

---

### 6. Parcelamento de comissão 🟡 🔶
**Problema:** Comissão de R$ 30k paga em 3× é prática comum no mercado imobiliário BR.
Hoje o sistema só registra "PAGAR" o valor inteiro de uma vez. O fluxo de caixa fica
distorcido — a saída aparece concentrada num mês que não reflete a realidade.

**Como implementar:** Campo `installments: Int?` no formulário de pagamento de comissão.
Ao confirmar, gerar N `FinanceEntry` do tipo OUT com `dueDate` espaçados mensalmente e
`description` sufixado com "1/3", "2/3", etc. **Requer migration na Commission.**

**Impacto:** Fluxo de caixa fiel à realidade. Previsão mais precisa.

---

### 7. Workflow de inadimplência 🔴 🔶
**Problema:** O KPI "vencidos" mostra o valor total em aberto, mas não há gestão de quem
cobrar, quando foi o último contato de cobrança, nem estágios (lembrete → notificação
formal → negativação). Fica tudo na cabeça do admin.

**Como implementar:** Campo `collectionStage` e `lastCollectionAt` nos lançamentos vencidos.
Timeline de cobrança (igual à timeline de leads) com registro de ações. Integração com
o WhatsApp já existente para disparar mensagens padronizadas de cobrança.
**Requer migration + tela nova.**

**Impacto:** Redução de inadimplência. Processo auditável e profissional.

---

## PARTE 2 — O que existe no mercado e está faltando

### A. NFSe — Nota Fiscal de Serviço Eletrônico 🔴 ⭐ (OBRIGATÓRIO LEGAL)
**O que é:** Imobiliárias são prestadoras de serviço. Cada comissão recebida exige emissão
de Nota Fiscal de Serviço (ISS). Em muitos municípios a NF pode ser exigida pelo comprador
ou vendedor para dedução de IR.

**Por que falta:** Emissão de NF é municipal — cada prefeitura tem seu sistema. APIs como
eNotas.io, NFE.io ou NotasFáceis abstraem isso com um endpoint único.

**Como implementar:** Ao marcar comissão como "Recebida", chamar a API da NF com CNPJ,
valor, código do serviço (6.10 — intermediação imobiliária), tomador. Armazenar o
número da NF no registro. Exibir link de download na ficha financeira.

**Risco de não ter:** Autuação fiscal. Clientes de alto padrão exigem NF.

---

### B. Conciliação bancária (importação OFX/CSV do banco) 🔴 ⭐
**O que é:** Importar o extrato do banco e casar automaticamente com os lançamentos do
sistema. Padrão em qualquer ERP financeiro (ContaAzul, Omie, Sienge).

**Por que importa:** Sem conciliação, o admin não sabe se o que está no sistema reflete
o que realmente entrou na conta. Erros de lançamento ficam invisíveis por meses.

**Como implementar:** Upload de arquivo OFX (formato universal dos bancos BR) ou CSV.
Parser que lê as transações e sugere o match com entradas pendentes por valor + data.
Admin confirma ou cria novo lançamento. Nenhuma API externa necessária para o parser.

---

### C. Split de comissão (co-corretagem) 🟡 ⭐
**O que é:** Negócio fechado com dois corretores (um da captação, um da venda) divide
a comissão. Chamado de co-corretagem — frequentíssimo no mercado imobiliário BR.

**Por que falta:** O modelo atual tem `agentId` único na Commission. Não há como registrar
dois beneficiários com percentuais distintos.

**Como implementar:** Tabela `CommissionSplit` com `commissionId`, `agentId`, `pct`.
Na tela de pagamento, listar os participantes e seus percentuais. Gerar um
`FinanceEntry` OUT por agente. **Requer migration.**

**Impacto:** Operação impossível de fazer corretamente hoje sem gambiarras manuais.

---

### D. DIMOB — Declaração à Receita Federal 🟡 ⭐ (OBRIGATÓRIO LEGAL)
**O que é:** Toda imobiliária que intermediou operações imobiliárias deve entregar a
DIMOB anualmente à Receita Federal (prazo: último dia útil de fevereiro do ano seguinte).
Informa CNPJ/CPF das partes, valor da transação e comissão.

**Por que importa:** Multa de R$ 1.500,00 por ausência de entrega + 3% sobre o valor
não declarado. Em operações de alto padrão, o risco é alto.

**Como implementar:** Relatório que agrega contratos do ano filtrados por `organizationId`,
puxa CPF/CNPJ do comprador e vendedor (Contact), valor e comissão. Exporta XML no
layout DIMOB da RFB. Dados já existem no banco — falta só o extrator.

---

### E. IRRF sobre comissões (retenção na fonte) 🟡 ⭐ (OBRIGATÓRIO LEGAL)
**O que é:** Pessoa jurídica que paga comissão acima de R$ 666,00 a pessoa física
deve reter IRRF (alíquota progressiva). A imobiliária é responsável pelo recolhimento.

**Por que falta:** O sistema registra o pagamento da comissão bruta. Nenhum cálculo de
retenção ou geração de DARF.

**Como implementar:** Campo `irrf: Decimal?` calculado automaticamente ao registrar o
pagamento (tabela progressiva configurável). Relatório mensal de DARF a recolher.
**Requer migration na Commission.**

---

### F. Controle por múltiplas contas bancárias 🟡 🔶
**O que é:** A imobiliária tem conta corrente, conta poupança, caixa físico. Cada
lançamento deveria indicar em qual conta entra/sai. Padrão em qualquer sistema financeiro.

**Por que importa:** Sem isso, o saldo do sistema não bate com nenhum extrato bancário
real — a conciliação (item B) depende disso.

**Como implementar:** Entidade `BankAccount` com `name`, `bank`, `currentBalance`.
Campo `bankAccountId` em `FinanceEntry`. Dashboard mostra saldo por conta.
**Requer migration.**

---

### G. Centro de custo por imóvel 🟡 🔶
**O que é:** Rastrear quanto cada imóvel custou (fotos, anúncios, visitas, reformas)
e quanto gerou de receita, calculando a margem real de cada negócio.

**Por que importa:** Hoje o vínculo `propertyId` existe nos lançamentos mas não há
relatório de rentabilidade por imóvel. Saber que o imóvel X custou R$ 8k em marketing
e gerou R$ 45k de comissão (ROI 462%) versus o imóvel Y (ROI 80%) muda a estratégia.

**Como implementar:** Relatório `/painel/imoveis/[id]/financeiro` agregando todos os
`FinanceEntry` vinculados. Sem schema novo — só nova query e tela.

---

### H. Gestão de locação (carteira de aluguéis) 🔴 🔶
**O que é:** Se a imobiliária administra aluguéis, precisa de: contrato de locação,
boleto mensal, repasse ao proprietário (valor - taxa de administração), recibo de aluguel,
reajuste anual (IGPM/IPCA), rescisão com cálculo de multa.

**Por que importa:** Carteira de locação é receita recorrente — contrapeso ao ciclo
longo de vendas. Muitas imobiliárias BR faturam mais em gestão de locação do que em
vendas.

**Como implementar:** Modelo de dados totalmente novo (`RentalContract`, `RentPayment`,
`OwnerTransfer`). É uma sub-aplicação dentro do sistema. Recomendado como Onda separada.

---

### I. Simulador de financiamento com impacto no caixa 🟢 🔹
**O que é:** Dado um imóvel de R$ 800k, entrada de 20%, prazo de 360 meses e taxa
Caixa/FGTS, calcular a parcela (Tabela Price e SAC). Bancos líderes oferecem isso.

**Por que importa:** O corretor tira o celular, abre o sistema e mostra a simulação
para o cliente na hora — fecha a visita no emotional peak. Hoje usa calculadora ou
app externo.

**Como implementar:** Cálculo local (fórmula matemática — zero API externa). Tela
na ficha do imóvel ou do lead. Já estava mapeado na Onda 3.5 do ROADMAP.

---

### J. Cobrança integrada — Boleto e Pix 🔴 🔹
**O que é:** Gerar boleto ou QR Code Pix para lançamentos a receber, diretamente do
sistema. O cliente recebe o link e paga — o sistema é notificado via webhook e marca
automaticamente como recebido.

**Como implementar:** Integração com Asaas, PJBank ou Gerencianet (APIs brasileiras,
sem cartão). Ao marcar entrada como "a receber", opção "Gerar cobrança". Webhook
atualiza `paidAt` automaticamente.

**Observação:** Aumenta complexidade operacional (conta de cobrança, taxas). Recomendado
somente quando a base de clientes exigir.

---

## Priorização sugerida

### Implementar agora (sem migration, alto impacto)
| # | Feature | Esforço | Impacto |
|---|---|---|---|
| 1 | Previsão de caixa (pendentes) | 🟢 | ⭐ |
| 2 | Exportação CSV | 🟢 | ⭐ |
| 3 | Alertas de vencimento via WhatsApp | 🟢 | ⭐ |
| 4 | DRE com comparativo mês anterior | 🟡 | 🔶 |
| 5 | Centro de custo por imóvel | 🟡 | 🔶 |

### Próxima migration (alto valor legal/operacional)
| # | Feature | Esforço | Impacto |
|---|---|---|---|
| 6 | Split de co-corretagem | 🟡 | ⭐ |
| 7 | Lançamentos recorrentes | 🟡 | ⭐ |
| 8 | Múltiplas contas bancárias | 🟡 | 🔶 |
| 9 | IRRF sobre comissões | 🟡 | ⭐ |

### Backlog estratégico
| # | Feature | Esforço | Impacto |
|---|---|---|---|
| 10 | NFSe (nota fiscal) | 🔴 | ⭐ |
| 11 | Conciliação bancária (OFX) | 🔴 | ⭐ |
| 12 | DIMOB (Receita Federal) | 🟡 | ⭐ |
| 13 | Workflow de inadimplência | 🔴 | 🔶 |
| 14 | Parcelamento de comissão | 🟡 | 🔶 |
| 15 | Gestão de locação | 🔴 | 🔶 |
| 16 | Cobrança integrada (Boleto/Pix) | 🔴 | 🔹 |

---

*Itens marcados ⭐ com obrigação legal (NFSe, DIMOB, IRRF) devem ser consultados
com o contador/jurídico da imobiliária antes da implementação — prazos e alíquotas
variam por município e regime tributário (Simples Nacional vs Lucro Presumido).*
