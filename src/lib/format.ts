export const brl = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho", FOR_SALE: "À venda", EXCLUSIVE: "Exclusivo",
  RESERVED: "Reservado", SOLD: "Vendido", ARCHIVED: "Arquivado",
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
