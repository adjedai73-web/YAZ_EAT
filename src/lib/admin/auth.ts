import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";

/** Server-side admin check for pages. Verifies the JWT with Supabase Auth, then the role in profiles. */
export const getAdminSession = cache(async () => {
  const supabase = await serverSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role, email, full_name").eq("id", user.id).maybeSingle();
  return { supabase, user, profile, isAdmin: profile?.role === "admin" };
});

/** Same check for server actions: never redirects, throws instead. */
export async function requireAdminAction() {
  const supabase = await serverSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("FORBIDDEN");
  return { supabase, user };
}
