import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { TaskTemplateBuilder } from "./TaskTemplateBuilder";

export const metadata = {
  title: "Görev Şablonu",
  description:
    "Ürüne göre türetilen görev takvimi — su ihtiyacı, bakım yükü ve hasat penceresinden otomatik üretilir.",
};

export default function GorevSablonuPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <TaskTemplateBuilder />
      </main>
      <Footer />
    </RevealProvider>
  );
}
