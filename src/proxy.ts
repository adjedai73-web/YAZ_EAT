import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isAdminBackendEnabled } from "@/lib/admin/backend";

export async function proxy(request: NextRequest) {
  // Admin = future database back-office. Disabled → show the notice page, never the admin code.
  if (!isAdminBackendEnabled()) {
    return NextResponse.rewrite(new URL("/admin-indisponible", request.url));
  }
  return updateSession(request);
}

// Only the admin area is concerned; public pages never touch Supabase.
export const config = { matcher: ["/admin", "/admin/:path*"] };
