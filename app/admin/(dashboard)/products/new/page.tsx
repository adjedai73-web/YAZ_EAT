import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/shell";
import { Alert } from "@/components/ui/misc";
import { ProductForm } from "../product-form";
import { getProductFormData } from "../data";

export const metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const { categories, extras, categoryExtraNames } = await getProductFormData();
  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" /> Produits</Link>
      <PageHeader title="Nouveau produit" />
      {categories.length === 0
        ? <Alert tone="info">Créez d&apos;abord une catégorie dans <Link href="/admin/categories" className="font-bold underline">Catégories</Link>.</Alert>
        : <ProductForm product={null} categories={categories} extras={extras} selectedExtraIds={[]} categoryExtraNames={categoryExtraNames} />}
    </>
  );
}
