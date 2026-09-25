-- =====================================================================
-- YAZ EAT — OPTIONAL demo menu. Run once to have a working menu to test with,
-- then edit/replace everything from /admin. Safe to skip in production.
-- =====================================================================
insert into public.categories (name, slug, sort_order) values
  ('Burgers',  'burgers',  1), ('Tacos', 'tacos', 2), ('Pizzas', 'pizzas', 3),
  ('Plats',    'plats',    4), ('Desserts', 'desserts', 5), ('Boissons', 'boissons', 6)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, price, featured, bestseller, sort_order)
select c.id, v.name, v.slug, v.description, v.price, v.featured, v.bestseller, v.sort_order
from (values
  ('burgers',  'Burger YAZ',        'burger-yaz',        'Steak haché maison, cheddar fondu, oignons caramélisés, sauce YAZ.', 650, true,  true,  1),
  ('burgers',  'Double Smash',      'double-smash',      'Deux steaks smashés, double cheddar, pickles, sauce burger.',        850, true,  false, 2),
  ('burgers',  'Chicken Crispy',    'chicken-crispy',    'Filet de poulet croustillant, salade, tomate, mayo épicée.',         600, false, true,  3),
  ('tacos',    'Tacos Poulet',      'tacos-poulet',      'Poulet mariné, frites, sauce fromagère, galette grillée.',           550, false, true,  1),
  ('tacos',    'Tacos Mixte',       'tacos-mixte',       'Poulet et viande hachée, frites, sauce fromagère.',                  700, false, false, 2),
  ('pizzas',   'Pizza Margherita',  'pizza-margherita',  'Sauce tomate, mozzarella, basilic.',                                 700, false, false, 1),
  ('pizzas',   'Pizza YAZ',         'pizza-yaz',         'Sauce tomate, mozzarella, viande hachée, poivrons, olives.',         950, true,  false, 2),
  ('plats',    'Assiette Poulet',   'assiette-poulet',   'Poulet grillé, riz, frites et salade.',                              900, false, false, 1),
  ('desserts', 'Tiramisu',          'tiramisu',          'Tiramisu maison au café.',                                           350, false, false, 1),
  ('boissons', 'Soda 33cl',         'soda-33cl',         'Canette au choix.',                                                  120, false, false, 1),
  ('boissons', 'Jus frais',         'jus-frais',         'Orange ou citron, pressé minute.',                                   250, false, false, 2)
) as v(cat, name, slug, description, price, featured, bestseller, sort_order)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

insert into public.extras (name, price, sort_order) values
  ('Cheese', 100, 1), ('Viande supplémentaire', 250, 2), ('Frites', 150, 3), ('Sauce', 50, 4);

-- Cheese / viande / frites / sauce on all burgers and tacos
insert into public.category_extras (category_id, extra_id)
select c.id, e.id from public.categories c cross join public.extras e
where c.slug in ('burgers', 'tacos')
on conflict do nothing;

update public.restaurant_settings set
  opening_hours = 'Tous les jours : 11h00 – 23h30',
  tagline       = 'Meilleur poulet, saveur garantie.',
  about_text    = 'Yaz Eat est un fast food spécialisé dans le poulet rôti : le meilleur blanc de poulet et des frites parfaitement cuites.'
where id = 1;
