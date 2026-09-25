/** Centralized environment access. Public values are inlined by Next at build time. */

const FALLBACK_SITE_URL = "https://yaz-eat.vercel.app";

function normalizeSiteUrl(value?: string) {
  const raw = value?.trim();

  if (!raw) {
    return FALLBACK_SITE_URL;
  }

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    new URL(candidate);
    return candidate;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
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
