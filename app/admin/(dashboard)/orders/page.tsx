import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { searchPattern } from "@/lib/admin/queries";
import { formatDA, formatDateTime, ORDER_TYPE_LABELS, STATUS_LABELS, cn } from "@/lib/format";
import type { OrderRow, OrderStatus } from "@/lib/types";
import { PageHeader } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/status";
import { OrdersLive } from "@/components/admin/orders-live";
import { EmptyState } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Commandes" };

const FILTERS: (OrderStatus | "ALL")[] = ["ALL", "NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 50;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = FILTERS.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus | "ALL") : "ALL";
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { supabase } = await getAdminSession();

  let query = supabase.from("orders")
    .select("id, order_number, customer_name, customer_phone, order_type, total, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status !== "ALL") query = query.eq("status", status);
  const pattern = searchPattern(q);
  if (pattern) {
    const digits = q.replace(/\D/g, "");
    const phone = digits.startsWith("213") ? `0${digits.slice(3)}` : digits;
    const ors = [`order_number.ilike.${pattern}`, `customer_name.ilike.${pattern}`];
    if (phone.length >= 3) ors.push(`customer_phone.ilike.%${phone}%`);
    query = query.or(ors.join(","));
  }
  const [{ data, error, count }, newCount] = await Promise.all([
    query,
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "NEW"),
  ]);
  if (error) throw new Error(error.message);
  const orders = (data ?? []) as OrderRow[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const merged = { status: status === "ALL" ? undefined : status, q: q || undefined, ...p };
    Object.entries(merged).forEach(([k, v]) => { if (v !== undefined && v !== "" && !(k === "page" && String(v) === "1")) u.set(k, String(v)); });
    const s = u.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Commandes" subtitle={`${total} commande${total > 1 ? "s" : ""}`} action={<OrdersLive />} />

      <form className="mb-4 flex gap-2" role="search">
        {status !== "ALL" && <input type="hidden" name="status" value={status} />}
        <label className="relative flex-1">
          <span className="sr-only">Rechercher</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="N° de commande, client ou téléphone"
            className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-paper pl-10 pr-3 text-[16px]" />
        </label>
        <button className={buttonClass("brand")}>Rechercher</button>
      </form>

      <nav className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <Link key={f} href={href({ status: f === "ALL" ? undefined : f, page: undefined })} aria-current={status === f ? "page" : undefined}
            className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
              status === f ? "border-brand-800 bg-brand-800 text-white" : "border-line bg-paper hover:border-brand-800")}>
            {f === "ALL" ? "Toutes" : STATUS_LABELS[f]}
            {f === "NEW" && (newCount.count ?? 0) > 0 && <span className="ml-1.5 rounded-full bg-sun-500 px-1.5 text-xs text-brand-950">{newCount.count}</span>}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <EmptyState title="Aucune commande" text={q || status !== "ALL" ? "Aucun résultat pour ces filtres." : "Les commandes des clients apparaîtront ici."} />
      ) : (
        <>
          {/* mobile cards */}
          <ul className="space-y-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block rounded-[var(--radius-card)] border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{o.order_number}</p><StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-sm">{o.customer_name} · {o.customer_phone}</p>
                  <div className="mt-2 flex justify-between text-sm text-ink-soft">
                    <span>{ORDER_TYPE_LABELS[o.order_type]} · {formatDateTime(o.created_at)}</span>
                    <span className="font-bold text-ink">{formatDA(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-line bg-paper md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-leaf/60 text-ink-soft">
                <tr><th className="px-4 py-3 font-semibold">Commande</th><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold">Téléphone</th>
                  <th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 text-right font-semibold">Total</th><th className="px-4 py-3 font-semibold">Statut</th><th className="px-4 py-3 font-semibold">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-leaf/50">
                    <td className="px-4 py-3 font-bold"><Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.order_number}</Link></td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3 tabular-nums">{o.customer_phone}</td>
                    <td className="px-4 py-3">{ORDER_TYPE_LABELS[o.order_type]}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{formatDA(o.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link className={buttonClass("outline", "sm")} href={href({ page: page - 1 })}>Précédent</Link> : <span />}
              <span className="text-ink-soft">Page {page} / {pages}</span>
              {page < pages ? <Link className={buttonClass("outline", "sm")} href={href({ page: page + 1 })}>Suivant</Link> : <span />}
            </div>
          )}
        </>
      )}
    </>
  );
}
