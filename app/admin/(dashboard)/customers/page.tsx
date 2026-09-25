import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { searchPattern } from "@/lib/admin/queries";
import { formatDA, formatDateTime } from "@/lib/format";
import { PageHeader, Panel } from "@/components/admin/shell";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Clients" };

const PAGE_SIZE = 30;
interface CustomerRow { phone: string; name: string; commune: string | null; orders_count: number; total_spent: number; first_order_at: string; last_order_at: string }

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { supabase } = await getAdminSession();

  let query = supabase.from("admin_customers").select("*", { count: "exact" })
    .order("last_order_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const pattern = searchPattern(q);
  if (pattern) {
    const digits = q.replace(/\D/g, "");
    const phone = digits.length >= 3 ? `%${digits.startsWith("0") ? digits.slice(1) : digits}%` : null;
    query = query.or([`name.ilike.${pattern}`, phone && `phone.ilike.${phone}`].filter(Boolean).join(","));
  }
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CustomerRow[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/customers${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Clients" subtitle={`${total} client${total > 1 ? "s" : ""} — regroupés par numéro de téléphone.`} />
      <form className="mb-4 flex gap-2" role="search">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un client</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="Nom ou téléphone"
            className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-paper pl-10 pr-3 text-[16px]" />
        </label>
        <button className={buttonClass("brand")}>Rechercher</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Aucun client" text={q ? "Aucun résultat pour cette recherche." : "Les clients apparaissent après leur première commande."} />
      ) : (
        <Panel className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-line text-left text-ink-soft">
                <tr><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold">Téléphone</th><th className="px-4 py-3 font-semibold">Commune</th>
                  <th className="px-4 py-3 text-right font-semibold">Commandes</th><th className="px-4 py-3 text-right font-semibold">Total dépensé</th><th className="px-4 py-3 font-semibold">Dernière commande</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.phone} className="hover:bg-leaf/60">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/admin/orders?q=${encodeURIComponent(c.phone)}`} className="hover:underline">{c.name}</Link>
                    </td>
                    <td className="px-4 py-3"><a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></td>
                    <td className="px-4 py-3 text-ink-soft">{c.commune ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{c.orders_count}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatDA(c.total_spent)}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateTime(c.last_order_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? <Link href={href(page - 1)} className={buttonClass("outline")}>Précédent</Link> : <span />}
          <span className="text-ink-soft">Page {page} / {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className={buttonClass("outline")}>Suivant</Link> : <span />}
        </nav>
      )}
    </>
  );
}
