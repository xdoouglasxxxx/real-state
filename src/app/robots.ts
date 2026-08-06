import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/painel", "/api"] },
    sitemap: `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/sitemap.xml`,
  };
}
