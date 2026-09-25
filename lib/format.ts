import type { OrderStatus, OrderType } from "./types";

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 1100 -> "1 100 DA" (regular spaces, safe for WhatsApp) */
export function formatDA(amount: number): string {
  return `${nf.format(Math.round(amount)).replace(/\u202f|\u00a0/g, " ")} DA`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Algiers",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Algiers",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DELIVERY: "Livraison",
  PICKUP: "Retrait au restaurant",
};

export const STATUS_FLOW: OrderStatus[] = [
  "NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED",
];

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Algerian phone normalization: "+213 550 00 00 00" -> "0550000000". Returns null if invalid. */
export function normalizeDzPhone(raw: string): string | null {
  let p = raw.replace(/[^\d+]/g, "");
  if (p.startsWith("+213")) p = "0" + p.slice(4);
  else if (p.startsWith("00213")) p = "0" + p.slice(5);
  else if (p.startsWith("213") && p.length === 12) p = "0" + p.slice(3);
  return /^0[2-7]\d{8}$/.test(p) ? p : null;
}

/** "0550000000" -> "213550000000" for wa.me links */
export function toWhatsAppIntl(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `213${d.slice(1)}` : d;
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
