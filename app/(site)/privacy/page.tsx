import type { Metadata } from "next";
import { getSettings } from "@/lib/data/catalog";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Politique de confidentialité", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <article className="mx-auto max-w-2xl space-y-5 px-4 py-12 leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold">
      <h1 className="text-4xl font-extrabold">Politique de confidentialité</h1>
      <p>Cette page explique quelles informations vous saisissez lors d&apos;une commande sur le site {s.name}, où elles vont et comment elles sont utilisées.</p>

      <h2>Informations saisies</h2>
      <p>Pour préparer une commande, le site vous demande votre nom, votre numéro de téléphone, votre adresse de livraison (adresse, commune, wilaya) si vous choisissez la livraison, le contenu de votre commande et une note facultative. Aucun compte client n&apos;est nécessaire et aucun paiement en ligne n&apos;est traité sur ce site.</p>

      <h2>Transmission de votre commande</h2>
      <p>Le site n&apos;enregistre pas vos commandes sur un serveur ni dans une base de données. Lorsque vous cliquez sur « Confirmer la commande », vos informations servent uniquement à préparer un message WhatsApp adressé au restaurant.</p>
      <p>Le restaurant ne reçoit votre commande et vos coordonnées que si vous envoyez ce message depuis WhatsApp. Le message est alors transmis par WhatsApp, un service de Meta, soumis à ses propres conditions et à sa propre politique de confidentialité.</p>
      <p>Les informations que vous envoyez au restaurant sont utilisées pour préparer votre commande, la livrer ou la remettre au retrait, et vous contacter à son sujet.</p>

      <h2>Stockage sur votre appareil</h2>
      <p>Votre panier et vos dernières commandes préparées (10 au maximum) sont conservés uniquement dans le stockage local de votre navigateur, sur votre appareil. Cela permet de garder votre panier entre deux visites et de réafficher la page de confirmation pour renvoyer le message WhatsApp. Ces données ne sont pas envoyées au restaurant par le site. Vous pouvez les supprimer à tout moment en effaçant les données de ce site dans votre navigateur.</p>

      <h2>Hébergement</h2>
      <p>Comme pour tout site web, l&apos;hébergeur du site peut enregistrer des journaux techniques de connexion (par exemple l&apos;adresse IP et les pages consultées) nécessaires au fonctionnement et à la sécurité du service.</p>

      <h2>Vos droits</h2>
      <p>Conformément à la loi n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, vous pouvez demander l&apos;accès, la rectification ou la suppression des informations que vous avez transmises au restaurant{s.phone ? ` en le contactant au ${s.phone}` : s.whatsapp ? " en le contactant sur WhatsApp" : " en le contactant"}.</p>
    </article>
  );
}
