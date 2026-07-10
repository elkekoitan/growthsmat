import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { PlanWizard } from "./PlanWizard";

export const metadata = {
  title: "Üretim Planı",
  description:
    "Konum, alan, kaynak ve hedefinize göre kanıt seviyeli üretim planı. Uygunluk skoru ile veri güveni ayrı gösterilir; veri boşlukları açıktır.",
};

export default function PlanPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <PlanWizard />
      </main>
      <Footer />
    </RevealProvider>
  );
}
