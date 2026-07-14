import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { TaskTemplateBuilder } from "./TaskTemplateBuilder";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Görev Şablonu",
  description:
    "Ürüne göre türetilen görev takvimi — su ihtiyacı, bakım yükü ve hasat penceresinden otomatik üretilir.",
};

export default async function GorevSablonuPage() {
  const session = await getOptionalMembership();
  return (
    <RevealProvider>
      <Nav />
      <main>
        <TaskTemplateBuilder hasSession={!!session} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
