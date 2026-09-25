import type { Metadata } from "next";
import { getAdminSession } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/actions";
import { AdminShell } from "@/components/admin/shell";
import { Toaster } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: { default: "Administration", template: "%s — Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile, isAdmin } = await getAdminSession();

  if (!isAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center bg-leaf px-4">
        <div className="max-w-md rounded-[var(--radius-card)] bg-paper p-8 text-center">
          <h1 className="text-2xl font-extrabold">Accès refusé</h1>
          <p className="mt-2 text-ink-soft">Le compte <strong>{user.email}</strong> n&apos;a pas les droits administrateur.</p>
          <form action={signOut} className="mt-6"><Button type="submit" variant="brand">Se déconnecter</Button></form>
        </div>
      </main>
    );
  }

  const { data: settings } = await supabase.from("restaurant_settings").select("name").eq("id", 1).maybeSingle();
  return (
    <>
      <AdminShell email={profile?.email ?? user.email ?? ""} restaurantName={settings?.name ?? "YAZ EAT"}>{children}</AdminShell>
      <Toaster />
    </>
  );
}
