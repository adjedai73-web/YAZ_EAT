import Link from "next/link";
import { getAdminSession } from "@/lib/admin/auth";
import type { AdminStats } from "@/lib/admin/queries";
import { formatDA, formatTime, ORDER_TYPE_LABELS } from "@/lib/format";
import type { OrderRow } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { BarChart, HBars, StatCard } from "@/components/admin/charts";
import { StatusBadge } from "@/components/admin/status";
import { OrdersLive } from "@/components/admin/orders-live";
import { OrdersOpenSwitch } from "@/components/admin/switch-action";
import { Alert, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const { supabase } = await getAdminSession();
  const [statsRes, recentRes, settingsRes] = await Promise.all([
    supabase.rpc("admin_stats", { p_days: 14 }),
    supabase.from("orders").select("id, order_number, customer_name, customer_phone, order_type, total, status, created_at")
      .in("status", ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"]).order("created_at", { ascending: false }).limit(8),
    supabase.from("restaurant_settings").select("orders_open, whatsapp").eq("id", 1).maybeSingle(),
  ]);
  if (statsRes.error) throw new Error(statsRes.error.message);
  const s = statsRes.data as AdminStats;
  const recent = (recentRes.data ?? []) as OrderRow[];
  const settings = settingsRes.data;

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Activité du jour, en temps réel." action={<OrdersLive />} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-paper p-4">
        <div>
          <p className="font-bold">Commandes en ligne {settings?.orders_open ? "ouvertes" : "fermées"}</p>
          <p className="text-sm text-ink-soft">Fermez-les pendant les pauses ou en cas de rush : le menu reste visible.</p>
        </div>
        <OrdersOpenSwitch open={settings?.orders_open ?? false} />
      </div>
      {!settings?.whatsapp && (
        <div className="mb-6"><Alert tone="info">Aucun numéro WhatsApp configuré : les clients ne peuvent pas vous envoyer leur commande. <Link href="/admin/settings" className="font-bold underline">Configurer</Link></Alert></div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Commandes aujourd'hui" value={String(s.today.orders)} accent />
        <StatCard label="Chiffre du jour" value={formatDA(s.today.revenue)} />
        <StatCard label="En cours" value={String(s.pending)} hint="À traiter ou en route" />
        <StatCard label="Livrées aujourd'hui" value={String(s.today.delivered)} />
        <StatCard label="Annulées aujourd'hui" value={String(s.today.cancelled)} />
        <StatCard label="Panier moyen" value={formatDA(s.month.average)} hint="Ce mois-ci" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Commandes en cours">
          {recent.length === 0 ? (
            <EmptyState title="Aucune commande en cours" text="Les nouvelles commandes apparaissent ici automatiquement." />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-leaf/60">
                    <div className="min-w-0">
                      <p className="font-bold">{o.order_number} <span className="font-normal text-ink-soft">· {formatTime(o.created_at)}</span></p>
                      <p className="truncate text-sm text-ink-soft">{o.customer_name} · {ORDER_TYPE_LABELS[o.order_type]}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-bold">{formatDA(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/orders" className="mt-3 inline-block text-sm font-semibold text-brand-800 underline">Toutes les commandes</Link>
        </Panel>
        <div className="space-y-6">
          <Panel title="Chiffre d'affaires — 14 jours"><BarChart data={s.daily} valueKey="revenue" label="Chiffre d'affaires par jour" format="da" /></Panel>
          <Panel title="Meilleures ventes du mois">
            <HBars rows={s.top_products.map((p) => ({ label: p.name, value: p.quantity, hint: `${p.quantity} vendus · ${formatDA(p.revenue)}` }))} />
          </Panel>
        </div>
      </div>
    </>
  );
}
