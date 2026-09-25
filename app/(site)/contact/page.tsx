import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/data/catalog";
import { buildWhatsAppLink } from "@/lib/whatsapp/message";
import { SocialLinks } from "@/components/site/social-links";
import { WhatsAppIcon } from "@/components/site/brand-icons";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const s = await getSettings();
  const rows = [
    s.address && { Icon: MapPin, label: "Adresse", value: `${s.address}${s.city ? `, ${s.city}` : ""}`, href: s.maps_url ?? undefined },
    s.phone && { Icon: Phone, label: "Téléphone", value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    s.email && { Icon: Mail, label: "E-mail", value: s.email, href: `mailto:${s.email}` },
    s.opening_hours && { Icon: Clock, label: "Horaires", value: s.opening_hours },
  ].filter(Boolean) as { Icon: typeof MapPin; label: string; value: string; href?: string }[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-5xl font-extrabold">Contact</h1>
      <dl className="mt-8 divide-y divide-line rounded-[var(--radius-card)] border border-line">
        {rows.map(({ Icon, label, value, href }) => (
          <div key={label} className="flex gap-4 p-5">
            <Icon className="mt-0.5 size-5 shrink-0 text-brand-800" />
            <div>
              <dt className="text-sm font-semibold text-ink-soft">{label}</dt>
              <dd className="mt-0.5 whitespace-pre-line text-lg">
                {href ? <a href={href} className="hover:underline" target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{value}</a> : value}
              </dd>
            </div>
          </div>
        ))}
        {!rows.length && <p className="p-5 text-ink-soft">Les coordonnées seront bientôt disponibles.</p>}
      </dl>
      {s.whatsapp && (
        <a href={buildWhatsAppLink(s.whatsapp)} target="_blank" rel="noopener noreferrer"
          className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-semibold text-white hover:brightness-95">
          <WhatsAppIcon /> Écrire sur WhatsApp
        </a>
      )}
      <SocialLinks settings={s} className="mt-6 text-brand-800" />
    </div>
  );
}
