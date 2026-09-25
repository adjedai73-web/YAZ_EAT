-- =====================================================================
-- YAZ EAT — 0001 : schema (types, tables, constraints, indexes, triggers)
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- ---------- Enums ----------
create type public.app_role      as enum ('customer', 'admin');
create type public.order_status  as enum ('NEW','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');
create type public.order_type    as enum ('DELIVERY', 'PICKUP');
create type public.discount_type as enum ('PERCENTAGE', 'FIXED');

-- ---------- Generic updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Profiles (1 row per auth user) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        public.app_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ---------- Catalogue ----------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 500),
  image_url   text,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index categories_active_sort_idx on public.categories (active, sort_order);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 1000),
  price       integer not null check (price between 0 and 1000000),   -- DA, integer
  image_url   text,
  active      boolean not null default true,   -- enabled / visible on the site
  available   boolean not null default true,   -- in stock (false => "Indisponible")
  featured    boolean not null default false,
  bestseller  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_category_idx   on public.products (category_id, sort_order);
create index products_active_idx     on public.products (active, available);
create index products_featured_idx   on public.products (featured)   where featured;
create index products_bestseller_idx on public.products (bestseller) where bestseller;

create table public.extras (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  price       integer not null check (price between 0 and 100000),
  available   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index extras_available_idx on public.extras (available, sort_order);

-- An extra can be attached to a product directly, or to a whole category.
create table public.product_extras (
  product_id uuid not null references public.products (id) on delete cascade,
  extra_id   uuid not null references public.extras (id)   on delete cascade,
  primary key (product_id, extra_id)
);
create index product_extras_extra_idx on public.product_extras (extra_id);

create table public.category_extras (
  category_id uuid not null references public.categories (id) on delete cascade,
  extra_id    uuid not null references public.extras (id)     on delete cascade,
  primary key (category_id, extra_id)
);
create index category_extras_extra_idx on public.category_extras (extra_id);

-- ---------- Delivery ----------
create table public.delivery_zones (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  fee         integer not null check (fee between 0 and 100000),
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Promotions ----------
create table public.promotions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(btrim(name)) between 1 and 120),
  description    text check (description is null or char_length(description) <= 500),
  code           text unique check (code is null or code ~ '^[A-Z0-9_-]{3,30}$'), -- NULL = automatic
  discount_type  public.discount_type not null,
  discount_value integer not null check (discount_value > 0),
  min_order      integer not null default 0 check (min_order >= 0),
  start_date     timestamptz not null default now(),
  end_date       timestamptz,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint promotions_pct_max  check (discount_type <> 'PERCENTAGE' or discount_value <= 100),
  constraint promotions_dates_ok check (end_date is null or end_date > start_date)
);
create index promotions_active_idx on public.promotions (active, start_date, end_date);

-- ---------- Restaurant settings (singleton row id = 1) ----------
create table public.restaurant_settings (
  id                   smallint primary key default 1 check (id = 1),
  name                 text not null default 'YAZ EAT',
  tagline              text,
  about_text           text,
  logo_url             text,
  hero_image_url       text,
  phone                text,
  whatsapp             text check (whatsapp is null or whatsapp ~ '^[1-9][0-9]{7,14}$'), -- E.164 digits, no "+"
  email                text,
  address              text,
  city                 text,
  maps_url             text,
  instagram_url        text,
  facebook_url         text,
  tiktok_url           text,
  opening_hours        text,
  reviews              jsonb not null default '[]'::jsonb check (jsonb_typeof(reviews) = 'array'),
  order_prefix         text not null default 'YAZ' check (order_prefix ~ '^[A-Z]{2,6}$'),
  orders_open          boolean not null default true,
  delivery_enabled     boolean not null default true,
  pickup_enabled       boolean not null default true,
  default_delivery_fee integer not null default 200 check (default_delivery_fee between 0 and 100000),
  min_order_amount     integer not null default 0 check (min_order_amount >= 0),
  updated_at           timestamptz not null default now(),
  constraint settings_one_mode check (delivery_enabled or pickup_enabled)
);
insert into public.restaurant_settings (id, name, tagline)
values (1, 'YAZ EAT', 'Vos plats préférés, commandés en quelques secondes.')
on conflict (id) do nothing;

-- ---------- Orders ----------
create table public.order_counters (
  day        date primary key,
  last_value integer not null
);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  customer_name      text not null check (char_length(btrim(customer_name)) between 2 and 80),
  customer_phone     text not null check (customer_phone ~ '^0[2-7][0-9]{8}$'),
  order_type         public.order_type not null,
  address            text check (address is null or char_length(address) <= 300),
  commune            text check (commune is null or char_length(commune) <= 80),
  wilaya             text check (wilaya is null or char_length(wilaya) <= 80),
  delivery_zone_id   uuid references public.delivery_zones (id) on delete set null,
  delivery_zone_name text,
  notes              text check (notes is null or char_length(notes) <= 500),
  subtotal           integer not null check (subtotal >= 0),
  discount           integer not null default 0 check (discount >= 0),
  promotion_id       uuid references public.promotions (id) on delete set null,
  promotion_name     text,
  delivery_fee       integer not null default 0 check (delivery_fee >= 0),
  total              integer not null check (total >= 0),
  status             public.order_status not null default 'NEW',
  cancelled_reason   text,
  whatsapp_notified_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint orders_total_ok     check (total = subtotal - discount + delivery_fee),
  constraint orders_discount_ok  check (discount <= subtotal),
  constraint orders_delivery_addr check (order_type <> 'DELIVERY' or (address is not null and commune is not null and wilaya is not null))
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx  on public.orders (status, created_at desc);
create index orders_phone_idx   on public.orders (customer_phone);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  product_name text not null,                 -- snapshot
  unit_price   integer not null check (unit_price >= 0),     -- snapshot (base price)
  extras_total integer not null default 0 check (extras_total >= 0), -- per unit
  quantity     integer not null check (quantity between 1 and 50),
  line_total   integer not null check (line_total >= 0),
  notes        text check (notes is null or char_length(notes) <= 200),
  created_at   timestamptz not null default now(),
  constraint order_items_line_ok check (line_total = (unit_price + extras_total) * quantity)
);
create index order_items_order_idx   on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_item_extras (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  extra_id      uuid references public.extras (id) on delete set null,
  extra_name    text not null,                -- snapshot
  price         integer not null check (price >= 0)   -- snapshot
);
create index order_item_extras_item_idx on public.order_item_extras (order_item_id);

create table public.order_status_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_events_order_idx on public.order_status_events (order_id, created_at);

-- ---------- updated_at triggers ----------
create trigger trg_profiles_updated   before update on public.profiles            for each row execute function public.set_updated_at();
create trigger trg_categories_updated before update on public.categories          for each row execute function public.set_updated_at();
create trigger trg_products_updated   before update on public.products            for each row execute function public.set_updated_at();
create trigger trg_extras_updated     before update on public.extras              for each row execute function public.set_updated_at();
create trigger trg_zones_updated      before update on public.delivery_zones      for each row execute function public.set_updated_at();
create trigger trg_promos_updated     before update on public.promotions          for each row execute function public.set_updated_at();
create trigger trg_settings_updated   before update on public.restaurant_settings for each row execute function public.set_updated_at();
create trigger trg_orders_updated     before update on public.orders              for each row execute function public.set_updated_at();
