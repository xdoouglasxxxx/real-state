/**
 * Dados de demonstração — permitem rodar `npm run dev` SEM banco configurado.
 * Com DATABASE_URL válida + `npm run db:seed`, o site passa a ler do Postgres.
 */
import type { Tenant } from "./tenant";

export const DEMO_ORG: Tenant = {
  id: "demo",
  name: "Maison Estate",
  slug: "maison",
  themeInk: "#17130e",
  themeBrass: "#c6a15b",
  themeCream: "#f4efe4",
  creci: "CRECI-SP 45.120-J",
  phone: "(11) 3040-8800",
};

export const HERO_VIDEO =
  "https://media.base44.com/videos/public/6a0c3ea982f98940623f21f5/a0e02d2b4_Video_Back.mp4";
  export const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=80";
export const PARALLAX_IMG =
  "https://media.base44.com/images/public/6a0c3ea982f98940623f21f5/6dda216cf_Base44_Templates_Gemini_3__Nano_Banana_Pro__2026-05-19_14-53-44.jpg";

export const DEMO_PROPERTIES = [
  {
    id: "p1", slug: "casa-do-vale", title: "Casa do Vale", type: "HOUSE", status: "FOR_SALE",
    neighborhood: "Alphaville", city: "Barueri", state: "SP",
    price: 4850000, bedrooms: 5, bathrooms: 6, areaM2: 620, parkingSpaces: 4,
    latitude: -23.4995, longitude: -46.8497, isFeatured: true,
    description: "Residência contemporânea integrada à mata nativa, com pé-direito duplo, piscina de borda infinita e automação completa.",
    features: ["Piscina aquecida", "Adega climatizada", "Home theater", "Energia solar"],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
    ],
  },
  {
    id: "p2", slug: "penthouse-horizonte", title: "Penthouse Horizonte", type: "APARTMENT", status: "FOR_SALE",
    neighborhood: "Itaim Bibi", city: "São Paulo", state: "SP",
    price: 7200000, bedrooms: 4, bathrooms: 5, areaM2: 410, parkingSpaces: 3,
    latitude: -23.585, longitude: -46.676, isFeatured: true,
    description: "Cobertura duplex com vista de 270° para o skyline, terraço gourmet com spa e elevador privativo.",
    features: ["Vista panorâmica", "Elevador privativo", "Spa no terraço"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80",
    ],
  },
  {
    id: "p3", slug: "villa-mar-azul", title: "Villa Mar Azul", type: "HOUSE", status: "EXCLUSIVE",
    neighborhood: "Riviera de São Lourenço", city: "Bertioga", state: "SP",
    price: 9500000, bedrooms: 6, bathrooms: 8, areaM2: 780, parkingSpaces: 6,
    latitude: -23.79, longitude: -46.03, isFeatured: true,
    description: "Frente-mar absoluta com acesso direto à areia, piscina de raia e casa de hóspedes independente.",
    features: ["Frente-mar", "Piscina de raia 25 m", "Casa de hóspedes"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80",
    ],
  },
];
