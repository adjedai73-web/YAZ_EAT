"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminAction } from "./auth";
import { authError, bool, dbError, int, optStr, str, type FormState } from "./form";
import { slugify } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { serverSupabase } from "@/lib/supabase/server";

const refreshSite = () => revalidatePath("/", "layout");
const MAX_IMAGE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Sb = Awaited<ReturnType<typeof requireAdminAction>>["supabase"];

/** Uploads an optional image field to the public "media" bucket. Returns undefined when no file was sent. */
async function uploadImage(sb: Sb, fd: FormData, field: string, folder: string): Promise<string | undefined> {
  const file = fd.get(field);
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("IMAGE_TYPE");
  if (file.size > MAX_IMAGE) throw new Error("IMAGE_SIZE");
  const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error("IMAGE_UPLOAD");
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

function imageError(e: unknown): FormState | null {
  const m = e instanceof Error ? e.message : "";
  if (m === "IMAGE_TYPE") return { error: "Image refusée : formats acceptés JPG, PNG, WebP, AVIF." };
  if (m === "IMAGE_SIZE") return { error: "Image trop lourde (5 Mo maximum)." };
  if (m === "IMAGE_UPLOAD") return { error: "L'envoi de l'image a échoué. Réessayez." };
  return null;
}

// ------------------------------------------------------------------ auth
export async function signOut() {
  const sb = await serverSupabase();
  await sb.auth.signOut();
  redirect("/admin/login");
}

// ------------------------------------------------------------------ orders
const STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export async function updateOrderStatus(orderId: string, status: OrderStatus, reason?: string): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    if (!z.string().uuid().safeParse(orderId).success || !STATUSES.includes(status)) return { error: "Requête invalide." };
    const patch: Record<string, unknown> = { status };
    if (status === "CANCELLED") patch.cancelled_reason = reason?.slice(0, 300) || null;
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) return { error: dbError(error.message) };
    revalidatePath("/admin", "layout");
    revalidatePath(`/order/${orderId}`);
    return { ok: true, message: "Statut mis à jour." };
  } catch (e) {
    return authError(e);
  }
}

// ------------------------------------------------------------------ categories
export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const id = optStr(fd, "id");
    const name = str(fd, "name");
    const slug = slugify(str(fd, "slug") || name);
    if (!name) return { fieldErrors: { name: "Nom obligatoire." } };
    if (!slug) return { fieldErrors: { slug: "Slug invalide." } };
    let image_url: string | null | undefined;
    try { image_url = await uploadImage(supabase, fd, "image", "categories"); } catch (e) { return imageError(e); }
    if (bool(fd, "remove_image")) image_url = null;

    const row: Record<string, unknown> = {
      name, slug, description: optStr(fd, "description"), active: bool(fd, "active"), sort_order: int(fd, "sort_order"),
    };
    if (image_url !== undefined) row.image_url = image_url;
    const { error } = id
      ? await supabase.from("categories").update(row).eq("id", id)
      : await supabase.from("categories").insert(row);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: id ? "Catégorie mise à jour." : "Catégorie créée." };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteCategory(id: string): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Catégorie supprimée." };
  } catch (e) {
    return authError(e);
  }
}

/** Swap position with the neighbour (up/down) and renumber everything 1..n. */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { data, error } = await supabase.from("categories").select("id").order("sort_order").order("name");
    if (error || !data) return { error: "Réorganisation impossible." };
    const ids = data.map((r) => r.id as string);
    const i = ids.indexOf(id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    const results = await Promise.all(ids.map((cid, idx) => supabase.from("categories").update({ sort_order: idx + 1 }).eq("id", cid)));
    if (results.some((r) => r.error)) return { error: "Réorganisation incomplète. Réessayez." };
    refreshSite();
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

// ------------------------------------------------------------------ products
export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  let savedId: string;
  try {
    const { supabase } = await requireAdminAction();
    const id = optStr(fd, "id");
    const name = str(fd, "name");
    const slug = slugify(str(fd, "slug") || name);
    const price = int(fd, "price", -1);
    const category_id = str(fd, "category_id");
    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = "Nom obligatoire.";
    if (!slug) fieldErrors.slug = "Slug invalide.";
    if (price < 0 || price > 1_000_000) fieldErrors.price = "Prix invalide (en DA, nombre entier).";
    if (!z.string().uuid().safeParse(category_id).success) fieldErrors.category_id = "Choisissez une catégorie.";
    if (Object.keys(fieldErrors).length) return { fieldErrors };

    let image_url: string | null | undefined;
    try { image_url = await uploadImage(supabase, fd, "image", "products"); } catch (e) { return imageError(e); }
    if (bool(fd, "remove_image")) image_url = null;

    const row: Record<string, unknown> = {
      name, slug, price, category_id,
      description: optStr(fd, "description"),
      active: bool(fd, "active"), available: bool(fd, "available"),
      featured: bool(fd, "featured"), bestseller: bool(fd, "bestseller"),
      sort_order: int(fd, "sort_order"),
    };
    if (image_url !== undefined) row.image_url = image_url;

    const res = id
      ? await supabase.from("products").update(row).eq("id", id).select("id").single()
      : await supabase.from("products").insert(row).select("id").single();
    if (res.error) return { error: dbError(res.error.message) };
    savedId = res.data.id as string;

    // product-specific extras
    const extraIds = fd.getAll("extra_ids").map(String).filter((x) => z.string().uuid().safeParse(x).success);
    const del = await supabase.from("product_extras").delete().eq("product_id", savedId);
    if (del.error) return { error: dbError(del.error.message) };
    if (extraIds.length) {
      const ins = await supabase.from("product_extras").insert(extraIds.map((extra_id) => ({ product_id: savedId, extra_id })));
      if (ins.error) return { error: dbError(ins.error.message) };
    }
    refreshSite();
  } catch (e) {
    return authError(e);
  }
  redirect(`/admin/products?saved=${savedId}`);
}

export async function patchProduct(id: string, patch: Partial<Record<"active" | "available" | "featured" | "bestseller", boolean>>): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const clean = Object.fromEntries(Object.entries(patch).filter(([k, v]) => ["active", "available", "featured", "bestseller"].includes(k) && typeof v === "boolean"));
    const { error } = await supabase.from("products").update(clean).eq("id", id);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteProduct(id: string): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Produit supprimé. Les anciennes commandes restent intactes." };
  } catch (e) {
    return authError(e);
  }
}

// ------------------------------------------------------------------ extras
export async function saveExtra(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const id = optStr(fd, "id");
    const name = str(fd, "name");
    const price = int(fd, "price", -1);
    if (!name) return { fieldErrors: { name: "Nom obligatoire." } };
    if (price < 0 || price > 100_000) return { fieldErrors: { price: "Prix invalide." } };
    const row = { name, price, available: bool(fd, "available"), sort_order: int(fd, "sort_order") };
    const res = id
      ? await supabase.from("extras").update(row).eq("id", id).select("id").single()
      : await supabase.from("extras").insert(row).select("id").single();
    if (res.error) return { error: dbError(res.error.message) };
    const extraId = res.data.id as string;

    const categoryIds = fd.getAll("category_ids").map(String).filter((x) => z.string().uuid().safeParse(x).success);
    const del = await supabase.from("category_extras").delete().eq("extra_id", extraId);
    if (del.error) return { error: dbError(del.error.message) };
    if (categoryIds.length) {
      const ins = await supabase.from("category_extras").insert(categoryIds.map((category_id) => ({ category_id, extra_id: extraId })));
      if (ins.error) return { error: dbError(ins.error.message) };
    }
    refreshSite();
    return { ok: true, message: id ? "Supplément mis à jour." : "Supplément créé." };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteExtra(id: string): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { error } = await supabase.from("extras").delete().eq("id", id);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Supplément supprimé." };
  } catch (e) {
    return authError(e);
  }
}

// ------------------------------------------------------------------ promotions
export async function savePromotion(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const id = optStr(fd, "id");
    const name = str(fd, "name");
    const discount_type = str(fd, "discount_type");
    const discount_value = int(fd, "discount_value", 0);
    const code = str(fd, "code").toUpperCase() || null;
    const start = str(fd, "start_date");
    const end = str(fd, "end_date");
    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = "Nom obligatoire.";
    if (!["PERCENTAGE", "FIXED"].includes(discount_type)) fieldErrors.discount_type = "Type invalide.";
    if (discount_value <= 0 || (discount_type === "PERCENTAGE" && discount_value > 100)) fieldErrors.discount_value = "Valeur invalide (1–100 % ou montant en DA).";
    if (code && !/^[A-Z0-9_-]{3,30}$/.test(code)) fieldErrors.code = "3 à 30 caractères : lettres, chiffres, - ou _.";
    // datetime-local values are Algiers time (UTC+1, no DST)
    const toIso = (v: string) => (v ? new Date(`${v}:00+01:00`).toISOString() : null);
    const start_date = toIso(start) ?? new Date().toISOString();
    const end_date = toIso(end);
    if (end_date && end_date <= start_date) fieldErrors.end_date = "La fin doit être après le début.";
    if (Object.keys(fieldErrors).length) return { fieldErrors };

    const row = {
      name, description: optStr(fd, "description"), code, discount_type, discount_value,
      min_order: Math.max(0, int(fd, "min_order")), start_date, end_date, active: bool(fd, "active"),
    };
    const { error } = id
      ? await supabase.from("promotions").update(row).eq("id", id)
      : await supabase.from("promotions").insert(row);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: id ? "Promotion mise à jour." : "Promotion créée." };
  } catch (e) {
    return authError(e);
  }
}

export async function deletePromotion(id: string): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Promotion supprimée." };
  } catch (e) {
    return authError(e);
  }
}

// ------------------------------------------------------------------ delivery
export async function saveZone(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const id = optStr(fd, "id");
    const name = str(fd, "name");
    const fee = int(fd, "fee", -1);
    if (!name) return { fieldErrors: { name: "Nom obligatoire." } };
    if (fee < 0 || fee > 100_000) return { fieldErrors: { fee: "Frais invalides." } };
    const row = { name, fee, active: bool(fd, "active"), sort_order: int(fd, "sort_order") };
    const { error } = id
      ? await supabase.from("delivery_zones").update(row).eq("id", id)
      : await supabase.from("delivery_zones").insert(row);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: id ? "Zone mise à jour." : "Zone créée." };
  } catch (e) {
    return authError(e);
  }
}

export async function deleteZone(id: string): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Zone supprimée." };
  } catch (e) {
    return authError(e);
  }
}

export async function saveDeliverySettings(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const delivery_enabled = bool(fd, "delivery_enabled");
    const pickup_enabled = bool(fd, "pickup_enabled");
    if (!delivery_enabled && !pickup_enabled) return { error: "Activez au moins la livraison ou le retrait." };
    const fee = int(fd, "default_delivery_fee", -1);
    if (fee < 0 || fee > 100_000) return { fieldErrors: { default_delivery_fee: "Frais invalides." } };
    const { error } = await supabase.from("restaurant_settings").update({
      delivery_enabled, pickup_enabled, default_delivery_fee: fee,
      min_order_amount: Math.max(0, int(fd, "min_order_amount")),
      address: optStr(fd, "address"), city: optStr(fd, "city"),
    }).eq("id", 1);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Paramètres de livraison enregistrés." };
  } catch (e) {
    return authError(e);
  }
}

// ------------------------------------------------------------------ settings
const reviewsSchema = z.array(z.object({
  name: z.string().trim().min(1).max(60),
  text: z.string().trim().min(1).max(400),
  rating: z.number().int().min(1).max(5),
})).max(12);

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const name = str(fd, "name");
    if (!name) return { fieldErrors: { name: "Nom obligatoire." } };

    const rawWa = str(fd, "whatsapp").replace(/\D/g, "");
    const whatsapp = rawWa ? (rawWa.startsWith("0") ? `213${rawWa.slice(1)}` : rawWa) : null;
    if (whatsapp && !/^[1-9]\d{7,14}$/.test(whatsapp)) return { fieldErrors: { whatsapp: "Numéro WhatsApp invalide. Exemple : 0550 12 34 56 ou 213550123456." } };

    const url = (k: string) => {
      const v = str(fd, k);
      if (!v) return null;
      try { const u = new URL(v); return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined; } catch { return undefined; }
    };
    const urls = { instagram_url: url("instagram_url"), facebook_url: url("facebook_url"), tiktok_url: url("tiktok_url"), maps_url: url("maps_url") };
    const badUrl = Object.entries(urls).find(([, v]) => v === undefined);
    if (badUrl) return { fieldErrors: { [badUrl[0]]: "Lien invalide (doit commencer par https://)." } };

    let reviews: z.infer<typeof reviewsSchema> = [];
    try { reviews = reviewsSchema.parse(JSON.parse(str(fd, "reviews") || "[]")); }
    catch { return { fieldErrors: { reviews: "Avis invalides : nom, texte et note (1–5) obligatoires." } }; }

    const prefix = str(fd, "order_prefix").toUpperCase() || "YAZ";
    if (!/^[A-Z]{2,6}$/.test(prefix)) return { fieldErrors: { order_prefix: "2 à 6 lettres majuscules." } };

    let logo_url: string | null | undefined, hero_image_url: string | null | undefined;
    try {
      logo_url = await uploadImage(supabase, fd, "logo", "brand");
      hero_image_url = await uploadImage(supabase, fd, "hero_image", "brand");
    } catch (e) { return imageError(e); }
    if (bool(fd, "remove_logo")) logo_url = null;
    if (bool(fd, "remove_hero_image")) hero_image_url = null;

    const row: Record<string, unknown> = {
      name, tagline: optStr(fd, "tagline"), about_text: optStr(fd, "about_text"),
      phone: optStr(fd, "phone"), whatsapp, email: optStr(fd, "email"),
      address: optStr(fd, "address"), city: optStr(fd, "city"), opening_hours: optStr(fd, "opening_hours"),
      ...urls, reviews, order_prefix: prefix, orders_open: bool(fd, "orders_open"),
    };
    if (logo_url !== undefined) row.logo_url = logo_url;
    if (hero_image_url !== undefined) row.hero_image_url = hero_image_url;

    const { error } = await supabase.from("restaurant_settings").update(row).eq("id", 1);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: "Paramètres enregistrés." };
  } catch (e) {
    return authError(e);
  }
}

export async function setOrdersOpen(open: boolean): Promise<FormState> {
  try {
    const { supabase } = await requireAdminAction();
    const { error } = await supabase.from("restaurant_settings").update({ orders_open: open }).eq("id", 1);
    if (error) return { error: dbError(error.message) };
    refreshSite();
    return { ok: true, message: open ? "Commandes ouvertes." : "Commandes fermées." };
  } catch (e) {
    return authError(e);
  }
}
