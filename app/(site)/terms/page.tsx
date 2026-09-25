import type { Metadata } from "next";
import { getSettings } from "@/lib/data/catalog";
import { formatDA } from "@/lib/format";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Conditions de commande", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <article className="mx-auto max-w-2xl space-y-5 px-4 py-12 leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold">
      <h1 className="text-4xl font-extrabold">Conditions de commande</h1>

      <h2>Passer une commande</h2>
      <p>Vous choisissez vos articles, les ajoutez au panier puis remplissez le formulaire de commande. En cliquant sur « Confirmer la commande », le site prépare un message WhatsApp contenant votre commande, adressé à {s.name}.</p>
      <p>Votre commande n&apos;est transmise au restaurant qu&apos;au moment où vous envoyez ce message dans WhatsApp. Tant que le message n&apos;est pas envoyé, le restaurant n&apos;a pas connaissance de votre commande. Le restaurant peut vous contacter pour confirmer ou préciser votre commande.</p>

      <h2>Référence de commande</h2>
      <p>Chaque commande préparée reçoit une référence au format {s.order_prefix}-AAAAMMJJ-XXXX, générée sur votre appareil. Elle sert à identifier votre commande dans la conversation WhatsApp. Il ne s&apos;agit pas d&apos;un numéro attribué par le restaurant et son unicité n&apos;est pas garantie.</p>

      <h2>Prix</h2>
      <p>Les prix sont affichés en dinars algériens (DA). Le total est calculé à partir des prix du menu en vigueur et figure, frais de livraison inclus, dans le récapitulatif et dans le message WhatsApp.</p>

      <h2>Paiement</h2>
      <p>Aucun paiement n&apos;est effectué sur le site. Le paiement s&apos;effectue à la livraison ou au retrait au restaurant.</p>

      <h2>Livraison et retrait</h2>
      {s.delivery_enabled && (
        <p>La livraison est facturée {formatDA(s.default_delivery_fee)} par commande. Ce montant est affiché avant la confirmation et inclus dans le total.</p>
      )}
      {s.pickup_enabled && <p>Le retrait au restaurant n&apos;entraîne pas de frais de livraison.</p>}

      <h2>Contact</h2>
      <p>Pour toute question sur une commande, contactez le restaurant{s.phone ? ` au ${s.phone}` : s.whatsapp ? " sur WhatsApp" : ""} en indiquant votre référence de commande.</p>
    </article>
  );
}
