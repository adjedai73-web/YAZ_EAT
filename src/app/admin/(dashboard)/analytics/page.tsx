import Link from "next/link";
import { getAdminSession } from "@/lib/admin/auth";
import type { AdminStats } from "@/lib/admin/queries";
import { formatDA, ORDER_TYPE_LABELS, STATUS_FLOW, STATUS_LABELS, cn } from "@/lib/format";
import type { OrderStatus, OrderType } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { BarChart, HBars, StatCard } from "@/components/admin/charts";
import { Alert } from "@/components/ui/misc";

export const metadata = { title: "Statistiques" };

const PERIODS = [7, 30, 90] as const;
const ROW_CAP = 10_000;
const ALGIERS_OFFSET_MS = 3_600_000; // Africa/Algiers = UTC+1, no DST

interface Row { order_type: OrderType; status: OrderStatus; total: number; created_at: string }

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const sp = await searchParams;
  const days = (PERIODS as readonly number[]).includes(Number(sp.days)) ? Number(sp.days) : 30;
  const { supabase } = await getAdminSession();

  // Start of the first day of the period, in Algiers time.
  const nowLocal = new Date(Date.now() + ALGIERS_OFFSET_MS);
  const startLocal = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate() - (days - 1));
  const since = new Date(startLocal - ALGIERS_OFFSET_MS).toISOString();

  const [statsRes, rowsRes] = await Promise.all([
    supabase.rpc("admin_stats", { p_days: days }),
    supabase.from("orders").select("order_type, status, total, created_at").gte("created_at", since)
      .order("created_at", { ascending: false }).range(0, ROW_CAP - 1),
  ]);
  if (statsRes.error) throw new Error(statsRes.error.message);
  if (rowsRes.error) throw new Error(rowsRes.error.message);
  const s = statsRes.data as AdminStats;
  const rows = (rowsRes.data ?? []) as Row[];

  const valid = rows.filter((r) => r.status !== "CANCELLED");
  const revenue = valid.reduce((a, r) => a + r.total, 0);
  const cancelled = rows.length - valid.length;
  const avg = valid.length ? Math.round(revenue / valid.length) : 0;
  const byType = (["DELIVERY", "PICKUP"] as OrderType[]).map((t) => {
    const list = valid.filter((r) => r.order_type === t);
    return { label: ORDER_TYPE_LABELS[t], value: list.length, hint: `${list.length} · ${formatDA(list.reduce((a, r) => a + r.total, 0))}` };
  });
  const byStatus = [...STATUS_FLOW, "CANCELLED" as const]
    .map((st) => ({ label: STATUS_LABELS[st], value: rows.filter((r) => r.status === st).length }))
    .filter((r) => r.value > 0);
  const hours = Array.from({ length: 24 }, () => 0);
  valid.forEach((r) => { hours[(new Date(r.created_at).getUTCHours() + 1) % 24]! += 1; });
  const peakMax = Math.max(1, ...hours);
  const firstHour = hours.findIndex((h) => h > 0);
  const lastHour = 23 - [...hours].reverse().findIndex((h) => h > 0);
  const hourRange = firstHour === -1 ? [] : hours.slice(firstHour, lastHour + 1).map((v, i) => ({ h: firstHour + i, v }));

  return (
    <>
      <PageHeader title="Statistiques" subtitle={`Sur les ${days} derniers jours (commandes annulées exclues du chiffre d'affaires).`}
        action={
          <nav className="flex gap-2" aria-label="Période">
            {PERIODS.map((p) => (
              <Link key={p} href={`/admin/analytics${p === 30 ? "" : `?days=${p}`}`} aria-current={p === days ? "page" : undefined}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", p === days ? "border-brand-800 bg-brand-800 text-white" : "border-line bg-paper hover:border-brand-800")}>
                {p} jours
              </Link>
            ))}
          </nav>
        } />

      {rows.length >= ROW_CAP && <div className="mb-4"><Alert tone="info">Plus de {ROW_CAP.toLocaleString("fr-FR")} commandes sur la période : les répartitions ci-dessous portent sur les plus récentes.</Alert></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Commandes" value={String(rows.length)} accent />
        <StatCard label="Chiffre d'affaires" value={formatDA(revenue)} />
        <StatCard label="Panier moyen" value={formatDA(avg)} />
        <StatCard label="Taux d'annulation" value={rows.length ? `${Math.round((cancelled / rows.length) * 100)} %` : "—"} hint={`${cancelled} annulée${cancelled > 1 ? "s" : ""}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Chiffre d'affaires par jour"><BarChart data={s.daily} valueKey="revenue" label="Chiffre d'affaires par jour" format="da" /></Panel>
        <Panel title="Commandes par jour"><BarChart data={s.daily} valueKey="orders" label="Commandes par jour" /></Panel>
        <Panel title="Heures de commande">
          {hourRange.length === 0 ? <p className="text-sm text-ink-soft">Pas encore de données.</p> : (
            <figure>
              <div className="flex h-40 items-end gap-1" role="img" aria-label="Nombre de commandes par heure">
                {hourRange.map(({ h, v }) => (
                  <div key={h} className="flex h-full flex-1 flex-col justify-end" title={`${h}h : ${v} commande${v > 1 ? "s" : ""}`}>
                    <div className={cn("rounded-t", v === peakMax ? "bg-sun-500" : "bg-brand-800")} style={{ height: `${Math.max((v / peakMax) * 100, v ? 3 : 1)}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-ink-soft"><span>{hourRange[0]!.h}h</span><span>Pic : {hours.indexOf(peakMax)}h</span><span>{hourRange.at(-1)!.h}h</span></div>
            </figure>
          )}
        </Panel>
        <Panel title="Livraison / retrait"><HBars rows={byType.filter((t) => t.value > 0)} /></Panel>
        <Panel title="Top 5 du mois en cours">
          <HBars rows={s.top_products.map((p) => ({ label: p.name, value: p.quantity, hint: `${p.quantity} vendus · ${formatDA(p.revenue)}` }))} />
        </Panel>
        <Panel title="Statuts des commandes"><HBars rows={byStatus} /></Panel>
      </div>
    </>
  );
}
