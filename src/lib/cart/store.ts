"use client";
import { useSyncExternalStore } from "react";

/** Client cart persisted in localStorage. Prices here are DISPLAY ONLY; the server re-prices everything. */
export interface CartExtra { id: string; name: string; price: number }
export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  extras: CartExtra[];
  quantity: number;
  notes: string;
  unavailable?: boolean;
}

const STORAGE_KEY = "yaz-eat-cart-v1";
const MAX_QTY = 50;
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    items = Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.productId === "string" && i.quantity > 0) : [];
  } catch {
    items = [];
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    try { items = e.newValue ? JSON.parse(e.newValue) : []; } catch { items = []; }
    emit();
  });
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: CartItem[]) {
  items = next;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota / private mode */ }
  emit();
}

export function itemKey(productId: string, extraIds: string[], notes: string) {
  return [productId, [...extraIds].sort().join(","), notes.trim().toLowerCase()].join("|");
}

export const cart = {
  add(item: Omit<CartItem, "key">) {
    load();
    const key = itemKey(item.productId, item.extras.map((e) => e.id), item.notes);
    const existing = items.find((i) => i.key === key);
    if (existing) {
      commit(items.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + item.quantity) } : i)));
    } else {
      commit([...items, { ...item, key, quantity: Math.min(MAX_QTY, item.quantity) }]);
    }
  },
  setQuantity(key: string, quantity: number) {
    load();
    if (quantity <= 0) return cart.remove(key);
    commit(items.map((i) => (i.key === key ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)));
  },
  remove(key: string) {
    load();
    commit(items.filter((i) => i.key !== key));
  },
  clear() {
    load();
    commit([]);
  },
  /** Apply server-verified prices / availability. */
  reconcile(update: (current: CartItem[]) => CartItem[]) {
    load();
    commit(update(items));
  },
};

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, () => (load(), items), () => EMPTY);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const count = snapshot.reduce((n, i) => n + i.quantity, 0);
  const subtotal = snapshot.reduce((n, i) => n + (i.unitPrice + i.extras.reduce((s, e) => s + e.price, 0)) * i.quantity, 0);
  return { items: snapshot, count, subtotal, hydrated };
}

export function lineTotal(i: CartItem) {
  return (i.unitPrice + i.extras.reduce((s, e) => s + e.price, 0)) * i.quantity;
}
