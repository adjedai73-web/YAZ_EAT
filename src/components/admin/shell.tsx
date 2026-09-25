import Link from "next/link";
import { BarChart3, ClipboardList, Home, LayoutGrid, LogOut, Percent, Pizza, Settings, Truck, Users, PlusSquare } from "lucide-react";
import { signOut } from "@/lib/admin/actions";
import { AdminNavLink } from "./nav-link";
import { Wordmark } from "@/components/site/wordmark";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: Home, exact: true },
  { href: "/admin/orders", label: "Commandes", icon: ClipboardList },
  { href: "/admin/products", label: "Produits", icon: Pizza },
  { href: "/admin/categories", label: "Catégories", icon: LayoutGrid },
  { href: "/admin/extras", label: "Suppléments", icon: PlusSquare },
  { href: "/admin/promotions", label: "Promotions", icon: Percent },
  { href: "/admin/delivery", label: "Livraison", icon: Truck },
  { href: "/admin/customers", label: "Clients", icon: Users },
  { href: "/admin/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function AdminShell({ children, email, restaurantName }: { children: React.ReactNode; email: string; restaurantName: string }) {
  return (
    <div className="min-h-dvh bg-leaf md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-brand-950 text-white md:h-dvh md:border-0">
        <div className="flex h-14 items-center justify-between px-4 md:h-16">
          <Link href="/admin" className="text-xl"><Wordmark name={restaurantName} light /></Link>
          <form action={signOut} className="md:hidden">
            <button className="grid size-10 place-items-center rounded-full hover:bg-white/10" aria-label="Se déconnecter"><LogOut className="size-5" /></button>
          </form>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3" aria-label="Administration">
          {NAV.map((n) => <AdminNavLink key={n.href} {...n} icon={<n.icon className="size-4.5 shrink-0" />} />)}
        </nav>
        <div className="absolute inset-x-3 bottom-4 hidden md:block">
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10">Voir le site</Link>
          <p className="truncate px-3 pt-2 text-xs text-white/50">{email}</p>
          <form action={signOut}>
            <button className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"><LogOut className="size-4" /> Se déconnecter</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}

export function PageHeader({ title, action, subtitle }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "", title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-paper p-5 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}
