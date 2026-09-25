/**
 * The admin area (src/app/admin) is the FUTURE database-backed back-office (Supabase).
 * In this version the public site reads its menu from src/data/menu.ts and orders go to
 * WhatsApp only, so the admin is switched OFF: every /admin URL shows a notice instead.
 *
 * It can only be switched on explicitly, for development of the future backend:
 *   YAZ_ADMIN_BACKEND=supabase + NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (+ SUPABASE_SERVICE_ROLE_KEY). Its security (Supabase Auth + admin role + RLS) is unchanged.
 * Note: until the public site is reconnected to that backend, changes made in the admin
 * do NOT appear on the website.
 */
export function isAdminBackendEnabled() {
  return (
    process.env.YAZ_ADMIN_BACKEND === "supabase" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
