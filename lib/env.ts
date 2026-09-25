/** Centralized environment access. Public values are inlined by Next at build time. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

export function requirePublicEnv() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return publicEnv;
}
