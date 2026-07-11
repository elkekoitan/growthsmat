import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Traceability } from "./Traceability";

export const metadata = {
  title: "Lot İzlenebilirlik",
  description:
    "Tohumdan sevkiyata bir adım geri / bir adım ileri lot izi, mass balance doğrulaması ve geri çağırma simülasyonu.",
};

export default function IzlenebilirlikPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Traceability />
      </main>
      <Footer />
    </RevealProvider>
  );
}
