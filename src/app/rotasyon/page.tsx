import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { RotationPlanner } from "./RotationPlanner";

export const metadata = {
  title: "Rotasyon Planlayıcı",
  description:
    "Parsel ekim geçmişine göre aile bazlı rotasyon çözücü — aynı aileyi tekrar öneren adaylar sert kısıtla elenir.",
};

export default function RotasyonPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <RotationPlanner />
      </main>
      <Footer />
    </RevealProvider>
  );
}
