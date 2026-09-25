import type { Metadata, Viewport } from "next";
import "./globals.css";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "YAZ EAT — Commandez vos plats en ligne", template: "%s | YAZ EAT" },
  description: "Burgers, tacos, pizzas et plats préparés à la commande. Commandez en ligne en livraison ou à emporter.",
  applicationName: "YAZ EAT",
  openGraph: { type: "website", locale: "fr_DZ", siteName: "YAZ EAT" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800;900&family=Montserrat:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
