import "server-only";
import type { OrderStatus } from "@/lib/types";

export interface AdminStats {
  today: { orders: number; revenue: number; delivered: number; cancelled: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number; average: number };
  pending: number;
  status_distribution: Partial<Record<OrderStatus, number>>;
  top_products: { name: string; quantity: number; revenue: number }[];
  daily: { day: string; orders: number; revenue: number }[];
}

/** Escape user search text for PostgREST `or=(…ilike…)` filters. */
export function searchPattern(q: string): string | null {
  const clean = q.replace(/[%_,()*\\"'.:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return clean ? `%${clean}%` : null;
}

/** ISO -> value for <input type="datetime-local"> in Algiers time (UTC+1, no DST). */
export function toAlgiersLocalInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 16);
}
