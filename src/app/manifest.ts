import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maison Estate — Imóveis de alto padrão",
    short_name: "Maison",
    description: "Compra, venda e avaliação de imóveis de alto padrão.",
    start_url: "/",
    display: "standalone",
    background_color: "#17130e",
    theme_color: "#17130e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
