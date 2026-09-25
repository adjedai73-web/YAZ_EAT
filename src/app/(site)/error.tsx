"use client";
import { Button, ButtonLink } from "@/components/ui/button";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold">Cette page n'a pas pu se charger</h1>
      <p className="mt-3 text-ink-soft">Vérifiez votre connexion internet puis réessayez. Votre panier est conservé.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <ButtonLink href="/" variant="outline">Accueil</ButtonLink>
      </div>
    </div>
  );
}
