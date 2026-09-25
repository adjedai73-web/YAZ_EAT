import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePublicEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Service-role client. SERVER ONLY (guarded by "server-only").
 * Used exclusively to call the locked-down RPCs: price_order, create_order, get_public_order.
 */
export function serviceSupabase(): SupabaseClient {
  if (!client) {
    const env = requirePublicEnv();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
    client = createClient(env.supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
