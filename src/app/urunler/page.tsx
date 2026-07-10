import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Explorer } from "./Explorer";

export const metadata: Metadata = {
  title: "Ürün Kâşifi",
  description:
    "Tür değil çeşit profili: her ürünün ışık, su, sıcaklık, pH, verim ve birlikte ekim ilişkileri kanıt seviyesiyle. Kategori, yöntem ve sezona göre filtreleyin.",
};

export default function UrunlerPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Explorer />
      </main>
      <Footer />
    </RevealProvider>
  );
}
