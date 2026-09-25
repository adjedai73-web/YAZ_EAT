import { FlameMark, Wordmark } from "./wordmark";
import Link from "next/link";
import Image from "next/image";
import type { RestaurantSettings } from "@/lib/types";
import { buildWhatsAppLink } from "@/lib/whatsapp/message";
import { CartButton } from "./cart-button";
import { MobileNav } from "./mobile-nav";
import { WhatsAppIcon } from "./brand-icons";
import { isPromotionLive, promotions } from "@/lib/menu";

// The homepage "#promotions" section only exists when an automatic promotion is live,
// so the link is shown only in that case (same rule as the homepage section).
const hasPromotions = promotions.some((p) => !p.code && isPromotionLive(p));

export const NAV = [
  { href: "/menu", label: "Menu" },
  ...(hasPromotions ? [{ href: "/#promotions", label: "Promotions" }] : []),
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function Logo({ settings, light }: { settings: RestaurantSettings; light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${settings.name} — accueil`}>
      {(light ? settings.logo_dark_url ?? settings.logo_url : settings.logo_url)
        ? <Image src={(light ? settings.logo_dark_url ?? settings.logo_url : settings.logo_url)!} alt="" width={822} height={1280} className="h-11 w-auto" />
        : <FlameMark className="h-9 w-7" />}
      <Wordmark name={settings.name} light={light} className="text-2xl" />
    </Link>
  );
}

export function Header({ settings }: { settings: RestaurantSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo settings={settings} />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-[0.95rem] font-medium text-ink-soft hover:bg-leaf hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {settings.whatsapp && (
            <a
              href={buildWhatsAppLink(settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white hover:brightness-95 sm:inline-flex"
            >
              <WhatsAppIcon className="size-5" /> WhatsApp
            </a>
          )}
          <CartButton />
          <MobileNav links={NAV} whatsapp={settings.whatsapp} />
        </div>
      </div>
    </header>
  );
}
