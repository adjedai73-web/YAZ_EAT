import { formatDA, ORDER_TYPE_LABELS } from "@/lib/format";
import type { OrderType } from "@/lib/types";

/** Minimal shape needed to format an order (PreparedOrder and the admin OrderView both fit). */
export interface WhatsAppOrder {
  order_number: string;
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
  items: { product_name: string; unit_price: number; quantity: number; notes: string | null; extras: { name: string; price: number }[] }[];
}

/**
 * Single, centralized formatter for the order message sent to the restaurant.
 * Uses WhatsApp markdown (*bold*). Pure function: safe on server and client.
 */
export function createWhatsAppOrderMessage(order: WhatsAppOrder, restaurantName = "YAZ EAT"): string {
  const lines: string[] = [];
  lines.push(`🍗 *${restaurantName.toUpperCase()} — NOUVELLE COMMANDE*`, "");
  lines.push(`📦 *Commande:* ${order.order_number}`, "");
  lines.push(`👤 *Client:* ${order.customer_name}`);
  lines.push(`📞 *Téléphone:* ${order.customer_phone}`);
  if (order.order_type === "DELIVERY") {
    const addr = [order.address, order.commune, order.wilaya].filter(Boolean).join(", ");
    lines.push(`📍 *Adresse:* ${addr}`);
    if (order.delivery_zone_name) lines.push(`🗺️ *Zone:* ${order.delivery_zone_name}`);
  }
  lines.push("", "🛒 *COMMANDE*", "");
  for (const item of order.items) {
    lines.push(`• ${item.quantity}x ${item.product_name} — ${formatDA(item.unit_price * item.quantity)}`);
    for (const extra of item.extras) {
      lines.push(`   + ${extra.name} — ${formatDA(extra.price * item.quantity)}`);
    }
    if (item.notes) lines.push(`   _${item.notes}_`);
  }
  lines.push("", `💰 *Sous-total:* ${formatDA(order.subtotal)}`);
  if (order.discount > 0) {
    lines.push(`🏷️ *Réduction${order.promotion_name ? ` (${order.promotion_name})` : ""}:* -${formatDA(order.discount)}`);
  }
  if (order.order_type === "DELIVERY") lines.push(`🚚 *Livraison:* ${formatDA(order.delivery_fee)}`);
  lines.push("", `🔥 *TOTAL: ${formatDA(order.total)}*`, "");
  lines.push(`🚚 *Type:* ${ORDER_TYPE_LABELS[order.order_type]}`);
  if (order.notes) lines.push("", `📝 *Note:* ${order.notes}`);
  return lines.join("\n");
}

/** Click-to-chat URL (wa.me). `phone` must be international digits, e.g. 213550000000. */
export function buildWhatsAppLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}
