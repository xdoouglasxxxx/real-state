export const brl = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Moeda compacta para KPIs: R$ 610,3 mi · R$ 1,2 bi · abaixo de 1 mi usa o formato cheio */
export const brlCompact = (v: number | string | null | undefined) => {
  const n = Number(v ?? 0);
  if (Math.abs(n) >= 1e9) return `R$ ${(n / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  return brl(n);
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho", FOR_SALE: "À venda", EXCLUSIVE: "Exclusivo",
  RESERVED: "Reservado", SOLD: "Vendido", RENTED: "Alugado", ARCHIVED: "Arquivado",
};
export const TYPE_LABEL: Record<string, string> = {
  HOUSE: "Casa", APARTMENT: "Apartamento", LAND: "Terreno", COMMERCIAL: "Comercial", FARM: "Fazenda",
};
export const STAGE_LABEL: Record<string, string> = {
  NEW: "Novo", CONTACTED: "Contatado", VISIT: "Visita", PROPOSAL: "Proposta",
  FINANCING: "Financiamento", CONTRACT: "Contrato", WON: "Ganho", LOST: "Perdido",
};
export const SOURCE_LABEL: Record<string, string> = {
  SITE: "Site", INSTAGRAM: "Instagram", FACEBOOK: "Facebook", WHATSAPP: "WhatsApp",
  GOOGLE: "Google", INDICACAO: "Indicação", PORTAL: "Portal", OUTRO: "Outro",
};
