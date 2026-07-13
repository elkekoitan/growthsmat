import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Traceability } from "./Traceability";
import { requireMembership } from "@/server/session";
import { listOrSeedLots } from "@/server/repositories/lots";
import { can } from "@/lib/roles";

export const metadata = {
  title: "Lot İzlenebilirlik",
  description:
    "Tohumdan sevkiyata bir adım geri / bir adım ileri lot izi, mass balance doğrulaması ve geri çağırma simülasyonu.",
};

export const dynamic = "force-dynamic";

export default async function IzlenebilirlikPage() {
  const { membership } = await requireMembership();
  const lots = await listOrSeedLots(membership.workspaceId);
  const canCreateLot = can(membership.role, "lot.create");

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Traceability initialLots={lots} canCreateLot={canCreateLot} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
