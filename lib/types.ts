export type OrderStatus =
  | "NEW" | "CONFIRMED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
export type OrderType = "DELIVERY" | "PICKUP";
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Review { name: string; text: string; rating: number }

export interface RestaurantSettings {
  id: number;
  name: string;
  tagline: string | null;
  about_text: string | null;
  logo_url: string | null;
  /** Transparent logo for dark backgrounds (optional). */
  logo_dark_url?: string | null;
  hero_image_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  /** Account names shown as plain text when the profile URL is not known. */
  instagram_name?: string | null;
  facebook_name?: string | null;
  opening_hours: string | null;
  reviews: Review[];
  order_prefix: string;
  orders_open: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  default_delivery_fee: number;
  min_order_amount: number;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  sort_order: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  available: boolean;
  sort_order: number;
}

export interface ProductWithExtras extends Product {
  category: Pick<Category, "id" | "name" | "slug">;
  extras: Extra[];
}

export interface DeliveryZone { id: string; name: string; fee: number; active: boolean; sort_order: number }

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
}

export interface OrderItemExtraView { name: string; price: number }
export interface OrderItemView {
  id: string;
  product_name: string;
  unit_price: number;
  extras_total: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  extras: OrderItemExtraView[];
}
export interface OrderView {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  address: string | null;
  commune: string | null;
  wilaya: string | null;
  delivery_zone_name: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  promotion_name: string | null;
  delivery_fee: number;
  total: number;
  created_at: string;
  items: OrderItemView[];
  events: { status: OrderStatus; created_at: string }[];
}

export interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  total: number;
  status: OrderStatus;
  created_at: string;
}

/** Server quote returned by public.price_order() */
export interface OrderQuote {
  order_type: OrderType;
  subtotal: number;
  discount: number;
  promotion_name: string | null;
  delivery_fee: number;
  delivery_zone_name: string | null;
  zone_missing: boolean;
  min_order: number;
  below_min_order: boolean;
  total: number;
  lines: {
    product_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    extras_total: number;
    line_total: number;
    notes: string | null;
    extras: { id: string; name: string; price: number }[];
  }[];
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
