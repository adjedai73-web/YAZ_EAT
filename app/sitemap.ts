import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/data/catalog";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const statics = ["", "/menu", "/about", "/contact", "/privacy", "/terms"].map((p) => ({
    url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : p === "/menu" ? 0.9 : 0.4,
  }));
  return [
    ...statics,
    ...categories.map((c) => ({ url: `${base}/menu/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
