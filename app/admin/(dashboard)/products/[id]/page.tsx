import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/admin/shell";
import { buttonClass } from "@/components/ui/button";
import { ProductForm } from "../product-form";
import { getProductFormData } from "../data";

export const metadata = { title: "Modifier le produit" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, categories, extras, categoryExtraNames } = await getProductFormData();
  const [{ data: product, error }, pe] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_extras").select("extra_id").eq("product_id", id),
  ]);
  if (error || pe.error) throw new Error("Chargement impossible");
  if (!product) notFound();
  const p = product as Product;
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" /> Produits</Link>
      <PageHeader title={p.name} action={p.active ? <Link href={`/product/${p.slug}`} target="_blank" className={buttonClass("outline", "sm")}><ExternalLink className="size-4" /> Voir sur le site</Link> : undefined} />
      <ProductForm product={p} categories={categories} extras={extras} categoryExtraNames={categoryExtraNames}
        selectedExtraIds={(pe.data ?? []).map((r) => r.extra_id as string)} />
    </>
  );
}
