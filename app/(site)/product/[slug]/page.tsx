import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProductBySlug, getProducts, getSettings } from "@/lib/data/catalog";
import { ProductImage } from "@/components/site/product-image";
import { AddToCartForm } from "@/components/site/add-to-cart-form";
import { formatDA } from "@/lib/format";
import { productJsonLd } from "@/lib/seo";

/** The menu is local: every valid URL is prerendered, any other slug is a real HTTP 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Produit introuvable" };
  const description = `${p.description ?? p.name} — ${formatDA(p.price)}. Commandez en ligne chez YAZ EAT.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description, images: p.image_url ? [{ url: p.image_url }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-4 md:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }} />
      <Link href={`/menu/${product.category.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft className="size-4" /> {product.category.name}
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
          className={`aspect-square w-full rounded-[2rem] ${product.available ? "" : "opacity-60 grayscale"}`}
        />
        <div>
          <h1 className="text-4xl font-extrabold md:text-5xl">{product.name}</h1>
          <p className="mt-2 font-display text-2xl font-bold text-brand-800">{formatDA(product.price)}</p>
          {product.description && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{product.description}</p>}
          <div className="mt-8">
            <AddToCartForm
              product={{ id: product.id, slug: product.slug, name: product.name, image: product.image_url, price: product.price, available: product.available }}
              extras={product.extras.map((e) => ({ id: e.id, name: e.name, price: e.price }))}
              ordersOpen={settings.orders_open}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
