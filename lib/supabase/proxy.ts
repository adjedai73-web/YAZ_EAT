import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";

/** Refreshes the Supabase session cookie and gates /admin behind a logged-in user.
 *  The admin ROLE is verified again server-side in the admin layout and every action. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return response;

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!data?.claims && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}
