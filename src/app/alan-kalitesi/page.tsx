import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { SiteQualityDemo } from "./SiteQualityDemo";

export const metadata = {
  title: "Alan Veri Kalite Skoru",
  description:
    "Eksik ve bayat alan verisini ayrı ayrı işaretleyen kalite skoru — sahte kesinlik üretmez.",
};

export default function AlanKalitesiPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <SiteQualityDemo />
      </main>
      <Footer />
    </RevealProvider>
  );
}
