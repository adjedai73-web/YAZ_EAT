/**
 * Public catalogue — reads the LOCAL menu (src/data/menu.ts) and config (src/config/restaurant.ts).
 * No database, no network. Signatures are async so a future backend can replace this file
 * without touching any page or component.
 */
import * as menu from "@/lib/menu";
import type { Category, DeliveryZone, Product, ProductWithExtras, Promotion, RestaurantSettings } from "@/lib/types";

export const getSettings = async (): Promise<RestaurantSettings> => menu.settings;
export const getCategories = async (): Promise<Category[]> => menu.categories;
export const getProducts = async (): Promise<Product[]> => menu.products;

export interface MenuSection { category: Category; products: Product[] }

export async function getMenu(): Promise<MenuSection[]> {
  return menu.categories
    .map((category) => ({ category, products: menu.products.filter((p) => p.category_id === category.id) }))
    .filter((s) => s.products.length > 0);
}

export async function getHighlightedProducts(): Promise<Product[]> {
  return menu.products
    .filter((p) => p.bestseller || p.featured)
    .sort((a, b) => Number(b.bestseller) - Number(a.bestseller) || a.sort_order - b.sort_order)
    .slice(0, 8);
}

export const getProductBySlug = async (slug: string): Promise<ProductWithExtras | null> => menu.productWithExtras(slug);

/** Automatic (code-less) promotions currently running — the only ones shown publicly. */
export const getActivePromotions = async (): Promise<Promotion[]> =>
  menu.promotions.filter((p) => !p.code && menu.isPromotionLive(p));

export const getDeliveryZones = async (): Promise<DeliveryZone[]> => menu.deliveryZones;

/** Ids of products that offer at least one available extra (they open the product page instead of quick-add). */
export async function getProductIdsWithExtras(): Promise<Set<string>> {
  return new Set(menu.products.filter((p) => menu.extrasForProduct(p.id).length > 0).map((p) => p.id));
}
