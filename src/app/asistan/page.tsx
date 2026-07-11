import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Assistant } from "./Assistant";

export const metadata = {
  title: "AI Asistan",
  description:
    "Kaynak gösteren kural tabanlı asistan — pestisit dozu ve sağlık iddiası sorularında cevap üretmez, uzmana yönlendirir.",
};

export default function AsistanPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Assistant />
      </main>
      <Footer />
    </RevealProvider>
  );
}
