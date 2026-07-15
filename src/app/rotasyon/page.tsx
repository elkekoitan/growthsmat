import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { listPlotSeasons } from "@/server/repositories/plotSeasons";
import { RotationPlanner } from "./RotationPlanner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rotasyon Planlayıcı",
  description:
    "Parsel ekim geçmişine göre aile bazlı rotasyon çözücü — aynı aileyi tekrar öneren adaylar sert kısıtla elenir.",
};

export default async function RotasyonPage() {
  const session = await getOptionalMembership();
  const initialSeasons = session ? await listPlotSeasons(session.membership.workspaceId) : [];
  return (
    <RevealProvider>
      <Nav />
      <main>
        <RotationPlanner hasSession={!!session} initialSeasons={initialSeasons} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
