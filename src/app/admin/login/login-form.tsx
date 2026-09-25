"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/misc";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) { setError("Email et mot de passe obligatoires."); return; }
    setLoading(true); setError(null);
    try {
      const { error: authError } = await browserSupabase().auth.signInWithPassword({ email, password });
      if (authError) {
        setError(/invalid/i.test(authError.message) ? "Email ou mot de passe incorrect." : "Connexion impossible. Réessayez.");
        setLoading(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Connexion impossible. Vérifiez votre connexion internet.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="username" required /></Field>
      <Field label="Mot de passe" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" size="lg" className="w-full" loading={loading}>Se connecter</Button>
    </form>
  );
}
