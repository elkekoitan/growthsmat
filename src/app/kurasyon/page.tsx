import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { listSubmissions, seedDemoSubmissionsIfEmpty } from "@/server/repositories/corrections";
import { CurationConsole } from "./CurationConsole";

export const metadata = {
  title: "İçerik Kürasyon Konsolu",
  description:
    "Ürün/çeşit verisine düzeltme önerisi akışı: gönder, uzman incelesin, onaylı sürüm geçmişi korunsun.",
};

export const dynamic = "force-dynamic";

export default async function KurasyonPage() {
  const { user, membership } = await requireMembership();
  await seedDemoSubmissionsIfEmpty();
  const submissions = await listSubmissions();

  return (
    <RevealProvider>
      <Nav />
      <main>
        <CurationConsole email={user.email} role={membership.role} initialSubmissions={submissions} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
