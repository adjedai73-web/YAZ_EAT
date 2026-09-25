import { z } from "zod";
import { normalizeDzPhone } from "@/lib/format";

/** Local menu ids are slugs (e.g. "poulet-roti-entier"). */
const uuid = z.string().trim().min(1).max(100);

export const cartLineSchema = z.object({
  product_id: uuid,
  quantity: z.number().int().min(1).max(50),
  extra_ids: z.array(uuid).max(20).default([]),
  notes: z.string().trim().max(200).optional().default(""),
});

export const quoteSchema = z.object({
  order_type: z.enum(["DELIVERY", "PICKUP"]),
  delivery_zone_id: uuid.nullable().optional(),
  promo_code: z.string().trim().max(30).optional().default(""),
  items: z.array(cartLineSchema).min(1, "Votre panier est vide.").max(40),
});

export const checkoutSchema = quoteSchema
  .extend({
    customer_name: z.string().trim().min(2, "Indiquez votre nom complet.").max(80, "Nom trop long."),
    customer_phone: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const p = normalizeDzPhone(v);
        if (!p) {
          ctx.addIssue({ code: "custom", message: "Numéro invalide. Exemple : 0550 12 34 56." });
          return z.NEVER;
        }
        return p;
      }),
    address: z.string().trim().max(300, "Adresse trop longue.").optional().default(""),
    commune: z.string().trim().max(80).optional().default(""),
    wilaya: z.string().trim().max(80).optional().default(""),
    notes: z.string().trim().max(500, "500 caractères maximum.").optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.order_type === "DELIVERY") {
      if (!v.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Adresse obligatoire pour la livraison." });
      if (!v.commune) ctx.addIssue({ code: "custom", path: ["commune"], message: "Commune obligatoire." });
      if (!v.wilaya) ctx.addIssue({ code: "custom", path: ["wilaya"], message: "Wilaya obligatoire." });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type QuoteInput = z.input<typeof quoteSchema>;
