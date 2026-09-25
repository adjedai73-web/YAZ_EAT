# YAZ EAT — Site de commande (WhatsApp)

Customers browse the menu, build a cart (extras, notes), fill in the checkout, and the complete order is
sent to the YAZ EAT WhatsApp as a ready-made message. **No database, no Supabase, no account needed** for the
public website.

```
CUSTOMER → WEBSITE → MENU → PRODUCT → CART → CHECKOUT → CONFIRM ORDER → WHATSAPP
```

Stack: Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · deploys on Vercel as a (mostly) static site.

## Run locally

```bash
npm install
cp .env.example .env.local        # then set NEXT_PUBLIC_YAZ_WHATSAPP_NUMBER=213XXXXXXXXX
npm run dev                       # http://localhost:3000
```
Without `NEXT_PUBLIC_YAZ_WHATSAPP_NUMBER` the whole site works, but "Confirmer la commande" stays disabled
(no order can be sent to an unknown number). Restart `npm run dev` after changing `.env.local`.

Other commands: `npm run typecheck`, `npm test` (unit tests), `npm run build && npm start` (production).

## What to edit (and where only)

| What | File |
|---|---|
| WhatsApp number receiving orders | `.env.local` / Vercel env: `NEXT_PUBLIC_YAZ_WHATSAPP_NUMBER` (format `213XXXXXXXXX`) |
| Menu: categories, products, prices, descriptions, images, extras, availability | `src/data/menu.ts` |
| Restaurant info (tagline, about, phone, address, hours, socials, logo, reviews) | `src/config/restaurant.ts` → `restaurant` |
| Orders open/closed, pickup/delivery on/off, delivery fee, zones, minimum order, reference prefix | `src/config/restaurant.ts` → `ordering` |
| Promotions (automatic or promo code) | `src/config/restaurant.ts` → `promotions` |
| Brand tokens (colors, fonts) | `src/app/globals.css` |
| WhatsApp message layout | `src/lib/whatsapp/message.ts` |

**The current menu is a PLACEHOLDER** (example items from the brand identity, example prices). The site shows a
"Menu provisoire" notice while `MENU_IS_PLACEHOLDER = true` in `src/data/menu.ts`. Replace the items with the real
menu, then set it to `false`. Product photos: put files in `public/menu/` and use `image: "/menu/file.jpg"`.

## How ordering works

- **Cart**: 100 % client-side, saved in `localStorage` (survives refresh and navigation). Add / remove / quantity /
  extras / notes. Stored prices are never trusted: every total is recomputed from `src/data/menu.ts`
  (`src/lib/orders/pricing.ts`), and items that no longer exist or are unavailable are flagged "Indisponible".
- **Checkout** (`/checkout`): Nom complet, Téléphone (Algerian format, normalized to 0XXXXXXXXX), Livraison/Retrait,
  Adresse + Commune + Wilaya (required for delivery), Note. Incomplete orders are blocked; all errors show at once.
- **Delivery fee**: from `ordering.delivery` (default fee now; add `zones` later → the customer picks a zone and its
  fee applies). No delivery logic lives in UI components.
- **Confirmer la commande** → builds the order, generates the reference, saves it on the device, opens
  `https://wa.me/213XXXXXXXXX?text=…` (fully URL-encoded), clears the cart and shows `/order/<reference>`:
  "Votre commande est prête à être envoyée." with the reference, customer, items, total, an
  **Envoyer sur WhatsApp** button (in case WhatsApp was blocked or closed) and **Retour au menu**.
- The site never claims the restaurant received or confirmed the order: the restaurant only receives it when the
  customer presses Send in WhatsApp.

### Order reference — important
`YAZ-YYYYMMDD-XXXX` = date (Africa/Algiers) + 4 random characters generated **in the customer's browser**.
It is a **customer reference**, not a server-side unique order ID: without a database, uniqueness cannot be
guaranteed (a collision on the same day is very unlikely but possible). It is only used to identify the order in the
WhatsApp conversation. Prepared orders are kept only in that browser (last 10).

### WhatsApp message (example)
```
🍗 *YAZ EAT — NOUVELLE COMMANDE*

📦 *Commande:* YAZ-20260924-TGDC

👤 *Client:* Ahmed
📞 *Téléphone:* 0550123456
📍 *Adresse:* 12 rue des Roses, Biskra, Biskra

🛒 *COMMANDE*

• 2x Riz parfumé — 600 DA
• 1x Sandwich poulet — 450 DA
   + Fromage — 100 DA

💰 *Sous-total:* 1 150 DA
🚚 *Livraison:* 200 DA

🔥 *TOTAL: 1 350 DA*

🚚 *Type:* Livraison

📝 *Note:* Sonner 2 fois
```

## Admin (future backend)

The admin area (`src/app/admin`, Supabase Auth + roles + RLS, migrations in `supabase/`) is kept in the repository
for the future database version but is **switched off**: every `/admin` URL shows "Administration non disponible".
There is no fake login. It can only be turned on explicitly for backend development
(`YAZ_ADMIN_BACKEND=supabase` + Supabase variables, see `.env.example` and `src/lib/admin/backend.ts`); even then,
the public site keeps reading `src/data/menu.ts` until it is reconnected to the database.

## Deploy on Vercel

1. Push to GitHub → Vercel → New Project → import.
2. Environment variables: `NEXT_PUBLIC_YAZ_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL` (your domain). Nothing else.
3. Deploy. Any menu/config change = commit + redeploy (the menu is compiled into the site).

## Verified in this delivery

- `tsc --noEmit` clean, `next build` succeeds with **no environment variables** (menu/category/product pages prerendered).
- Unit tests 13/13: pricing (menu prices, extras, delivery fee, rejections), cart reconciliation, reference format,
  WhatsApp number normalization, full message + wa.me encoding.
- Browser test (Chromium, mobile viewport) on `npm run dev`: home, menu, category, product with extras, quick add,
  quantity change, cart totals, checkout validation (all 5 errors shown), submit → WhatsApp opened with the full
  message to `213…`, confirmation page, cart emptied. Without the number: site works, confirm button disabled.
- `/admin/*` shows the "non disponible" page.

Not tested: real phones (iPhone/Android opening the WhatsApp app), Lighthouse.

## Known limitations

- The restaurant receives the order only if the customer taps **Send** in WhatsApp.
- No server: no order history for the restaurant, no stats, no guaranteed-unique order number (see above).
- Promo codes placed in `config/restaurant.ts` are visible in the site code (no secret codes without a backend).
- Opening hours are displayed, not enforced — use `ordering.ordersOpen`.
- Fonts load from Google Fonts CDN.

## Next steps (future backend)

Database orders + admin (the `supabase/` migrations and `/admin` code are ready to be reconnected), WhatsApp Cloud
API automatic notification, online payment, delivery zones management, order tracking page.
