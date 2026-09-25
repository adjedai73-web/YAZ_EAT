/**
 * YAZ EAT — single source of truth for restaurant & ordering settings.
 * Edit this file (and the WhatsApp env variable) — nothing else is hardcoded in the UI.
 * Everything here is PUBLIC (bundled into the browser): never put secrets in this file.
 */

/**
 * Normalizes an Algerian number to the international format used by wa.me: 213XXXXXXXXX.
 * Accepts "0550 12 34 56", "+213 550 12 34 56", "00213550123456", "213550123456".
 * Returns null when the value is missing or invalid.
 */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = `213${d.slice(1)}`;
  return /^213[5-7]\d{8}$/.test(d) ? d : null;
}

/** Restaurant WhatsApp that receives the orders — set ONCE via NEXT_PUBLIC_YAZ_WHATSAPP_NUMBER. */
export const WHATSAPP_NUMBER = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_YAZ_WHATSAPP_NUMBER);

export const restaurant = {
  name: "YAZ EAT",
  // Brand copy taken from the official YAZ EAT identity.
  tagline: "Meilleur poulet, saveur garantie.",
  about:
    "Yaz Eat est un fast food spécialisé dans le poulet rôti : le meilleur blanc de poulet et des frites parfaitement cuites.",
  /** Public URL (https://…) or a file in /public, e.g. "/brand/logo.png". null = flame icon. */
  logoUrl: "/brand/yaz-eat-logo.jpeg" as string | null, // official logo on its black background — light surfaces (header) + SEO
  /** Background-removed version (from the Canva export). Only for DARK backgrounds: its rooster
   *  and "YAZ" letters are black/white negative space and disappear on light backgrounds. */
  logoOnDarkUrl: "/brand/yaz-eat-logo-transparent.png" as string | null,
  heroImageUrl: null as string | null,
  // Contact details — fill in with the real values (null = hidden on the site).
  phone: "0553 70 41 81" as string | null,
  email: null as string | null,
  address: "Les Bananiers" as string | null,
  city: "Alger" as string | null,
  mapsUrl: null as string | null,
  instagramUrl: "https://instagram.com/yaz_eat/" as string | null,
  instagramName: "Yaz Eat" as string | null,
  facebookUrl: "https://facebook.com/profile.php?id=61563930779857" as string | null,
  facebookName: "Yaz Eat" as string | null,
  tiktokUrl: null as string | null,
  /** Free text, one line per day/range. Displayed only (not enforced). */
  openingHours: "Samedi – Jeudi : 10h00 – 22h00\nVendredi : 18h00 – 22h00" as string | null,
  /** Real customer reviews only. Empty = section hidden. */
  reviews: [] as { name: string; text: string; rating: number }[],
};

export const ordering = {
  /** Master switch: false shows "commandes fermées" and disables checkout. */
  ordersOpen: true,
  /** Prefix of the customer reference: YAZ-YYYYMMDD-XXXX. */
  referencePrefix: "YAZ",
  /** Minimum subtotal (DA) for any order. 0 = none. */
  minOrderAmount: 0,
  pickup: { enabled: true },
  delivery: {
    enabled: true,
    /** Fee (DA) used when no delivery zones are configured. */
    defaultFee: 200,
    /**
     * Optional zones. When at least one active zone exists, the customer must pick one
     * and its fee replaces defaultFee. Example: { id: "centre", name: "Centre-ville", fee: 150, active: true }
     */
    zones: [] as { id: string; name: string; fee: number; active: boolean }[],
  },
};

/**
 * Local promotions. code: null = applied automatically (best one wins);
 * code: "YAZ10" = promo code typed at checkout (codes are visible in the site's code — no secret codes).
 * Dates are ISO strings; end: null = no end date.
 */
export const promotions: {
  id: string; name: string; description: string | null; code: string | null;
  type: "PERCENTAGE" | "FIXED"; value: number; minOrder: number; start: string; end: string | null; active: boolean;
}[] = [];
