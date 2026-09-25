import Link from "next/link";
import type { RestaurantSettings } from "@/lib/types";
import { buildWhatsAppLink } from "@/lib/whatsapp/message";
import { Logo, NAV } from "./header";
import { SocialLinks } from "./social-links";

export function Footer({ settings }: { settings: RestaurantSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-950 pb-28 pt-14 text-white/80 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo settings={settings} light />
          {settings.tagline && <p className="mt-3 max-w-xs text-white/70">{settings.tagline}</p>}
          <SocialLinks settings={settings} className="mt-5" />
        </div>
        <nav aria-label="Pied de page">
          <h2 className="font-display text-lg font-bold text-white">Navigation</h2>
          <ul className="mt-3 space-y-2">
            {NAV.map((n) => <li key={n.href}><Link href={n.href} className="hover:text-sun-400">{n.label}</Link></li>)}
            <li><Link href="/cart" className="hover:text-sun-400">Panier</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="font-display text-lg font-bold text-white">Contact</h2>
          <ul className="mt-3 space-y-2">
            {settings.phone && <li><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-sun-400">{settings.phone}</a></li>}
            {settings.whatsapp && <li><a href={buildWhatsAppLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-sun-400">WhatsApp</a></li>}
            {settings.address && <li>{settings.address}{settings.city ? `, ${settings.city}` : ""}</li>}
            {settings.opening_hours && <li className="whitespace-pre-line">{settings.opening_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 pt-6 text-sm text-white/60">
        <p>© {year} {settings.name}. Tous droits réservés.</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-white">Confidentialité</Link>
          <Link href="/terms" className="hover:text-white">Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
