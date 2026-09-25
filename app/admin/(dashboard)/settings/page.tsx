import { getAdminSession } from "@/lib/admin/auth";
import { saveSettings } from "@/lib/admin/actions";
import type { RestaurantSettings } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { AdminForm, AField } from "@/components/admin/admin-form";
import { ImageInput } from "@/components/admin/form-bits";
import { ReviewsEditor } from "@/components/admin/reviews-editor";
import { Input, Textarea, Toggle } from "@/components/ui/field";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { supabase } = await getAdminSession();
  const { data, error } = await supabase.from("restaurant_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  const s = data as RestaurantSettings;

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Informations affichées sur le site et utilisées pour les commandes WhatsApp." />
      <AdminForm action={saveSettings} submitLabel="Enregistrer les paramètres" className="grid gap-6 xl:grid-cols-2">
        <Panel title="Restaurant">
          <div className="space-y-4">
            <AField name="name" label="Nom"><Input id="name" name="name" defaultValue={s.name} required maxLength={80} /></AField>
            <AField name="tagline" label="Accroche" hint="Affichée sous le logo sur la page d'accueil."><Input id="tagline" name="tagline" defaultValue={s.tagline ?? ""} maxLength={140} /></AField>
            <AField name="about_text" label="À propos"><Textarea id="about_text" name="about_text" defaultValue={s.about_text ?? ""} maxLength={2000} rows={5} /></AField>
            <AField name="opening_hours" label="Horaires" hint="Une ligne par jour ou plage, ex. « Tous les jours : 11h – 23h »."><Textarea id="opening_hours" name="opening_hours" defaultValue={s.opening_hours ?? ""} maxLength={600} rows={4} /></AField>
            <ImageInput name="logo" removeName="remove_logo" current={s.logo_url} label="Logo" />
            <ImageInput name="hero_image" removeName="remove_hero_image" current={s.hero_image_url} label="Image d'accueil" />
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Commandes & WhatsApp">
            <div className="space-y-4">
              <AField name="whatsapp" label="Numéro WhatsApp de réception" hint="Les commandes sont envoyées à ce numéro. Ex. 0550 12 34 56 (converti en 213…).">
                <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={s.whatsapp ?? ""} placeholder="0550 12 34 56" />
              </AField>
              <AField name="order_prefix" label="Préfixe des numéros de commande" hint={`Ex. ${s.order_prefix}-20260922-0001`}>
                <Input id="order_prefix" name="order_prefix" defaultValue={s.order_prefix} maxLength={6} className="uppercase" />
              </AField>
              <Toggle name="orders_open" label="Commandes en ligne ouvertes" description="Désactivez pour fermer temporairement les commandes." defaultChecked={s.orders_open} />
            </div>
          </Panel>

          <Panel title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <AField name="phone" label="Téléphone"><Input id="phone" name="phone" type="tel" defaultValue={s.phone ?? ""} maxLength={30} /></AField>
              <AField name="email" label="E-mail"><Input id="email" name="email" type="email" defaultValue={s.email ?? ""} maxLength={120} /></AField>
              <AField name="address" label="Adresse"><Input id="address" name="address" defaultValue={s.address ?? ""} maxLength={200} /></AField>
              <AField name="city" label="Ville"><Input id="city" name="city" defaultValue={s.city ?? ""} maxLength={80} /></AField>
              <AField name="maps_url" label="Lien Google Maps" className="sm:col-span-2"><Input id="maps_url" name="maps_url" type="url" defaultValue={s.maps_url ?? ""} placeholder="https://maps.app.goo.gl/…" /></AField>
            </div>
          </Panel>

          <Panel title="Réseaux sociaux">
            <div className="space-y-4">
              <AField name="instagram_url" label="Instagram"><Input id="instagram_url" name="instagram_url" type="url" defaultValue={s.instagram_url ?? ""} placeholder="https://instagram.com/…" /></AField>
              <AField name="facebook_url" label="Facebook"><Input id="facebook_url" name="facebook_url" type="url" defaultValue={s.facebook_url ?? ""} placeholder="https://facebook.com/…" /></AField>
              <AField name="tiktok_url" label="TikTok"><Input id="tiktok_url" name="tiktok_url" type="url" defaultValue={s.tiktok_url ?? ""} placeholder="https://tiktok.com/@…" /></AField>
            </div>
          </Panel>
        </div>

        <Panel title="Avis clients" className="xl:col-span-2">
          <AField name="reviews" label="Avis affichés sur la page d'accueil"><ReviewsEditor initial={s.reviews ?? []} /></AField>
        </Panel>
      </AdminForm>
    </>
  );
}
