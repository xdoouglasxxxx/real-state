/** Motor de mesclagem dos modelos de contrato (Onda 4.3 Fase 1).
 *  Placeholders no formato {{caminho.do.campo}} — desconhecidos viram ______.
 *  Módulo neutro: importável de páginas e actions. */

export function renderTemplate(body: string, data: Record<string, any>): string {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const val = path.split(".").reduce<any>((acc, k) => (acc == null ? undefined : acc[k]), data);
    return val === undefined || val === null || val === "" ? "________________" : String(val);
  });
}

export const extenso = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

/** Placeholders disponíveis, para a legenda do editor. */
export const PLACEHOLDERS: Record<string, string[]> = {
  Comum: ["imobiliaria.nome", "imobiliaria.creci", "data.hoje", "corretor.nome", "corretor.creci",
          "imovel.titulo", "imovel.endereco", "imovel.bairro", "imovel.cidade"],
  Venda: ["vendedor.nome", "vendedor.documento", "comprador.nome", "comprador.documento",
          "comprador.telefone", "comprador.email", "negocio.valor", "negocio.condicoes",
          "negocio.comissaoValor", "negocio.comissaoPct"],
  Locação: ["locador.nome", "locador.documento", "locatario.nome", "locatario.documento",
            "locatario.telefone", "contrato.aluguel", "contrato.aluguelTotal", "contrato.inicio",
            "contrato.fim", "contrato.meses", "contrato.diaVencimento", "contrato.indice",
            "contrato.garantia", "contrato.taxaAdmPct"],
};

/* ---------- Modelos padrão (nascem com cada tenant; editáveis) ---------- */

export const DEFAULT_VENDA = `COMPROMISSO PARTICULAR DE COMPRA E VENDA DE IMÓVEL

QUADRO-RESUMO (Lei 14.825/2024)
• Imóvel: {{imovel.titulo}} — {{imovel.endereco}}, {{imovel.bairro}}, {{imovel.cidade}}
• Preço total: {{negocio.valor}}
• Condições de pagamento: {{negocio.condicoes}}
• Corretagem (destacada): {{negocio.comissaoValor}} ({{negocio.comissaoPct}} do valor), devida à {{imobiliaria.nome}} — CRECI {{imobiliaria.creci}}
• Corretor responsável: {{corretor.nome}} — CRECI {{corretor.creci}}

PROMITENTE VENDEDOR: {{vendedor.nome}}, CPF/CNPJ {{vendedor.documento}}.
PROMITENTE COMPRADOR: {{comprador.nome}}, CPF/CNPJ {{comprador.documento}}, telefone {{comprador.telefone}}, e-mail {{comprador.email}}.

CLÁUSULA 1ª — DO OBJETO. O VENDEDOR compromete-se a vender ao COMPRADOR o imóvel acima identificado, livre e desembaraçado de quaisquer ônus, dívidas ou pendências, salvo as expressamente declaradas neste instrumento.

CLÁUSULA 2ª — DO PREÇO E PAGAMENTO. O preço certo e ajustado é de {{negocio.valor}}, a ser pago na forma descrita no Quadro-Resumo. A quitação integral é condição para a outorga da escritura definitiva.

CLÁUSULA 3ª — DA CORRETAGEM. A intermediação foi realizada pela {{imobiliaria.nome}}, sendo devida a comissão destacada no Quadro-Resumo, na forma da Lei 6.530/78 e da Resolução COFECI vigente.

CLÁUSULA 4ª — DA DOCUMENTAÇÃO. O VENDEDOR entregará certidões atualizadas do imóvel e pessoais (matrícula, ônus reais, distribuidores cíveis e fiscais) no prazo de 15 dias.

CLÁUSULA 5ª — DO INADIMPLEMENTO. O descumprimento por qualquer das partes sujeitará a parte infratora à multa de 10% sobre o valor do negócio, sem prejuízo de perdas e danos.

CLÁUSULA 6ª — DO FORO. Fica eleito o foro da comarca de {{imovel.cidade}} para dirimir quaisquer controvérsias.

E por estarem justos e contratados, firmam o presente em 2 vias.

{{imovel.cidade}}, {{data.hoje}}.


_____________________________          _____________________________
PROMITENTE VENDEDOR                    PROMITENTE COMPRADOR
{{vendedor.nome}}                      {{comprador.nome}}

_____________________________
{{imobiliaria.nome}} — CRECI {{imobiliaria.creci}}
Corretor: {{corretor.nome}}`;

export const DEFAULT_LOCACAO = `CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL (Lei 8.245/91)

LOCADOR: {{locador.nome}}, CPF/CNPJ {{locador.documento}}.
LOCATÁRIO: {{locatario.nome}}, CPF/CNPJ {{locatario.documento}}, telefone {{locatario.telefone}}.
ADMINISTRADORA: {{imobiliaria.nome}} — CRECI {{imobiliaria.creci}}.

CLÁUSULA 1ª — DO OBJETO. Locação do imóvel {{imovel.titulo}}, situado em {{imovel.endereco}}, {{imovel.bairro}}, {{imovel.cidade}}, destinado a fins residenciais.

CLÁUSULA 2ª — DO PRAZO. A locação vigorará por {{contrato.meses}} meses, de {{contrato.inicio}} a {{contrato.fim}}, renovável na forma da lei.

CLÁUSULA 3ª — DO ALUGUEL. O aluguel mensal é de {{contrato.aluguel}}{{contrato.aluguelTotal}}, com vencimento todo dia {{contrato.diaVencimento}}, reajustável anualmente pelo índice {{contrato.indice}}.

CLÁUSULA 4ª — DA GARANTIA. A presente locação é garantida por: {{contrato.garantia}} (art. 37 da Lei 8.245/91).

CLÁUSULA 5ª — DOS ENCARGOS. Além do aluguel, são de responsabilidade do LOCATÁRIO: consumo de água, energia, gás, condomínio (despesas ordinárias) e IPTU, salvo estipulação diversa.

CLÁUSULA 6ª — DA MULTA POR ATRASO. O atraso no pagamento sujeita o LOCATÁRIO à multa de 2% sobre o débito, acrescida de juros de 1% ao mês pro rata die.

CLÁUSULA 7ª — DA RESCISÃO ANTECIPADA. Na devolução do imóvel antes do prazo, o LOCATÁRIO pagará multa equivalente a 3 aluguéis, proporcional ao período restante do contrato (art. 4º da Lei 8.245/91).

CLÁUSULA 8ª — DA VISTORIA. O imóvel é entregue conforme laudo de vistoria anexo, que integra este contrato; o LOCATÁRIO obriga-se a restituí-lo nas mesmas condições.

CLÁUSULA 9ª — DA ADMINISTRAÇÃO. A administração da locação compete à {{imobiliaria.nome}}, mediante taxa de {{contrato.taxaAdmPct}} sobre o aluguel, a cargo do LOCADOR.

CLÁUSULA 10ª — DO FORO. Fica eleito o foro da comarca de {{imovel.cidade}}.

{{imovel.cidade}}, {{data.hoje}}.


_____________________________          _____________________________
LOCADOR                                 LOCATÁRIO
{{locador.nome}}                        {{locatario.nome}}

_____________________________          _____________________________
{{imobiliaria.nome}}                    Testemunha
CRECI {{imobiliaria.creci}}`;
