import type { Metadata } from "next";
import { getSettings } from "@/lib/data/catalog";
import { PreparedOrderView } from "@/components/site/prepared-order";

export const metadata: Metadata = { title: "Votre commande", robots: { index: false, follow: false } };

/** Confirmation page. The order lives only in this browser (see lib/orders/local-order.ts). */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, settings] = await Promise.all([params, getSettings()]);
  return (
    <PreparedOrderView
      reference={decodeURIComponent(id)}
      whatsapp={settings.whatsapp}
      restaurantName={settings.name}
      pickupAddress={settings.address ? `${settings.address}${settings.city ? `, ${settings.city}` : ""}` : null}
    />
  );
}
