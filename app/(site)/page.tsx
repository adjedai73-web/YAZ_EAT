import Link from "next/link";
import Image from "next/image";
import { Star, Clock, MapPin, Phone } from "lucide-react";
import {
  getActivePromotions, getCategories, getHighlightedProducts, getProductIdsWithExtras, getSettings,
} from "@/lib/data/catalog";
import { ButtonLink } from "@/components/ui/button";
import { FlameMark, Wordmark } from "@/components/site/wordmark";
import { ProductCard } from "@/components/site/product-card";
import { ProductImage } from "@/components/site/product-image";
import { PromoCard } from "@/components/site/promo-card";
import { SocialLinks } from "@/components/site/social-links";
import { WhatsAppIcon } from "@/components/site/brand-icons";
import { buildWhatsAppLink } from "@/lib/whatsapp/message";
import { restaurantJsonLd } from "@/lib/seo";


export default async function HomePage() {
  const [settings, categories, highlighted, promotions, withExtras] = await Promise.all([
    getSettings(), getCategories(), getHighlightedProducts(), getActivePromotions(), getProductIdsWithExtras(),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd(settings)) }} />

      {/* HERO — black crumpled paper + flame glow, giant brand wordmark */}
      <section className="texture-crumple relative overflow-hidden bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-10 md:grid-cols-[1.15fr_1fr] md:items-end md:pb-20 md:pt-16">
          <div className="animate-rise">
            {(settings.logo_dark_url ?? settings.logo_url)
              ? <Image src={(settings.logo_dark_url ?? settings.logo_url)!} alt={`Logo ${settings.name}`} width={822} height={1280} priority className="mb-4 h-28 w-auto md:h-40" />
              : <FlameMark className="mb-4 h-14 w-11 md:h-20 md:w-16" />}
            <h1 className="leading-[0.85]">
              <Wordmark name={settings.name} light className="block text-[clamp(4.25rem,19vw,10.5rem)] tracking-[-0.05em]" />
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/85 md:text-xl">
              {settings.tagline ?? "Vos plats préférés, commandés en quelques secondes."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/menu" size="lg">Commander maintenant</ButtonLink>
              <ButtonLink href="/menu" size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:border-white hover:bg-white/5">
                Voir le menu
              </ButtonLink>
            </div>
          </div>
          {settings.hero_image_url && (
            <ProductImage
              src={settings.hero_image_url}
              alt={`Plats ${settings.name}`}
              sizes="(min-width: 768px) 45vw, 100vw"
              priority
              className="aspect-[4/3] w-full rounded-[2rem] ring-4 ring-sun-500 md:aspect-[4/5] md:rounded-t-[12rem] md:rounded-b-[2rem]"
            />
          )}
        </div>
      </section>

      {/* BRAND RIBBON — sticker band from the identity's social animations */}
      <div className="relative z-10 -mt-6 overflow-x-clip py-2" aria-hidden="true">
        <div className="-mx-[5%] -rotate-2 overflow-hidden border-y-2 border-brand-900 bg-sun-500 py-2.5">
        <div className="animate-marquee flex w-max whitespace-nowrap font-display text-lg font-extrabold text-brand-900 md:text-xl">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="flex gap-8 pr-8">
              {Array.from({ length: 4 }).map((__, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span>Meilleure cuisson</span><FlameMark className="h-6 w-5" />
                  <Wordmark name={settings.name} /><FlameMark className="h-6 w-5" />
                  <span>Frites croustillantes</span><FlameMark className="h-6 w-5" />
                </span>
              ))}
            </span>
          ))}
        </div>
        </div>
      </div>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="cat-title">
          <div className="flex items-end justify-between gap-4">
            <h2 id="cat-title" className="text-3xl font-extrabold">Que voulez-vous manger ?</h2>
            <Link href="/menu" className="hidden text-sm font-semibold text-brand-800 hover:underline sm:block">Tout le menu</Link>
          </div>
          <ul className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {categories.map((c) => (
              <li key={c.id} className="w-32 shrink-0 snap-start md:w-auto">
                <Link href={`/menu/${c.slug}`} className="block rounded-[var(--radius-card)] border border-line p-2 transition-colors hover:border-brand-800">
                  <ProductImage src={c.image_url} alt={c.name} sizes="160px" className="aspect-square rounded-xl" />
                  <span className="block px-1 pb-1 pt-2 text-center font-semibold">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* BEST SELLERS */}
      {highlighted.length > 0 && (
        <section className="bg-leaf py-12" aria-labelledby="best-title">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="best-title" className="text-3xl font-extrabold">Les plus commandés</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {highlighted.map((p, i) => <ProductCard key={p.id} product={p} hasExtras={withExtras.has(p.id)} priority={i < 2} />)}
            </div>
          </div>
        </section>
      )}

      {/* PROMOTIONS */}
      {promotions.length > 0 && (
        <section id="promotions" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12" aria-labelledby="promo-title">
          <h2 id="promo-title" className="text-3xl font-extrabold">Promotions en cours</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {promotions.map((p) => <PromoCard key={p.id} promotion={p} />)}
          </div>
        </section>
      )}

      {/* HOW IT WORKS — a real sequence, so numbered */}
      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="how-title">
        <h2 id="how-title" className="text-3xl font-extrabold">Comment ça marche</h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["Choisissez vos plats", "Parcourez le menu et ajoutez vos plats au panier."],
            ["Passez votre commande", "Sans compte : nom, téléphone et adresse suffisent."],
            ["Recevez votre commande", "En livraison ou à récupérer au restaurant."],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-4 rounded-[var(--radius-card)] border border-line p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-brand-900 bg-sun-500 font-display text-2xl font-extrabold text-brand-900">{i + 1}</span>
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-ink-soft">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ABOUT */}
      {settings.about_text && (
        <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="about-title">
          <div className="rounded-[2rem] bg-brand-100 p-8 md:p-12">
            <h2 id="about-title" className="text-3xl font-extrabold text-brand-900">À propos de {settings.name}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-950/80 whitespace-pre-line">{settings.about_text}</p>
            <Link href="/about" className="mt-6 inline-block font-semibold text-brand-800 underline underline-offset-4">En savoir plus</Link>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      {settings.reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="text-3xl font-extrabold">Ce que disent nos clients</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {settings.reviews.map((r, i) => (
              <li key={i} className="rounded-[var(--radius-card)] border border-line p-5">
                <div className="flex gap-0.5 text-sun-500" aria-label={`${r.rating} sur 5`}>
                  {Array.from({ length: 5 }, (_, s) => <Star key={s} className="size-4" fill={s < r.rating ? "currentColor" : "none"} />)}
                </div>
                <p className="mt-3">« {r.text} »</p>
                <p className="mt-3 text-sm font-semibold text-ink-soft">{r.name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CONTACT */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4" aria-labelledby="contact-title">
        <div className="grid gap-6 rounded-[2rem] border border-line p-6 md:grid-cols-2 md:p-10">
          <div>
            <h2 id="contact-title" className="text-3xl font-extrabold">Nous trouver</h2>
            <ul className="mt-5 space-y-3">
              {settings.address && <li className="flex gap-3"><MapPin className="size-5 shrink-0 text-brand-800" />{settings.address}{settings.city ? `, ${settings.city}` : ""}</li>}
              {settings.phone && <li className="flex gap-3"><Phone className="size-5 shrink-0 text-brand-800" /><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:underline">{settings.phone}</a></li>}
              {settings.opening_hours && <li className="flex gap-3"><Clock className="size-5 shrink-0 text-brand-800" /><span className="whitespace-pre-line">{settings.opening_hours}</span></li>}
            </ul>
            <SocialLinks settings={settings} className="mt-5 text-brand-800" />
          </div>
          <div className="flex flex-col justify-end gap-3">
            {settings.whatsapp && (
              <a href={buildWhatsAppLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-semibold text-white hover:brightness-95">
                <WhatsAppIcon /> Écrire sur WhatsApp
              </a>
            )}
            <ButtonLink href="/menu" size="lg" variant="brand">Voir le menu</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
