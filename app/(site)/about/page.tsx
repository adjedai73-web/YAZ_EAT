import type { Metadata } from "next";
import { getSettings } from "@/lib/data/catalog";
import { ButtonLink } from "@/components/ui/button";
import { ProductImage } from "@/components/site/product-image";

export const metadata: Metadata = { title: "À propos", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-5xl font-extrabold">À propos de {s.name}</h1>
      {s.hero_image_url && <ProductImage src={s.hero_image_url} alt={s.name} sizes="(min-width: 768px) 768px, 100vw" className="mt-8 aspect-[16/9] rounded-[2rem]" />}
      <p className="mt-8 whitespace-pre-line text-lg leading-relaxed text-ink-soft">
        {s.about_text ?? `${s.name} prépare vos plats à la commande. Commandez en ligne en livraison ou à emporter.`}
      </p>
      <ButtonLink href="/menu" size="lg" className="mt-8">Voir le menu</ButtonLink>
    </div>
  );
}
