import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/site/brand-lockup";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };

export default function AdminUnavailablePage() {
  return (
    <main className="texture-crumple grid min-h-dvh place-items-center bg-brand-900 px-4 py-10 text-white">
      <div className="w-full max-w-md text-center">
        <BrandLockup onDark priority alt="YAZ EAT" className="mx-auto h-16" />
        <div className="mt-8 rounded-[var(--radius-card)] bg-paper p-6 text-left text-ink shadow-xl">
          <h1 className="text-2xl font-extrabold">Administration non disponible</h1>
          <p className="mt-2 text-ink-soft">
            L&apos;espace administrateur (commandes, produits, statistiques) nécessite le futur backend avec base de données.
            Il n&apos;est pas actif dans cette version.
          </p>
          <p className="mt-3 text-ink-soft">
            Pour l&apos;instant, le menu se modifie dans le fichier <code className="rounded bg-leaf px-1">src/data/menu.ts</code> et
            les commandes arrivent directement sur WhatsApp.
          </p>
          <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-[var(--radius-control)] bg-sun-500 px-6 font-semibold text-brand-950">
            Retour au site
          </Link>
        </div>
      </div>
    </main>
  );
}
