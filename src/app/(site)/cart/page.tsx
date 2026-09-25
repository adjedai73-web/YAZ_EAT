import type { Metadata } from "next";
import { getDeliveryZones, getSettings } from "@/lib/data/catalog";
import { CartView } from "@/components/site/cart-view";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default async function CartPage() {
  const [settings, zones] = await Promise.all([getSettings(), getDeliveryZones()]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl font-extrabold">Panier</h1>
      <CartView
        deliveryEnabled={settings.delivery_enabled}
        hasZones={zones.length > 0}
        ordersOpen={settings.orders_open}
      />
    </div>
  );
}
