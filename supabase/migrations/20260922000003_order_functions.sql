-- =====================================================================
-- YAZ EAT — 0003 : order engine (server-side pricing), status log, admin stats
-- =====================================================================

-- ---------- Status history ----------
create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

create trigger trg_orders_status_log
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- ---------- Human readable order number: PREFIX-YYYYMMDD-0001 (Algiers day) ----------
create or replace function public.next_order_number(p_prefix text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_day date := (now() at time zone 'Africa/Algiers')::date;
  v_n   integer;
begin
  insert into public.order_counters as c (day, last_value) values (v_day, 1)
  on conflict (day) do update set last_value = c.last_value + 1
  returning c.last_value into v_n;
  return p_prefix || '-' || to_char(v_day, 'YYYYMMDD') || '-' || lpad(v_n::text, 4, '0');
end $$;
revoke all on function public.next_order_number(text) from public, anon, authenticated;

-- ---------- Promotion evaluation (shared by preview + order creation) ----------
-- Returns the promotion that applies to a subtotal: the given code if valid,
-- otherwise the best automatic promotion. Raises PROMO_INVALID for a bad code.
create or replace function public.resolve_promotion(p_code text, p_subtotal integer)
returns table (promotion_id uuid, promotion_name text, discount integer)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_code text := nullif(upper(btrim(coalesce(p_code, ''))), '');
begin
  if v_code is not null then
    return query
      select p.id, p.name,
             least(p_subtotal, case when p.discount_type = 'PERCENTAGE'
                                    then (p_subtotal * p.discount_value) / 100
                                    else p.discount_value end)::integer
      from public.promotions p
      where p.code = v_code and p.active
        and p.start_date <= now() and (p.end_date is null or p.end_date > now())
        and p.min_order <= p_subtotal;
    if not found then
      raise exception 'PROMO_INVALID' using errcode = 'P0001';
    end if;
    return;
  end if;

  return query
    select p.id, p.name,
           least(p_subtotal, case when p.discount_type = 'PERCENTAGE'
                                  then (p_subtotal * p.discount_value) / 100
                                  else p.discount_value end)::integer as d
    from public.promotions p
    where p.code is null and p.active
      and p.start_date <= now() and (p.end_date is null or p.end_date > now())
      and p.min_order <= p_subtotal
    order by d desc, p.created_at
    limit 1;
end $$;
revoke all on function public.resolve_promotion(text, integer) from public, anon, authenticated;
grant execute on function public.resolve_promotion(text, integer) to service_role;

-- ---------- Pricing engine: single source of truth for every amount ----------
-- The client sends product ids, quantities and extra ids only. Every price,
-- availability, promotion and delivery fee is read here. Client totals are ignored.
-- Used by create_order() and by the checkout summary (p_quote = true: a missing
-- delivery zone yields fee 0 + "zone_missing" instead of an error).
--
-- payload = { order_type, delivery_zone_id, promo_code,
--             items: [{ product_id, quantity, extra_ids: [uuid], notes }] }
-- Errors: "CODE" or "CODE:detail" (errcode P0001), mapped to French by the app.
create or replace function public.price_order(payload jsonb, p_quote boolean default false)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  s            public.restaurant_settings%rowtype;
  v_type       public.order_type;
  v_items      jsonb := payload -> 'items';
  v_item       jsonb;
  v_product    record;
  v_qty        integer;
  v_extra_ids  uuid[];
  v_extra      record;
  v_extras_sum integer;
  v_subtotal   integer := 0;
  v_discount   integer := 0;
  v_promo_id   uuid;
  v_promo_name text;
  v_fee        integer := 0;
  v_zone_id    uuid;
  v_zone_name  text;
  v_zone_missing boolean := false;
  v_lines      jsonb := '[]'::jsonb;
  v_line       jsonb;
begin
  select * into s from public.restaurant_settings where id = 1;
  if not found then raise exception 'SETTINGS_MISSING' using errcode = 'P0001'; end if;

  begin
    v_type := (payload ->> 'order_type')::public.order_type;
  exception when others then
    raise exception 'INVALID_ORDER_TYPE' using errcode = 'P0001';
  end;
  if v_type is null then raise exception 'INVALID_ORDER_TYPE' using errcode = 'P0001'; end if;
  if v_type = 'DELIVERY' and not s.delivery_enabled then raise exception 'DELIVERY_DISABLED' using errcode = 'P0001'; end if;
  if v_type = 'PICKUP'   and not s.pickup_enabled   then raise exception 'PICKUP_DISABLED'   using errcode = 'P0001'; end if;

  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;
  if jsonb_array_length(v_items) > 40 then raise exception 'TOO_MANY_ITEMS' using errcode = 'P0001'; end if;

  for v_item in select value from jsonb_array_elements(v_items) loop
    begin
      v_qty := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end;
    if v_qty is null or v_qty < 1 or v_qty > 50 then raise exception 'INVALID_QUANTITY' using errcode = 'P0001'; end if;

    select p.id, p.name, p.price, p.available, p.active, p.category_id, c.active as cat_active
      into v_product
      from public.products p join public.categories c on c.id = p.category_id
      where p.id = (case when (v_item ->> 'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                         then (v_item ->> 'product_id')::uuid end);
    if not found or not v_product.active or not v_product.cat_active then
      raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
    end if;
    if not v_product.available then
      raise exception 'PRODUCT_UNAVAILABLE:%', v_product.name using errcode = 'P0001';
    end if;

    if jsonb_typeof(coalesce(v_item -> 'extra_ids', '[]'::jsonb)) <> 'array' then
      raise exception 'INVALID_EXTRA' using errcode = 'P0001';
    end if;
    v_extra_ids := array(
      select distinct x::uuid
      from jsonb_array_elements_text(coalesce(v_item -> 'extra_ids', '[]'::jsonb)) x
      where x ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    );
    if jsonb_array_length(coalesce(v_item -> 'extra_ids', '[]'::jsonb)) <> coalesce(array_length(v_extra_ids, 1), 0) then
      raise exception 'INVALID_EXTRA' using errcode = 'P0001';
    end if;

    v_extras_sum := 0;
    v_line := jsonb_build_object('product_id', v_product.id, 'name', v_product.name,
                                 'unit_price', v_product.price, 'quantity', v_qty,
                                 'notes', nullif(left(btrim(coalesce(v_item ->> 'notes', '')), 200), ''),
                                 'extras', '[]'::jsonb);
    for v_extra in
      select e.id, e.name, e.price, e.available,
             (exists (select 1 from public.product_extras pe where pe.product_id = v_product.id and pe.extra_id = e.id)
              or exists (select 1 from public.category_extras ce where ce.category_id = v_product.category_id and ce.extra_id = e.id)) as allowed
      from public.extras e where e.id = any (v_extra_ids)
      order by e.sort_order, e.name
    loop
      if not v_extra.allowed then raise exception 'INVALID_EXTRA' using errcode = 'P0001'; end if;
      if not v_extra.available then raise exception 'EXTRA_UNAVAILABLE:%', v_extra.name using errcode = 'P0001'; end if;
      v_extras_sum := v_extras_sum + v_extra.price;
      v_line := jsonb_set(v_line, '{extras}', (v_line -> 'extras') ||
                jsonb_build_object('id', v_extra.id, 'name', v_extra.name, 'price', v_extra.price));
    end loop;
    if jsonb_array_length(v_line -> 'extras') <> coalesce(array_length(v_extra_ids, 1), 0) then
      raise exception 'INVALID_EXTRA' using errcode = 'P0001';
    end if;

    v_line := v_line || jsonb_build_object('extras_total', v_extras_sum,
                                           'line_total', (v_product.price + v_extras_sum) * v_qty);
    v_subtotal := v_subtotal + (v_product.price + v_extras_sum) * v_qty;
    v_lines := v_lines || v_line;
  end loop;

  select r.promotion_id, r.promotion_name, r.discount
    into v_promo_id, v_promo_name, v_discount
    from public.resolve_promotion(payload ->> 'promo_code', v_subtotal) r;
  v_discount := coalesce(v_discount, 0);

  if v_type = 'DELIVERY' then
    if exists (select 1 from public.delivery_zones where active) then
      if coalesce(payload ->> 'delivery_zone_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        if p_quote then v_zone_missing := true;
        else raise exception 'ZONE_REQUIRED' using errcode = 'P0001'; end if;
      else
        select z.id, z.name, z.fee into v_zone_id, v_zone_name, v_fee
          from public.delivery_zones z
          where z.id = (payload ->> 'delivery_zone_id')::uuid and z.active;
        if not found then raise exception 'ZONE_INVALID' using errcode = 'P0001'; end if;
      end if;
    else
      v_fee := s.default_delivery_fee;
    end if;
  end if;
  v_fee := coalesce(v_fee, 0);

  return jsonb_build_object(
    'order_type', v_type, 'lines', v_lines, 'subtotal', v_subtotal,
    'discount', v_discount, 'promotion_id', v_promo_id, 'promotion_name', v_promo_name,
    'delivery_fee', v_fee, 'delivery_zone_id', v_zone_id, 'delivery_zone_name', v_zone_name,
    'zone_missing', v_zone_missing, 'min_order', s.min_order_amount,
    'below_min_order', v_subtotal < s.min_order_amount,
    'total', v_subtotal - v_discount + v_fee);
end $$;
revoke all on function public.price_order(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.price_order(jsonb, boolean) to service_role;

-- ---------- Order creation: the ONLY way an order enters the database ----------
-- payload = price_order payload + { customer_name, customer_phone, address, commune, wilaya, notes }
create or replace function public.create_order(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  s          public.restaurant_settings%rowtype;
  q          jsonb;
  v_name     text := btrim(coalesce(payload ->> 'customer_name', ''));
  v_phone    text := regexp_replace(coalesce(payload ->> 'customer_phone', ''), '[^0-9+]', '', 'g');
  v_address  text := nullif(btrim(coalesce(payload ->> 'address', '')), '');
  v_commune  text := nullif(btrim(coalesce(payload ->> 'commune', '')), '');
  v_wilaya   text := nullif(btrim(coalesce(payload ->> 'wilaya', '')), '');
  v_notes    text := nullif(btrim(coalesce(payload ->> 'notes', '')), '');
  v_type     public.order_type;
  v_order_id uuid;
  v_item_id  uuid;
  v_number   text;
  v_line     jsonb;
  v_x        jsonb;
begin
  select * into s from public.restaurant_settings where id = 1;
  if not found then raise exception 'SETTINGS_MISSING' using errcode = 'P0001'; end if;
  if not s.orders_open then raise exception 'ORDERS_CLOSED' using errcode = 'P0001'; end if;

  if v_phone like '+213%' then v_phone := '0' || substr(v_phone, 5);
  elsif v_phone like '00213%' then v_phone := '0' || substr(v_phone, 6);
  elsif v_phone like '213%' and length(v_phone) = 12 then v_phone := '0' || substr(v_phone, 4);
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'INVALID_NAME' using errcode = 'P0001'; end if;
  if v_phone !~ '^0[2-7][0-9]{8}$' then raise exception 'INVALID_PHONE' using errcode = 'P0001'; end if;
  if v_notes is not null and char_length(v_notes) > 500 then raise exception 'INVALID_NOTES' using errcode = 'P0001'; end if;
  if (v_address is not null and char_length(v_address) > 300) or (v_commune is not null and char_length(v_commune) > 80)
     or (v_wilaya is not null and char_length(v_wilaya) > 80) then
    raise exception 'INVALID_ADDRESS' using errcode = 'P0001';
  end if;

  q := public.price_order(payload, false);
  v_type := (q ->> 'order_type')::public.order_type;

  if v_type = 'DELIVERY' and (v_address is null or v_commune is null or v_wilaya is null) then
    raise exception 'ADDRESS_REQUIRED' using errcode = 'P0001';
  end if;
  if v_type = 'PICKUP' then v_address := null; v_commune := null; v_wilaya := null; end if;
  if (q ->> 'below_min_order')::boolean then
    raise exception 'MIN_ORDER:%', s.min_order_amount using errcode = 'P0001';
  end if;

  v_number := public.next_order_number(s.order_prefix);
  insert into public.orders (order_number, customer_name, customer_phone, order_type,
      address, commune, wilaya, delivery_zone_id, delivery_zone_name, notes,
      subtotal, discount, promotion_id, promotion_name, delivery_fee, total)
  values (v_number, v_name, v_phone, v_type,
      v_address, v_commune, v_wilaya, (q ->> 'delivery_zone_id')::uuid, q ->> 'delivery_zone_name', v_notes,
      (q ->> 'subtotal')::integer, (q ->> 'discount')::integer, (q ->> 'promotion_id')::uuid,
      q ->> 'promotion_name', (q ->> 'delivery_fee')::integer, (q ->> 'total')::integer)
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(q -> 'lines') loop
    insert into public.order_items (order_id, product_id, product_name, unit_price, extras_total, quantity, line_total, notes)
    values (v_order_id, (v_line ->> 'product_id')::uuid, v_line ->> 'name',
            (v_line ->> 'unit_price')::integer, (v_line ->> 'extras_total')::integer,
            (v_line ->> 'quantity')::integer, (v_line ->> 'line_total')::integer, v_line ->> 'notes')
    returning id into v_item_id;
    for v_x in select value from jsonb_array_elements(v_line -> 'extras') loop
      insert into public.order_item_extras (order_item_id, extra_id, extra_name, price)
      values (v_item_id, (v_x ->> 'id')::uuid, v_x ->> 'name', (v_x ->> 'price')::integer);
    end loop;
  end loop;

  return jsonb_build_object('id', v_order_id, 'order_number', v_number, 'total', (q ->> 'total')::integer);
end $$;
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;

-- ---------- Public order view (by unguessable UUID, called server-side) ----------
create or replace function public.get_public_order(p_order_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status,
    'customer_name', o.customer_name, 'customer_phone', o.customer_phone,
    'order_type', o.order_type, 'address', o.address, 'commune', o.commune, 'wilaya', o.wilaya,
    'delivery_zone_name', o.delivery_zone_name, 'notes', o.notes,
    'subtotal', o.subtotal, 'discount', o.discount, 'promotion_name', o.promotion_name,
    'delivery_fee', o.delivery_fee, 'total', o.total, 'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'product_name', i.product_name, 'unit_price', i.unit_price,
        'extras_total', i.extras_total, 'quantity', i.quantity, 'line_total', i.line_total,
        'notes', i.notes,
        'extras', coalesce((select jsonb_agg(jsonb_build_object('name', x.extra_name, 'price', x.price) order by x.extra_name)
                            from public.order_item_extras x where x.order_item_id = i.id), '[]'::jsonb)
      ) order by i.created_at, i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('status', e.status, 'created_at', e.created_at) order by e.created_at)
      from public.order_status_events e where e.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o where o.id = p_order_id;
$$;
revoke all on function public.get_public_order(uuid) from public, anon, authenticated;
grant execute on function public.get_public_order(uuid) to service_role;

-- ---------- Admin: customers aggregated from orders ----------
create or replace view public.admin_customers with (security_invoker = true) as
select
  o.customer_phone                                             as phone,
  (array_agg(o.customer_name order by o.created_at desc))[1]   as name,
  (array_agg(o.commune order by o.created_at desc) filter (where o.commune is not null))[1] as commune,
  count(*)::integer                                            as orders_count,
  coalesce(sum(o.total) filter (where o.status <> 'CANCELLED'), 0)::integer as total_spent,
  min(o.created_at)                                            as first_order_at,
  max(o.created_at)                                            as last_order_at
from public.orders o
group by o.customer_phone;
revoke all on public.admin_customers from anon;
grant select on public.admin_customers to authenticated;

-- ---------- Admin: dashboard / analytics ----------
create or replace function public.admin_stats(p_days integer default 14)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  tz       text := 'Africa/Algiers';
  v_now    timestamp := now() at time zone tz;
  d_today  timestamptz := (date_trunc('day',   v_now)) at time zone tz;
  d_week   timestamptz := (date_trunc('week',  v_now)) at time zone tz;
  d_month  timestamptz := (date_trunc('month', v_now)) at time zone tz;
  result   jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  p_days := greatest(1, least(coalesce(p_days, 14), 90));

  select jsonb_build_object(
    'today', (select jsonb_build_object(
        'orders',    count(*) filter (where status <> 'CANCELLED'),
        'revenue',   coalesce(sum(total) filter (where status <> 'CANCELLED'), 0),
        'delivered', count(*) filter (where status = 'DELIVERED'),
        'cancelled', count(*) filter (where status = 'CANCELLED'))
      from public.orders where created_at >= d_today),
    'week', (select jsonb_build_object(
        'orders',  count(*) filter (where status <> 'CANCELLED'),
        'revenue', coalesce(sum(total) filter (where status <> 'CANCELLED'), 0))
      from public.orders where created_at >= d_week),
    'month', (select jsonb_build_object(
        'orders',  count(*) filter (where status <> 'CANCELLED'),
        'revenue', coalesce(sum(total) filter (where status <> 'CANCELLED'), 0),
        'average', coalesce(round(avg(total) filter (where status <> 'CANCELLED')), 0))
      from public.orders where created_at >= d_month),
    'pending', (select count(*) from public.orders
                where status in ('NEW','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY')),
    'status_distribution', coalesce((
      select jsonb_object_agg(status, n) from (
        select status, count(*) as n from public.orders where created_at >= d_month group by status) t), '{}'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(t order by t.quantity desc) from (
        select i.product_name as name, sum(i.quantity)::integer as quantity, sum(i.line_total)::integer as revenue
        from public.order_items i join public.orders o on o.id = i.order_id
        where o.created_at >= d_month and o.status <> 'CANCELLED'
        group by i.product_name order by 2 desc limit 5) t), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', to_char(d.day, 'YYYY-MM-DD'),
                                          'orders', coalesce(x.orders, 0),
                                          'revenue', coalesce(x.revenue, 0)) order by d.day)
      from generate_series((v_now::date - (p_days - 1)), v_now::date, interval '1 day') as d(day)
      left join (
        select (created_at at time zone tz)::date as day, count(*) as orders, sum(total) as revenue
        from public.orders
        where status <> 'CANCELLED' and created_at >= ((v_now::date - (p_days - 1))::timestamp at time zone tz)
        group by 1) x on x.day = d.day::date), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.admin_stats(integer) from public, anon;
grant execute on function public.admin_stats(integer) to authenticated;
