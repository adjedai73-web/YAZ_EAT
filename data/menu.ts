/**
 * YAZ EAT — menu data (local, no database).
 *
 * Real YAZ EAT menu (prices from the official menu).
 * MENU_IS_PLACEHOLDER = true would show a "menu provisoire" notice on the site.
 *
 * Rules:
 * - `id` is also the URL slug (lowercase, dashes): /menu/<category id>, /product/<product id>.
 * - Prices are integers in DA.
 * - `available: false` shows the item as "Indisponible" (can't be ordered). Remove an item to hide it.
 * - Extras attach to a whole category (category.extras) and/or to one product (product.extras).
 * - Images: a file in /public (e.g. "/menu/poulet-roti.jpg") or a full https:// URL. null = placeholder.
 */

export const MENU_IS_PLACEHOLDER = false;

export interface MenuExtra { id: string; name: string; price: number; available: boolean }
export interface MenuCategory { id: string; name: string; description?: string; image?: string | null; extras?: string[] }
export interface MenuProduct {
  id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  available: boolean;
  featured?: boolean;
  bestseller?: boolean;
  extras?: string[];
}

export const extras: MenuExtra[] = [];

export const categories: MenuCategory[] = [
  { id: "poulet-braise-volcanique", name: "Poulet à la braise volcanique" },
  { id: "accompagnements-snacks", name: "Accompagnements et Snacks" },
];

export const products: MenuProduct[] = [
  { id: "quart-poulet", category: "poulet-braise-volcanique", name: "1/4 Poulet", price: 450, image: "/menu/poulet-quart.jpeg", available: true },
  { id: "demi-poulet", category: "poulet-braise-volcanique", name: "1/2 Poulet", price: 800, image: "/menu/poulet-grill.jpeg", available: true },
  { id: "poulet-entier", category: "poulet-braise-volcanique", name: "1 Poulet entier", price: 1400, image: "/menu/poulet-grill.jpeg", available: true },
  { id: "borghol-epice", category: "accompagnements-snacks", name: "Portion de Borghol épicé", price: 250, image: "/menu/borghol.jpeg", available: true },
  { id: "barquette-frites", category: "accompagnements-snacks", name: "Barquette de frites", price: 250, image: "/menu/frites.jpeg", available: true },
  { id: "riz-parfume", category: "accompagnements-snacks", name: "Portion de riz parfumé", price: 250, image: "/menu/riz.jpeg", available: true },
  { id: "sandwich-poulet", category: "accompagnements-snacks", name: "Sandwich poulet", price: 350, image: null, available: true },
];
