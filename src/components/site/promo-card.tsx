import { formatDA } from "@/lib/format";
import type { Promotion } from "@/lib/types";

export function PromoCard({ promotion: p }: { promotion: Promotion }) {
  const value = p.discount_type === "PERCENTAGE" ? `-${p.discount_value}%` : `-${formatDA(p.discount_value)}`;
  const until = p.end_date
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Africa/Algiers" }).format(new Date(p.end_date))
    : null;
  return (
    <article className="flex items-center gap-5 rounded-[var(--radius-card)] bg-sun-500 p-5 text-brand-950">
      <span className="font-display text-4xl font-extrabold leading-none md:text-5xl">{value}</span>
      <div>
        <h3 className="text-lg font-bold">{p.name}</h3>
        {p.description && <p className="text-sm text-brand-950/80">{p.description}</p>}
        <p className="mt-1 text-sm font-medium text-brand-950/70">
          Appliquée automatiquement au panier{p.min_order > 0 ? ` dès ${formatDA(p.min_order)}` : ""}{until ? `, jusqu'au ${until}` : ""}.
        </p>
      </div>
    </article>
  );
}
