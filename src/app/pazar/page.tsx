import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Market } from "./Market";

export const metadata = {
  title: "Pazar ve Ticaret Merkezi",
  description:
    "Yerel vitrin, restoran aboneliği, CSA kutusu ve Etsy'yi tek merkezden yönet — ücretler şeffaf, organik iddia sertifika olmadan yayınlanmaz.",
};

export default function PazarPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Market />
      </main>
      <Footer />
    </RevealProvider>
  );
}
