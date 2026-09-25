/**
 * Orders prepared in the browser (no backend yet).
 *
 * The reference YAZ-YYYYMMDD-XXXX is a CUSTOMER REFERENCE generated on the device
 * (date in Africa/Algiers + 4 random characters). It is NOT a server-side, guaranteed-unique
 * order ID: two customers could, very rarely, get the same reference. It only helps the
 * restaurant and the customer talk about the same WhatsApp order.
 *
 * Prepared orders are kept in this browser's localStorage only (last 10), so the customer
 * can re-open the confirmation page and re-send the WhatsApp message. Nothing is sent to a server.
 */
import type { OrderQuote, OrderType } from "@/lib/types";

export interface PreparedOrderItem {
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  notes: string | null;
  extras: { name: string; price: number }[];
}

export interface PreparedOrder {
  order_number: string; // customer reference, see note above
  created_at: string;
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
  items: PreparedOrderItem[];
}

const STORAGE_KEY = "yaz-eat-orders-v1";
const KEEP = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion when read aloud

export function generateReference(prefix: string, now = new Date(), random: () => number = secureRandom): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Algiers", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `${prefix}-${day}-${suffix}`;
}

function secureRandom() {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return a[0]! / 2 ** 32;
}

export interface CustomerInput {
  customer_name: string; customer_phone: string; address: string; commune: string; wilaya: string; notes: string;
}

export function buildPreparedOrder(reference: string, customer: CustomerInput, quote: OrderQuote, now = new Date()): PreparedOrder {
  const delivery = quote.order_type === "DELIVERY";
  return {
    order_number: reference,
    created_at: now.toISOString(),
    customer_name: customer.customer_name.trim(),
    customer_phone: customer.customer_phone,
    order_type: quote.order_type,
    address: delivery ? customer.address.trim() || null : null,
    commune: delivery ? customer.commune.trim() || null : null,
    wilaya: delivery ? customer.wilaya.trim() || null : null,
    delivery_zone_name: quote.delivery_zone_name,
    notes: customer.notes.trim() || null,
    subtotal: quote.subtotal,
    discount: quote.discount,
    promotion_name: quote.promotion_name,
    delivery_fee: quote.delivery_fee,
    total: quote.total,
    items: quote.lines.map((l) => ({
      product_name: l.name, unit_price: l.unit_price, quantity: l.quantity, line_total: l.line_total,
      notes: l.notes, extras: l.extras.map((e) => ({ name: e.name, price: e.price })),
    })),
  };
}

function readAll(): PreparedOrder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function savePreparedOrder(order: PreparedOrder) {
  try {
    const list = [order, ...readAll().filter((o) => o.order_number !== order.order_number)].slice(0, KEEP);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* private mode / quota: the WhatsApp link still works */ }
}

export function getPreparedOrder(reference: string): PreparedOrder | null {
  return readAll().find((o) => o.order_number === reference) ?? null;
}
