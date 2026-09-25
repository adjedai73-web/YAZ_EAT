import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Cookie-less anon client for public, cacheable catalogue reads (RLS applies). */
export function publicSupabase(): SupabaseClient {
  if (!client) {
    const env = requirePublicEnv();
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
