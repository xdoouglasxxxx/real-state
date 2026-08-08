// Teto do programa Minha Casa Minha Vida para enquadramento do imóvel.
// Sujeito a decreto — revisar periodicamente.
export const MCMV_TETO_IMOVEL = 500_000;

// Custos médios de aquisição em SP — ajustar por município.
export const ITBI_PCT = 0.03;             // ITBI ~3%
export const ESCRITURA_REGISTRO_PCT = 0.015; // escritura + registro ~1,5%

export type FinancingRate = { banco: string; taxa: number };
