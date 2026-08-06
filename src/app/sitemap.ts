import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/tenant";
import { getAllPropertySlugs } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const org = await getTenant();
  const slugs = await getAllPropertySlugs(org.id);
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const base = `https://${org.slug}.${root}`;

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/imoveis`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/vender`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...slugs.map((s) => ({
      url: `${base}/imovel/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
