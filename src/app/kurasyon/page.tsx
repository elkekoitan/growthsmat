import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { CurationConsole } from "./CurationConsole";

export const metadata = {
  title: "İçerik Kürasyon Konsolu",
  description:
    "Ürün/çeşit verisine düzeltme önerisi akışı: gönder, uzman incelesin, onaylı sürüm geçmişi korunsun.",
};

export default async function KurasyonPage() {
  const { user, membership } = await requireMembership();

  return (
    <RevealProvider>
      <Nav />
      <main>
        <CurationConsole email={user.email} role={membership.role} nowISO={new Date().toISOString()} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
