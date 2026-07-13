import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { listCycles, listEntries, computeCycleResult, type RealCostCycle, type RealCostEntry } from "@/server/repositories/costModel";
import type { CycleCostResult } from "@/lib/costModel";
import { Costs } from "./Costs";

export const metadata = {
  title: "Maliyet ve Marj Modeli",
  description: "Gerçek maliyet kalemlerini kaydet, sabit maliyeti dağıt, marjını hesapla — sahte bir 'sektör ortalaması' eklenmez.",
};

export const dynamic = "force-dynamic";

export interface CycleBundle {
  cycle: RealCostCycle;
  entries: RealCostEntry[];
  result: CycleCostResult | null;
}

export default async function MaliyetPage() {
  const { membership } = await requireMembership();
  const cycles = await listCycles(membership.workspaceId);

  const bundles: CycleBundle[] = await Promise.all(
    cycles.map(async (cycle) => ({
      cycle,
      entries: await listEntries(cycle.id, membership.workspaceId),
      result: await computeCycleResult(cycle.id, membership.workspaceId),
    }))
  );

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Costs bundles={bundles} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
