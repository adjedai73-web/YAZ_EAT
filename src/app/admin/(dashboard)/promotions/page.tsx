import { getAdminSession } from "@/lib/admin/auth";
import { deletePromotion, savePromotion } from "@/lib/admin/actions";
import { toAlgiersLocalInput } from "@/lib/admin/queries";
import { formatDA, formatDateTime } from "@/lib/format";
import type { Promotion } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { AdminForm, AField, DeleteAction } from "@/components/admin/admin-form";
import { Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { Badge, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Promotions" };

function PromoFields({ p }: { p?: Promotion }) {
  const k = p?.id ?? "new";
  return (
    <>
      {p && <input type="hidden" name="id" value={p.id} />}
      <AField name="name" id={`name-${k}`} label="Nom"><Input id={`name-${k}`} name="name" defaultValue={p?.name} required maxLength={80} placeholder="-10 % le week-end" /></AField>
      <AField name="description" id={`desc-${k}`} label="Description (affichée aux clients)"><Textarea id={`desc-${k}`} name="description" defaultValue={p?.description ?? ""} maxLength={300} className="min-h-16" /></AField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AField name="discount_type" id={`type-${k}`} label="Type">
          <Select id={`type-${k}`} name="discount_type" defaultValue={p?.discount_type ?? "PERCENTAGE"}>
            <option value="PERCENTAGE">Pourcentage (%)</option><option value="FIXED">Montant fixe (DA)</option>
          </Select>
        </AField>
        <AField name="discount_value" id={`val-${k}`} label="Valeur"><Input id={`val-${k}`} name="discount_value" type="number" inputMode="numeric" min={1} defaultValue={p?.discount_value ?? ""} required /></AField>
        <AField name="min_order" id={`min-${k}`} label="Commande minimum (DA)" hint="0 = sans minimum."><Input id={`min-${k}`} name="min_order" type="number" min={0} defaultValue={p?.min_order ?? 0} /></AField>
        <AField name="code" id={`code-${k}`} label="Code promo" hint="Vide = appliquée automatiquement.">
          <Input id={`code-${k}`} name="code" defaultValue={p?.code ?? ""} maxLength={30} className="uppercase" placeholder="BIENVENUE" />
        </AField>
        <AField name="start_date" id={`start-${k}`} label="Début"><Input id={`start-${k}`} name="start_date" type="datetime-local" defaultValue={toAlgiersLocalInput(p?.start_date ?? null)} /></AField>
        <AField name="end_date" id={`end-${k}`} label="Fin" hint="Vide = sans date de fin."><Input id={`end-${k}`} name="end_date" type="datetime-local" defaultValue={toAlgiersLocalInput(p?.end_date ?? null)} /></AField>
      </div>
      <Toggle name="active" label="Active" defaultChecked={p?.active ?? true} />
    </>
  );
}

function state(p: Promotion): { label: string; tone: "brand" | "neutral" | "danger" | "accent" } {
  const now = Date.now();
  if (!p.active) return { label: "Désactivée", tone: "neutral" };
  if (new Date(p.start_date).getTime() > now) return { label: "Programmée", tone: "accent" };
  if (p.end_date && new Date(p.end_date).getTime() <= now) return { label: "Expirée", tone: "danger" };
  return { label: "En cours", tone: "brand" };
}

export default async function PromotionsPage() {
  const { supabase } = await getAdminSession();
  const { data, error } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const promos = (data ?? []) as Promotion[];

  return (
    <>
      <PageHeader title="Promotions" subtitle="Sans code : la meilleure promotion en cours s'applique automatiquement. Avec code : le client le saisit au paiement." />
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <div>
          {promos.length === 0 ? (
            <Panel><EmptyState title="Aucune promotion" text="Créez une réduction en pourcentage ou en montant fixe." /></Panel>
          ) : (
            <ul className="space-y-3">
              {promos.map((p) => {
                const st = state(p);
                return (
                  <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-paper">
                    <div className="flex items-start gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{p.name} <Badge tone={st.tone}>{st.label}</Badge></p>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {p.discount_type === "PERCENTAGE" ? `-${p.discount_value} %` : `-${formatDA(p.discount_value)}`}
                          {p.min_order > 0 && ` dès ${formatDA(p.min_order)}`}
                          {p.code ? ` · Code ${p.code}` : " · Automatique"}
                        </p>
                        <p className="text-sm text-ink-soft">Du {formatDateTime(p.start_date)}{p.end_date ? ` au ${formatDateTime(p.end_date)}` : ", sans fin"}</p>
                      </div>
                      <DeleteAction id={p.id} action={deletePromotion} label={`Supprimer ${p.name}`} title={`Supprimer « ${p.name} » ?`} description="Les commandes passées gardent leur réduction." />
                    </div>
                    <details className="border-t border-line">
                      <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-leaf/60">Modifier</summary>
                      <div className="px-4 pb-4"><AdminForm action={savePromotion}><PromoFields p={p} /></AdminForm></div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Panel title="Nouvelle promotion" className="xl:sticky xl:top-6 xl:self-start">
          <AdminForm action={savePromotion} submitLabel="Créer la promotion" resetOnSuccess><PromoFields /></AdminForm>
        </Panel>
      </div>
    </>
  );
}
