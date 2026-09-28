import { BrandLockup } from "@/components/site/brand-lockup";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion administrateur", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  const supabase = await serverSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(safeNext);

  return (
    <main className="texture-crumple grid min-h-dvh place-items-center bg-brand-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <BrandLockup onDark priority alt="YAZ EAT" className="mx-auto mb-6 h-16" />
        <div className="rounded-[var(--radius-card)] bg-paper p-6 shadow-xl">
          <h1 className="text-2xl font-extrabold">Espace administrateur</h1>
          <p className="mt-1 text-sm text-ink-soft">Connectez-vous avec votre compte restaurant.</p>
          <LoginForm next={safeNext} />
        </div>
      </div>
    </main>
  );
}
