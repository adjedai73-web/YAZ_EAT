import type { Metadata } from "next";
import { MenuPage } from "./menu-page";

export const metadata: Metadata = {
  title: "Menu",
  description: "Tout le menu YAZ EAT : burgers, tacos, pizzas, plats, desserts et boissons. Commandez en ligne.",
  alternates: { canonical: "/menu" },
};

export default function Page() {
  return <MenuPage />;
}
