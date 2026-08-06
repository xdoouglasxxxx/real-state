/* Dados de exemplo — edite aqui para colocar seus imóveis, corretores etc. reais. */

export const HERO_VIDEO =
  "https://media.base44.com/videos/public/6a0c3ea982f98940623f21f5/a0e02d2b4_Video_Back.mp4";
export const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1600&q=80";
export const PARALLAX_IMG =
  "https://media.base44.com/images/public/6a0c3ea982f98940623f21f5/6dda216cf_Base44_Templates_Gemini_3__Nano_Banana_Pro__2026-05-19_14-53-44.jpg";

export const PROPERTIES = [
  {
    id: "p1", title: "Casa do Vale", property_type: "house", status: "for_sale",
    neighborhood: "Alphaville, SP", city: "Barueri", price: 4850000,
    bedrooms: 5, bathrooms: 6, area_m2: 620, parking_spaces: 4, is_featured: true,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    ],
    description:
      "Residência contemporânea integrada à mata nativa, com pé-direito duplo, piscina de borda infinita e automação completa. Cada ambiente foi desenhado para receber luz natural durante todo o dia.",
    features: ["Piscina aquecida", "Adega climatizada", "Home theater", "Energia solar", "4 vagas cobertas", "Paisagismo assinado"],
    created_date: "2026-07-01",
  },
  {
    id: "p2", title: "Penthouse Horizonte", property_type: "apartment", status: "for_sale",
    neighborhood: "Itaim Bibi, SP", city: "São Paulo", price: 7200000,
    bedrooms: 4, bathrooms: 5, area_m2: 410, parking_spaces: 3, is_featured: true,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80",
    ],
    description:
      "Cobertura duplex com vista de 270° para o skyline. Terraço gourmet com spa, living de 120 m² e elevador privativo. Acabamentos em mármore travertino e madeira freijó.",
    features: ["Vista panorâmica", "Elevador privativo", "Spa no terraço", "Portaria 24h", "Academia privativa", "3 vagas"],
    created_date: "2026-07-05",
  },
  {
    id: "p3", title: "Refúgio da Serra", property_type: "house", status: "for_sale",
    neighborhood: "Campos do Jordão, SP", city: "Campos do Jordão", price: 3100000,
    bedrooms: 4, bathrooms: 4, area_m2: 380, parking_spaces: 2, is_featured: true,
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80",
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1200&q=80",
    ],
    description:
      "Chalé de montanha em condomínio fechado, com lareira de pedra, deck voltado para o vale e aquecimento de piso em todos os ambientes. A poucos minutos do centro turístico.",
    features: ["Lareira de pedra", "Piso aquecido", "Deck com vista", "Condomínio fechado", "Sauna seca", "2 vagas"],
    created_date: "2026-07-08",
  },
  {
    id: "p4", title: "Loft Jardins", property_type: "apartment", status: "for_sale",
    neighborhood: "Jardins, SP", city: "São Paulo", price: 1850000,
    bedrooms: 1, bathrooms: 2, area_m2: 110, parking_spaces: 1, is_featured: false,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    ],
    description:
      "Loft de teto alto com estrutura aparente, marcenaria sob medida e varanda voltada para rua arborizada. A dois quarteirões da Oscar Freire.",
    features: ["Pé-direito 4,2 m", "Marcenaria completa", "Varanda", "Lazer no rooftop", "1 vaga", "Mobiliado"],
    created_date: "2026-07-12",
  },
  {
    id: "p5", title: "Villa Mar Azul", property_type: "house", status: "exclusive",
    neighborhood: "Riviera de São Lourenço, SP", city: "Bertioga", price: 9500000,
    bedrooms: 6, bathrooms: 8, area_m2: 780, parking_spaces: 6, is_featured: true,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200&q=80",
    ],
    description:
      "Frente-mar absoluta com acesso direto à areia. Projeto premiado com integração total entre living, varanda e piscina de raia. Casa de hóspedes independente.",
    features: ["Frente-mar", "Piscina de raia 25 m", "Casa de hóspedes", "Cozinha profissional", "6 vagas", "Gerador próprio"],
    created_date: "2026-07-15",
  },
  {
    id: "p6", title: "Estúdio Pinheiros", property_type: "apartment", status: "for_sale",
    neighborhood: "Pinheiros, SP", city: "São Paulo", price: 890000,
    bedrooms: 1, bathrooms: 1, area_m2: 54, parking_spaces: 0, is_featured: false,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80",
      "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?w=1200&q=80",
    ],
    description:
      "Estúdio inteligente em prédio novo, planta otimizada com cozinha integrada e varanda envidraçada. Rooftop com piscina e coworking no condomínio.",
    features: ["Prédio novo", "Varanda envidraçada", "Coworking", "Rooftop com piscina", "Bicicletário", "Lazer completo"],
    created_date: "2026-07-20",
  },
];

export const AGENTS = [
  { id: "a1", name: "Helena Duarte", role: "Diretora", creci: "CRECI 98.541", phone: "(11) 99812-4455", email: "helena@maisonestate.com.br", is_featured: true,
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    bio: "Fundadora da Maison Estate. Há 14 anos conduz as negociações mais relevantes do alto padrão paulistano." },
  { id: "a2", name: "Rafael Moreno", role: "Especialista em alto padrão", creci: "CRECI 112.030", phone: "(11) 99633-2210", email: "rafael@maisonestate.com.br", is_featured: true,
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    bio: "Especialista em coberturas e casas de arquitetura assinada. Atendimento em português, inglês e espanhol." },
  { id: "a3", name: "Beatriz Lins", role: "Consultora", creci: "CRECI 105.877", phone: "(11) 98770-9034", email: "beatriz@maisonestate.com.br", is_featured: true,
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    bio: "Consultora de compra assessorada. Conhece cada rua dos Jardins, Itaim e Pinheiros." },
];

export const TESTIMONIALS = [
  { id: "t1", text: "Vendemos nossa casa em 28 dias, acima do valor que esperávamos. A equipe conduziu tudo com uma discrição e um cuidado raros.", author: "Família Sampaio", context: "Venderam em Alphaville", rating: 5, created_date: "2026-06-01" },
  { id: "t2", text: "Procuramos por oito meses com outra imobiliária. Aqui, a segunda visita já era o imóvel certo. Eles ouvem de verdade.", author: "Carla & Diego M.", context: "Compraram no Itaim", rating: 5, created_date: "2026-06-10" },
  { id: "t3", text: "Acompanhamento jurídico impecável do início ao fim. Foi a primeira vez que comprar um imóvel não me tirou o sono.", author: "Dr. Otávio Ferreira", context: "Comprou nos Jardins", rating: 5, created_date: "2026-06-20" },
];

export const BLOG_POSTS = [
  {
    id: "b1", slug: "vale-a-pena-comprar-na-planta", title: "Vale a pena comprar na planta em 2026?",
    excerpt: "Os três cenários em que comprar na planta ainda faz sentido — e os dois em que não faz.",
    cover_image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",
    author: "Helena Duarte", tags: ["mercado", "investimento"], published: true, created_date: "2026-07-18",
    content: "Comprar na planta já foi sinônimo de valorização garantida. Hoje, a conta é mais fina.\n\nFaz sentido quando: (1) o incorporador tem histórico sólido de entrega na região; (2) a tabela de vendas está de fato abaixo do metro quadrado de imóveis prontos equivalentes; (3) você não depende do imóvel para morar na data prometida.\n\nNão faz sentido quando a diferença de preço para o pronto é pequena — o risco de obra não é remunerado — ou quando o financiamento da parcela final não está garantido.\n\nNossa recomendação: antes de assinar, peça a matrícula do terreno, o memorial descritivo e compare com no mínimo três imóveis prontos na mesma rua.",
  },
  {
    id: "b2", slug: "como-preparar-imovel-para-venda", title: "Como preparar seu imóvel para vender mais rápido",
    excerpt: "Pequenos ajustes que encurtam semanas de anúncio — sem reforma cara.",
    cover_image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80",
    author: "Rafael Moreno", tags: ["venda", "dicas"], published: true, created_date: "2026-07-25",
    content: "O comprador decide nos primeiros noventa segundos de visita. O que fazer com isso?\n\nLuz: troque lâmpadas queimadas e abra todas as cortinas antes de cada visita. Ambientes escuros parecem menores e mais antigos.\n\nCheiro: mofo e cigarro derrubam ofertas. Ventile diariamente na semana das visitas.\n\nDespersonalize: menos fotos de família e coleções à vista. O visitante precisa conseguir se imaginar morando ali.\n\nPequenos reparos: uma torneira pingando sugere — mesmo injustamente — que a manutenção geral foi negligenciada.\n\nO que NÃO fazer: reformas grandes na véspera. Dificilmente o custo volta no preço.",
  },
  {
    id: "b3", slug: "itbi-escritura-registro-custos", title: "ITBI, escritura e registro: os custos além do preço",
    excerpt: "O guia direto dos custos de cartório e imposto na compra de um imóvel em São Paulo.",
    cover_image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
    author: "Beatriz Lins", tags: ["guia", "documentação"], published: true, created_date: "2026-08-01",
    content: "Além do valor do imóvel, reserve entre 4% e 5% para custos de transferência.\n\nITBI: em São Paulo, 3% sobre o valor venal de referência ou o preço de compra, o que for maior.\n\nEscritura pública: tabela do cartório de notas, proporcional ao valor. Em compras financiadas, o contrato de financiamento substitui a escritura.\n\nRegistro: tabela do cartório de registro de imóveis da circunscrição do imóvel.\n\nDica prática: peça a certidão de valor venal de referência antes de fechar o preço — a diferença entre valor venal e preço declarado muda o ITBI e evita surpresas na hora de registrar.",
  },
];
