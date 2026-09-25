/**
 * Typed, validated view of the local menu (src/data/menu.ts) and restaurant config.
 * Pure & isomorphic: used by server pages AND by the client-side cart/checkout.
 */
import * as data from "@/data/menu";
import { WHATSAPP_NUMBER, ordering, promotions as promoConfig, restaurant } from "@/config/restaurant";
import type { Category, DeliveryZone, Extra, Product, ProductWithExtras, Promotion, RestaurantSettings } from "@/lib/types";

export const categories: Category[] = data.categories.map((c, i) => ({
  id: c.id, name: c.name, slug: c.id, description: c.description ?? null, image_url: c.image ?? null, active: true, sort_order: i,
}));

export const products: Product[] = data.products
  .filter((p) => data.categories.some((c) => c.id === p.category))
  .map((p, i) => ({
    id: p.id, category_id: p.category, name: p.name, slug: p.id, description: p.description ?? null,
    price: p.price, image_url: p.image ?? null, active: true, available: p.available,
    featured: !!p.featured, bestseller: !!p.bestseller, sort_order: i,
  }));

export const extras: Extra[] = data.extras.map((e, i) => ({ id: e.id, name: e.name, price: e.price, available: e.available, sort_order: i }));

const productById = new Map(products.map((p) => [p.id, p]));
const extraById = new Map(extras.map((e) => [e.id, e]));

export const getProduct = (id: string) => productById.get(id) ?? null;
export const getExtra = (id: string) => extraById.get(id) ?? null;

/** Extras allowed for a product: its own + its category's (available ones only, deduplicated). */
export function extrasForProduct(productId: string): Extra[] {
  const p = data.products.find((x) => x.id === productId);
  if (!p) return [];
  const cat = data.categories.find((c) => c.id === p.category);
  const ids = new Set([...(p.extras ?? []), ...(cat?.extras ?? [])]);
  return [...ids].map((id) => extraById.get(id)).filter((e): e is Extra => !!e && e.available)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function productWithExtras(slug: string): ProductWithExtras | null {
  const p = productById.get(slug);
  if (!p) return null;
  const c = categories.find((x) => x.id === p.category_id)!;
  return { ...p, category: { id: c.id, name: c.name, slug: c.slug }, extras: extrasForProduct(p.id) };
}

export const deliveryZones: DeliveryZone[] = ordering.delivery.zones
  .filter((z) => z.active)
  .map((z, i) => ({ id: z.id, name: z.name, fee: z.fee, active: true, sort_order: i }));

export const promotions: Promotion[] = promoConfig.map((p) => ({
  id: p.id, name: p.name, description: p.description, code: p.code ? p.code.toUpperCase() : null,
  discount_type: p.type, discount_value: p.value, min_order: p.minOrder, start_date: p.start, end_date: p.end, active: p.active,
}));

export function isPromotionLive(p: Promotion, now = new Date()) {
  return p.active && new Date(p.start_date) <= now && (!p.end_date || new Date(p.end_date) >= now);
}

export const settings: RestaurantSettings = {
  id: 1,
  name: restaurant.name,
  tagline: restaurant.tagline,
  about_text: restaurant.about,
  logo_url: restaurant.logoUrl,
  logo_dark_url: restaurant.logoOnDarkUrl,
  hero_image_url: restaurant.heroImageUrl,
  phone: restaurant.phone,
  whatsapp: WHATSAPP_NUMBER,
  email: restaurant.email,
  address: restaurant.address,
  city: restaurant.city,
  maps_url: restaurant.mapsUrl,
  instagram_url: restaurant.instagramUrl,
  facebook_url: restaurant.facebookUrl,
  tiktok_url: restaurant.tiktokUrl,
  instagram_name: restaurant.instagramName,
  facebook_name: restaurant.facebookName,
  opening_hours: restaurant.openingHours,
  reviews: restaurant.reviews,
  order_prefix: ordering.referencePrefix,
  orders_open: ordering.ordersOpen,
  delivery_enabled: ordering.delivery.enabled,
  pickup_enabled: ordering.pickup.enabled,
  default_delivery_fee: ordering.delivery.defaultFee,
  min_order_amount: ordering.minOrderAmount,
  updated_at: new Date(0).toISOString(),
};

export const MENU_IS_PLACEHOLDER = data.MENU_IS_PLACEHOLDER;
