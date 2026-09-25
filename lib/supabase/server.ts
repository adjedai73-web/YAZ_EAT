import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requirePublicEnv } from "@/lib/env";

/** Per-request client bound to the user's auth cookies (admin area). RLS applies. */
export async function serverSupabase() {
  const env = requirePublicEnv();
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are refreshed by the proxy instead.
        }
      },
    },
  });
}
