import { publicEnv } from "@/lib/env";
import type { Product, RestaurantSettings } from "@/lib/types";

/** Structured data needs absolute URLs; local files (/brand/…) are prefixed with the site URL. */
const absolute = (u: string) => (u.startsWith("/") ? `${publicEnv.siteUrl}${u}` : u);

export function restaurantJsonLd(s: RestaurantSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: s.name,
    url: publicEnv.siteUrl,
    ...(s.logo_url && { logo: absolute(s.logo_url), image: absolute(s.hero_image_url ?? s.logo_url) }),
    ...(s.phone && { telephone: s.phone }),
    ...(s.address && {
      address: { "@type": "PostalAddress", streetAddress: s.address, addressLocality: s.city ?? undefined, addressCountry: "DZ" },
    }),
    servesCuisine: ["Poulet à la braise", "Poulet rôti", "Sandwichs", "Accompagnements"],
    priceRange: "$$",
    currenciesAccepted: "DZD",
    hasMenu: `${publicEnv.siteUrl}/menu`,
    acceptsReservations: false,
    sameAs: [s.instagram_url, s.facebook_url, s.tiktok_url].filter(Boolean),
  };
}

export function productJsonLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? undefined,
    image: p.image_url ?? undefined,
    url: `${publicEnv.siteUrl}/product/${p.slug}`,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "DZD",
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}
