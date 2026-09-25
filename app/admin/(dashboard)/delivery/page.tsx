import { getAdminSession } from "@/lib/admin/auth";
import { deleteZone, saveDeliverySettings, saveZone } from "@/lib/admin/actions";
import { formatDA } from "@/lib/format";
import type { DeliveryZone } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { AdminForm, AField, DeleteAction } from "@/components/admin/admin-form";
import { Input, Toggle } from "@/components/ui/field";
import { Badge } from "@/components/ui/misc";

export const metadata = { title: "Livraison" };

function ZoneFields({ z }: { z?: DeliveryZone }) {
  const k = z?.id ?? "new";
  return (
    <>
      {z && <input type="hidden" name="id" value={z.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_130px_100px]">
        <AField name="name" id={`zname-${k}`} label="Zone"><Input id={`zname-${k}`} name="name" defaultValue={z?.name} required maxLength={80} placeholder="Centre-ville" /></AField>
        <AField name="fee" id={`zfee-${k}`} label="Frais (DA)"><Input id={`zfee-${k}`} name="fee" type="number" min={0} defaultValue={z?.fee ?? ""} required /></AField>
        <AField name="sort_order" id={`zsort-${k}`} label="Ordre"><Input id={`zsort-${k}`} name="sort_order" type="number" defaultValue={z?.sort_order ?? 0} /></AField>
      </div>
      <Toggle name="active" label="Active" defaultChecked={z?.active ?? true} />
    </>
  );
}

export default async function DeliveryPage() {
  const { supabase } = await getAdminSession();
  const [settingsRes, zonesRes] = await Promise.all([
    supabase.from("restaurant_settings").select("delivery_enabled, pickup_enabled, default_delivery_fee, min_order_amount, address, city").eq("id", 1).single(),
    supabase.from("delivery_zones").select("*").order("sort_order").order("name"),
  ]);
  if (settingsRes.error || zonesRes.error) throw new Error("Chargement impossible");
  const s = settingsRes.data;
  const zones = (zonesRes.data ?? []) as DeliveryZone[];
  const activeZones = zones.filter((z) => z.active).length;

  return (
    <>
      <PageHeader title="Livraison" subtitle="Modes de commande, frais et zones de livraison." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Réglages">
          <AdminForm action={saveDeliverySettings}>
            <div className="divide-y divide-line">
              <Toggle name="delivery_enabled" label="Livraison" description="Les clients peuvent se faire livrer." defaultChecked={s.delivery_enabled} />
              <Toggle name="pickup_enabled" label="Retrait au restaurant" description="Les clients peuvent venir chercher leur commande." defaultChecked={s.pickup_enabled} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AField name="default_delivery_fee" label="Frais de livraison par défaut (DA)" hint={activeZones ? "Ignoré : des zones sont actives." : "Appliqué à toute livraison."}>
                <Input id="default_delivery_fee" name="default_delivery_fee" type="number" min={0} defaultValue={s.default_delivery_fee} />
              </AField>
              <AField name="min_order_amount" label="Commande minimum (DA)" hint="0 = sans minimum.">
                <Input id="min_order_amount" name="min_order_amount" type="number" min={0} defaultValue={s.min_order_amount} />
              </AField>
            </div>
            <AField name="address" label="Adresse du restaurant"><Input id="address" name="address" defaultValue={s.address ?? ""} maxLength={200} /></AField>
            <AField name="city" label="Ville"><Input id="city" name="city" defaultValue={s.city ?? ""} maxLength={80} /></AField>
          </AdminForm>
        </Panel>

        <div className="space-y-6">
          <Panel title="Zones de livraison">
            <p className="mb-4 text-sm text-ink-soft">
              {activeZones ? "Le client doit choisir sa zone ; ses frais remplacent les frais par défaut." : "Aucune zone active : les frais par défaut s'appliquent partout."}
            </p>
            {zones.length > 0 && (
              <ul className="mb-2 space-y-2">
                {zones.map((z) => (
                  <li key={z.id} className="rounded-xl border border-line">
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <p className="flex-1 font-semibold">{z.name} <span className="font-normal text-ink-soft">{formatDA(z.fee)}</span> {!z.active && <Badge>Inactive</Badge>}</p>
                      <DeleteAction id={z.id} action={deleteZone} label={`Supprimer ${z.name}`} title={`Supprimer la zone « ${z.name} » ?`} />
                    </div>
                    <details className="border-t border-line">
                      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-leaf/60">Modifier</summary>
                      <div className="px-3 pb-3"><AdminForm action={saveZone}><ZoneFields z={z} /></AdminForm></div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Nouvelle zone"><AdminForm action={saveZone} submitLabel="Ajouter la zone" resetOnSuccess><ZoneFields /></AdminForm></Panel>
        </div>
      </div>
    </>
  );
}
