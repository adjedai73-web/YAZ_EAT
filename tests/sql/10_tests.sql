\set ON_ERROR_STOP 0
\pset tuples_only on
-- helpers
create or replace function pg_temp.ok(label text, cond boolean) returns void language plpgsql as $$
begin raise notice '% %', case when cond then 'PASS' else 'FAIL' end, label; end $$;

-- ids
select id as burger from products where slug='burger-yaz' \gset
select id as soda from products where slug='soda-33cl' \gset
select id as cheese from extras where name='Cheese' \gset
select id as fries from extras where name='Frites' \gset

-- 1. anon cannot create orders / read orders / write products
set role anon;
select public.create_order('{}'::jsonb);
select pg_temp.ok('anon sees 0 orders', (select count(*) from orders) = 0);
update products set price = 1 where slug='burger-yaz';
insert into orders(order_number,customer_name,customer_phone,order_type,subtotal,total) values('X','Hack','0550000000','PICKUP',0,0);
select pg_temp.ok('anon reads settings', (select count(*) from restaurant_settings) = 1);
select pg_temp.ok('anon reads products', (select count(*) from products) = 11);
reset role;
select pg_temp.ok('price unchanged after anon update', (select price from products where slug='burger-yaz') = 650);

-- 2. service_role creates an order; client prices ignored (none are sent anyway)
set role service_role;
select public.create_order(jsonb_build_object(
  'customer_name','Ahmed','customer_phone','+213 550 00 00 00','order_type','DELIVERY',
  'address','Rue 1','commune','Biskra','wilaya','Biskra','notes','Sans oignon',
  'price', 1, 'total', 1,
  'items', jsonb_build_array(
    jsonb_build_object('product_id', :'burger', 'quantity', 2, 'extra_ids', jsonb_build_array(:'cheese'), 'price', 1),
    jsonb_build_object('product_id', :'soda', 'quantity', 1, 'extra_ids', '[]'::jsonb)))) as r \gset
reset role;
\echo :r
select pg_temp.ok('subtotal = 2*(650+100)+120 = 1620', (select subtotal from orders limit 1) = 1620);
select pg_temp.ok('delivery fee default 200, total 1820', (select delivery_fee = 200 and total = 1820 from orders limit 1));
select pg_temp.ok('order number format', (select order_number ~ '^YAZ-[0-9]{8}-0001$' from orders limit 1));
select pg_temp.ok('phone normalized', (select customer_phone = '0550000000' from orders limit 1));
select pg_temp.ok('status NEW event logged', (select count(*) = 1 from order_status_events));

-- 3. price snapshot survives catalogue change
update products set price = 999 where slug='burger-yaz';
select pg_temp.ok('snapshot unit_price kept 650', (select unit_price from order_items where product_name='Burger YAZ') = 650);
update products set price = 650 where slug='burger-yaz';

-- 4. validation errors
set role service_role;
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','PICKUP',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'soda', 'quantity', 1, 'extra_ids', jsonb_build_array(:'cheese')))));  -- extra not allowed on drinks
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','12345','order_type','PICKUP',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'soda', 'quantity', 1))));
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','PICKUP','items','[]'::jsonb));
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','PICKUP',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'soda', 'quantity', 0))));
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','DELIVERY',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'soda', 'quantity', 1))));
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','PICKUP','promo_code','FAKE',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'soda', 'quantity', 1))));
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','PICKUP',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'burger', 'quantity', 1, 'extra_ids', jsonb_build_array(:'cheese', :'cheese')))));
reset role;
update products set available=false where slug='soda-33cl';
set role service_role;
select public.create_order(jsonb_build_object('customer_name','Ali','customer_phone','0550000000','order_type','PICKUP',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'soda', 'quantity', 1))));
reset role;
update products set available=true where slug='soda-33cl';

-- 5. promotions + zones
insert into promotions(name, discount_type, discount_value, min_order) values ('Auto 10%','PERCENTAGE',10,0);
insert into promotions(name, code, discount_type, discount_value) values ('Code 300','BIENVENUE','FIXED',300);
insert into delivery_zones(name, fee) values ('Zone A', 150);
select id as zone from delivery_zones limit 1 \gset
set role service_role;
select public.create_order(jsonb_build_object('customer_name','Sara','customer_phone','0660000000','order_type','DELIVERY',
  'address','X','commune','Y','wilaya','Z',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'burger', 'quantity', 1))));  -- ZONE_REQUIRED
select public.create_order(jsonb_build_object('customer_name','Sara','customer_phone','0660000000','order_type','DELIVERY',
  'address','X','commune','Y','wilaya','Z','delivery_zone_id', :'zone',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'burger', 'quantity', 2)))) ;
select public.create_order(jsonb_build_object('customer_name','Sara','customer_phone','0660000000','order_type','PICKUP','promo_code','bienvenue',
  'items', jsonb_build_array(jsonb_build_object('product_id', :'burger', 'quantity', 2)))) ;
reset role;
select pg_temp.ok('auto 10% on 1300 = 130, zone fee 150, total 1320',
  (select discount = 130 and delivery_fee = 150 and total = 1320 and order_number like '%-0002' from orders where customer_phone='0660000000' and order_type='DELIVERY'));
select pg_temp.ok('code 300 beats nothing: total 1000',
  (select discount = 300 and total = 1000 and promotion_name = 'Code 300' from orders where order_type='PICKUP'));
set role anon;
select pg_temp.ok('anon sees auto promo only', (select count(*) = 1 from promotions));
reset role;

-- 6. roles: customer vs admin
insert into auth.users(id,email) values ('00000000-0000-0000-0000-000000000001','client@x.dz'),('00000000-0000-0000-0000-000000000002','admin@yaz.dz');
update profiles set role='admin' where email='admin@yaz.dz';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select pg_temp.ok('customer sees 0 orders', (select count(*) from orders) = 0);
select pg_temp.ok('customer sees 0 customers', (select count(*) from admin_customers) = 0);
update profiles set role='admin' where id='00000000-0000-0000-0000-000000000001';
update products set price=1;
select public.admin_stats();
reset role;
select pg_temp.ok('customer could not self-promote', (select role='customer' from profiles where email='client@x.dz'));
select pg_temp.ok('customer could not change price', (select price from products where slug='burger-yaz') = 650);
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select pg_temp.ok('admin sees 3 orders', (select count(*) from orders) = 3);
update orders set status='CONFIRMED' where order_number like '%-0001';
update orders set total = 1 where order_number like '%-0001';   -- column not granted
select pg_temp.ok('admin stats today orders 3', (select (admin_stats()->'today'->>'orders')::int = 3));
select pg_temp.ok('admin customers 2', (select count(*) = 2 from admin_customers));
update products set price = 700 where slug='burger-yaz';
reset role;
select pg_temp.ok('status CONFIRMED + event logged with admin id',
  (select count(*) = 1 from order_status_events where status='CONFIRMED' and changed_by='00000000-0000-0000-0000-000000000002'));
select pg_temp.ok('admin could not alter total', (select total from orders where order_number like '%-0001') = 1820);
select pg_temp.ok('admin price update ok', (select price from products where slug='burger-yaz') = 700);
set role service_role;
select pg_temp.ok('public order json has 2 items + 2 events', (select jsonb_array_length(get_public_order(((:'r')::jsonb->>'id')::uuid)->'items') = 2));
reset role;
-- 7. quote
set role service_role;
select pg_temp.ok('quote without zone => zone_missing', (select (price_order(jsonb_build_object('order_type','DELIVERY','items', jsonb_build_array(jsonb_build_object('product_id', :'soda','quantity',2))), true)->>'zone_missing')::boolean));
select pg_temp.ok('quote pickup soda x2 = 240 - 10% = 216', (select (price_order(jsonb_build_object('order_type','PICKUP','items', jsonb_build_array(jsonb_build_object('product_id', :'soda','quantity',2))), true)->>'total')::int = 216));
reset role;
