import { getSettings } from "@/lib/data/catalog";
import { MENU_IS_PLACEHOLDER } from "@/lib/menu";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MobileCartBar } from "@/components/site/mobile-cart-bar";
import { Toaster } from "@/components/ui/toast";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-sun-500 focus:px-4 focus:py-2 focus:font-semibold">
        Aller au contenu
      </a>
      <Header settings={settings} />
      {!settings.orders_open && (
        <div className="bg-sun-100 px-4 py-2 text-center text-sm font-medium text-brand-950" role="status">
          Les commandes en ligne sont momentanément fermées. Vous pouvez consulter le menu.
        </div>
      )}
      {MENU_IS_PLACEHOLDER && (
        <div className="bg-leaf px-4 py-2 text-center text-sm font-medium text-ink-soft" role="note">
          Menu provisoire : articles et prix donnés à titre d&apos;exemple, en attente du menu officiel.
        </div>
      )}
      <main id="main" className="min-h-[60dvh]">{children}</main>
      <Footer settings={settings} />
      <MobileCartBar />
      <Toaster />
    </>
  );
}
