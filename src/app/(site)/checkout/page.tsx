import type { Metadata } from "next";
import { getDeliveryZones, getSettings } from "@/lib/data/catalog";
import { promotions } from "@/lib/menu";
import { CheckoutForm } from "@/components/site/checkout-form";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

export default async function CheckoutPage() {
  const [settings, zones] = await Promise.all([getSettings(), getDeliveryZones()]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-4xl font-extrabold">Finaliser la commande</h1>
      <p className="mt-1 text-ink-soft">Commander sans compte — aucune inscription nécessaire.</p>
      <CheckoutForm
        deliveryEnabled={settings.delivery_enabled}
        pickupEnabled={settings.pickup_enabled}
        ordersOpen={settings.orders_open}
        zones={zones.map((z) => ({ id: z.id, name: z.name, fee: z.fee }))}
        defaultCity={settings.city ?? ""}
        whatsapp={settings.whatsapp}
        restaurantName={settings.name}
        referencePrefix={settings.order_prefix}
        hasPromoCodes={promotions.some((p) => p.code && p.active)}
      />
    </div>
  );
}
