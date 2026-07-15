import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { Explorer } from "./Explorer";

export const metadata: Metadata = {
  title: "Ürün Kâşifi",
  description:
    "Tür değil çeşit profili: her ürünün ışık, su, sıcaklık, pH, verim ve birlikte ekim ilişkileri kanıt seviyesiyle. Kategori, yöntem ve sezona göre filtreleyin.",
};

// Kâşif herkese açık kalır (oturum ŞART değil), ama "Bahçeme ekle" yalnız gerçek bir
// oturumda anlamlı — oturum durumu okunduğu için sayfa dinamik.
export const dynamic = "force-dynamic";

export default async function UrunlerPage() {
  const session = await getOptionalMembership();

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Explorer hasSession={session !== null} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
