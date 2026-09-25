-- =====================================================================
-- YAZ EAT — 0002 : auth helpers, Row Level Security, storage
-- =====================================================================

-- ---------- Profile auto-creation on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Role helper (used by every admin policy) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------- Enable RLS everywhere ----------
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.extras              enable row level security;
alter table public.product_extras      enable row level security;
alter table public.category_extras     enable row level security;
alter table public.delivery_zones      enable row level security;
alter table public.promotions          enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.order_counters      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_item_extras   enable row level security;
alter table public.order_status_events enable row level security;

-- ---------- Profiles ----------
-- A user can read his own profile; only admins can change roles.
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Public catalogue (read) ----------
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (active or (select public.is_admin()));

create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    (active and exists (select 1 from public.categories c where c.id = category_id and c.active))
    or (select public.is_admin())
  );

create policy extras_public_read on public.extras
  for select to anon, authenticated
  using (available or (select public.is_admin()));

create policy product_extras_public_read on public.product_extras
  for select to anon, authenticated using (true);
create policy category_extras_public_read on public.category_extras
  for select to anon, authenticated using (true);

create policy zones_public_read on public.delivery_zones
  for select to anon, authenticated
  using (active or (select public.is_admin()));

-- Only automatic (code-less), currently valid promotions are public.
-- Promo codes are never readable by customers; they are checked server-side.
create policy promotions_public_read on public.promotions
  for select to anon, authenticated
  using (
    (active and code is null and start_date <= now() and (end_date is null or end_date > now()))
    or (select public.is_admin())
  );

create policy settings_public_read on public.restaurant_settings
  for select to anon, authenticated using (true);

-- ---------- Admin write access on catalogue & settings ----------
create policy categories_admin_write on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_admin_write on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy extras_admin_write on public.extras for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy product_extras_admin_write on public.product_extras for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy category_extras_admin_write on public.category_extras for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy zones_admin_write on public.delivery_zones for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy promotions_admin_write on public.promotions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy settings_admin_update on public.restaurant_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Orders: admins only. Customers NEVER read the tables directly. ----------
-- Order creation goes through public.create_order() (service_role only, server-side).
create policy orders_admin_read   on public.orders for select to authenticated using ((select public.is_admin()));
create policy orders_admin_update on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy order_items_admin_read on public.order_items for select to authenticated using ((select public.is_admin()));
create policy order_item_extras_admin_read on public.order_item_extras for select to authenticated using ((select public.is_admin()));
create policy order_events_admin_read on public.order_status_events for select to authenticated using ((select public.is_admin()));
-- order_counters: no policy at all => inaccessible to anon/authenticated.

-- Defense in depth: anon can never write anything.
revoke insert, update, delete, truncate on all tables in schema public from anon;
-- Authenticated users cannot touch order financial data through the API except status fields via policies above.
revoke insert, delete, truncate on public.orders, public.order_items, public.order_item_extras,
  public.order_status_events, public.order_counters from authenticated;
revoke update on public.order_items, public.order_item_extras, public.order_status_events, public.order_counters from authenticated;
-- Admins may only change status-related columns of an order.
revoke update on public.orders from authenticated;
grant update (status, cancelled_reason, whatsapp_notified_at) on public.orders to authenticated;
-- Nobody but admins (via policy) can update profiles; role column protected by policy.
revoke insert, delete on public.profiles from authenticated;

-- ---------- Realtime for the admin orders screen (RLS applies) ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ---------- Storage: public "media" bucket, admin-only writes ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy media_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy media_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
create policy media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));
