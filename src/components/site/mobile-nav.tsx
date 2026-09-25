"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp/message";
import { WhatsAppIcon } from "./brand-icons";

export function MobileNav({ links, whatsapp }: { links: { href: string; label: string }[]; whatsapp: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-11 place-items-center rounded-full hover:bg-leaf"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {open ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-50 bg-paper px-4 pb-8 pt-4">
          <nav className="flex flex-col" aria-label="Navigation mobile">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-4 font-display text-2xl font-bold">
                {l.label}
              </Link>
            ))}
          </nav>
          {whatsapp && (
            <a href={buildWhatsAppLink(whatsapp)} target="_blank" rel="noopener noreferrer"
              className="mt-8 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-semibold text-white">
              <WhatsAppIcon /> Nous écrire sur WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
