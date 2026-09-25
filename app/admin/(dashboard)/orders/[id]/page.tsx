import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircle, Phone } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { formatDA, formatDateTime, ORDER_TYPE_LABELS, STATUS_LABELS, toWhatsAppIntl } from "@/lib/format";
import type { OrderStatus, OrderView } from "@/lib/types";
import { buildWhatsAppLink, createWhatsAppOrderMessage } from "@/lib/whatsapp/message";
import { Panel } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status";
import { StatusControl } from "@/components/admin/status-control";
import { CopyButton } from "@/components/admin/copy-button";
import { OrdersLive } from "@/components/admin/orders-live";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";

type Row = Omit<OrderView, "items" | "events"> & {
  cancelled_reason: string | null;
  order_items: { id: string; product_name: string; unit_price: number; extras_total: number; quantity: number; line_total: number; notes: string | null; created_at: string;
    order_item_extras: { extra_name: string; price: number }[] }[];
  order_status_events: { status: OrderStatus; created_at: string }[];
};

const CUSTOMER_MESSAGES: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "votre commande est confirmée",
  PREPARING: "votre commande est en préparation",
  READY: "votre commande est prête",
  OUT_FOR_DELIVERY: "votre commande est en route",
  DELIVERED: "merci pour votre commande, bon appétit",
  CANCELLED: "votre commande a été annulée",
};

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await getAdminSession();
  const [{ data, error }, settingsRes] = await Promise.all([
    supabase.from("orders").select("*, order_items(*, order_item_extras(extra_name, price)), order_status_events(status, created_at)").eq("id", id).maybeSingle(),
    supabase.from("restaurant_settings").select("name").eq("id", 1).maybeSingle(),
  ]);
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const row = data as Row;
  const order: OrderView = {
    ...row,
    items: [...row.order_items].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((i) => ({
      id: i.id, product_name: i.product_name, unit_price: i.unit_price, extras_total: i.extras_total, quantity: i.quantity,
      line_total: i.line_total, notes: i.notes, extras: i.order_item_extras.map((e) => ({ name: e.extra_name, price: e.price })),
    })),
    events: [...row.order_status_events].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
  const restaurant = settingsRes.data?.name ?? "YAZ EAT";
  const statusText = CUSTOMER_MESSAGES[order.status];
  const customerWa = buildWhatsAppLink(toWhatsAppIntl(order.customer_phone),
    `Bonjour ${order.customer_name}, ici ${restaurant}. ${statusText ? `Commande ${order.order_number} : ${statusText}.` : `Au sujet de votre commande ${order.order_number}.`}`);

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"><ArrowLeft className="size-4" /> Commandes</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{order.order_number}</h1>
          <p className="mt-1 text-ink-soft">{formatDateTime(order.created_at)} · {ORDER_TYPE_LABELS[order.order_type]}</p>
        </div>
        <div className="flex items-center gap-3"><OrdersLive /><StatusBadge status={order.status} className="text-sm" /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {order.status === "CANCELLED" && <Alert>Commande annulée{row.cancelled_reason ? ` : ${row.cancelled_reason}` : "."}</Alert>}
          <Panel title="Articles">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-bold">{i.quantity}× {i.product_name} <span className="font-normal text-ink-soft">({formatDA(i.unit_price)})</span></p>
                    {i.extras.map((e) => <p key={e.name} className="text-sm text-ink-soft">+ {e.name} ({formatDA(e.price)})</p>)}
                    {i.notes && <p className="mt-1 text-sm italic">« {i.notes} »</p>}
                  </div>
                  <p className="shrink-0 font-bold tabular-nums">{formatDA(i.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatDA(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-brand-800"><dt>Réduction {order.promotion_name && `(${order.promotion_name})`}</dt><dd className="tabular-nums">−{formatDA(order.discount)}</dd></div>}
              {order.order_type === "DELIVERY" && <div className="flex justify-between"><dt>Livraison {order.delivery_zone_name && `(${order.delivery_zone_name})`}</dt><dd className="tabular-nums">{formatDA(order.delivery_fee)}</dd></div>}
              <div className="flex justify-between pt-1 text-lg font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatDA(order.total)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Client">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-ink-soft">Nom</dt><dd className="font-semibold">{order.customer_name}</dd></div>
              <div><dt className="text-ink-soft">Téléphone</dt><dd className="font-semibold tabular-nums">{order.customer_phone}</dd></div>
              {order.order_type === "DELIVERY" && (
                <div className="sm:col-span-2"><dt className="text-ink-soft">Adresse</dt>
                  <dd className="font-semibold">{[order.address, order.commune, order.wilaya].filter(Boolean).join(", ")}</dd></div>
              )}
              {order.notes && <div className="sm:col-span-2"><dt className="text-ink-soft">Note</dt><dd className="font-semibold">{order.notes}</dd></div>}
            </dl>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={`tel:${order.customer_phone}`} className={buttonClass("outline")}><Phone className="size-4" /> Appeler</a>
              <a href={customerWa} target="_blank" rel="noopener noreferrer" className={buttonClass("outline")}><MessageCircle className="size-4" /> WhatsApp client</a>
            </div>
          </Panel>

          <Panel title="Historique">
            <ol className="space-y-2 text-sm">
              {order.events.map((e, i) => (
                <li key={i} className="flex justify-between"><span className="font-semibold">{STATUS_LABELS[e.status]}</span><span className="text-ink-soft">{formatDateTime(e.created_at)}</span></li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Statut"><StatusControl orderId={order.id} status={order.status} orderType={order.order_type} /></Panel>
          <Panel>
            <div className="space-y-2">
              <CopyButton text={createWhatsAppOrderMessage(order, restaurant)} label="Copier le récapitulatif WhatsApp" />
              <Link href={`/order/${order.id}`} target="_blank" className={buttonClass("ghost", "md", "w-full")}><ExternalLink className="size-4" /> Page de suivi client</Link>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
