import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { CurationConsole } from "./CurationConsole";

export const metadata = {
  title: "İçerik Kürasyon Konsolu",
  description:
    "Ürün/çeşit verisine düzeltme önerisi akışı: gönder, uzman incelesin, onaylı sürüm geçmişi korunsun.",
};

export default function KurasyonPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <CurationConsole />
      </main>
      <Footer />
    </RevealProvider>
  );
}
