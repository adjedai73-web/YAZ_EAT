import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data/catalog";
import { MenuPage } from "../menu-page";

/** The menu is local: every valid URL is prerendered, any other slug is a real HTTP 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = (await getCategories()).find((c) => c.slug === category);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: `${cat.name} — Menu`,
    description: cat.description ?? `${cat.name} YAZ EAT à commander en ligne, en livraison ou à emporter.`,
    alternates: { canonical: `/menu/${cat.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categories = await getCategories();
  if (!categories.some((c) => c.slug === category)) notFound();
  return <MenuPage categorySlug={category} />;
}
