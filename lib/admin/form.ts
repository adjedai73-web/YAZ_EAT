export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> } | null;

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optStr = (fd: FormData, k: string) => str(fd, k) || null;
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
export const int = (fd: FormData, k: string, fallback = 0) => {
  const v = Number(String(fd.get(k) ?? "").replace(/\s/g, ""));
  return Number.isFinite(v) ? Math.round(v) : fallback;
};

export function dbError(message: string): string {
  if (/duplicate key.*slug/i.test(message)) return "Ce slug est déjà utilisé. Choisissez-en un autre.";
  if (/duplicate key.*code/i.test(message)) return "Ce code promo existe déjà.";
  if (/violates foreign key.*products_category_id/i.test(message)) return "Cette catégorie contient encore des produits. Déplacez ou supprimez-les d'abord.";
  if (/row-level security|permission denied/i.test(message)) return "Action non autorisée.";
  if (/check constraint/i.test(message)) return "Une valeur saisie n'est pas valide.";
  return "L'enregistrement a échoué. Réessayez.";
}

export function authError(e: unknown): FormState {
  const m = e instanceof Error ? e.message : "";
  if (m === "UNAUTHENTICATED") return { error: "Session expirée. Reconnectez-vous." };
  if (m === "FORBIDDEN") return { error: "Accès réservé aux administrateurs." };
  return { error: "Une erreur est survenue. Réessayez." };
}
