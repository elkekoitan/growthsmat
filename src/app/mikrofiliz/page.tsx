import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Studio } from "./Studio";

export const metadata = {
  title: "Mikro Filiz Stüdyosu",
  description:
    "Doğrulanmış mikro filiz reçeteleri, sert gıda güvenliği blokları ve tepsi başına maliyet-marj hesaplayıcı. m² başına yüksek verim, hızlı döngü, restoran talebi.",
};

export default function MikrofilizPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Studio />
      </main>
      <Footer />
    </RevealProvider>
  );
}
