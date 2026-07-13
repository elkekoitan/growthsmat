import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Yol Haritası",
  description:
    "SmartGrowth OS'nin yapım durumunu gösteren canlı takip panosu — 13 epik, ağırlıklı ilerleme, kritik yol ve risk görünümü. 04 Görev Matrisi'nin canlı hâli.",
};

export default function PanelPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Dashboard />
      </main>
      <Footer />
    </RevealProvider>
  );
}
