/* Utilitários para selos de status do imóvel. */
export const statusLabel = (status) =>
  ({ for_sale: "À venda", exclusive: "Exclusivo", sold: "Vendido" }[status] ?? "À venda");

export const typeLabel = (type) =>
  ({ house: "Casa", apartment: "Apartamento", land: "Terreno", commercial: "Comercial" }[type] ?? type);
