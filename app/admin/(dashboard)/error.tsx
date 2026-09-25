"use client";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-extrabold">Chargement impossible</h1>
      <p className="mt-2 text-ink-soft">La base de données n&apos;a pas répondu. Vérifiez votre connexion puis réessayez.</p>
      <Button className="mt-6" onClick={reset}>Réessayer</Button>
    </div>
  );
}
