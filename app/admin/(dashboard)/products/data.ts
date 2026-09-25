import "server-only";
import { getAdminSession } from "@/lib/admin/auth";
import type { Category, Extra } from "@/lib/types";

export async function getProductFormData() {
  const { supabase } = await getAdminSession();
  const [cats, extras, catExtras] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("extras").select("*").order("sort_order").order("name"),
    supabase.from("category_extras").select("category_id, extras(name)"),
  ]);
  if (cats.error || extras.error || catExtras.error) throw new Error("Chargement impossible");
  const categoryExtraNames: Record<string, string[]> = {};
  for (const r of (catExtras.data ?? []) as unknown as { category_id: string; extras: { name: string } | null }[]) {
    if (r.extras) (categoryExtraNames[r.category_id] ??= []).push(r.extras.name);
  }
  return { supabase, categories: (cats.data ?? []) as Category[], extras: (extras.data ?? []) as Extra[], categoryExtraNames };
}
