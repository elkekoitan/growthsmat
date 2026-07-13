import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { PlanWizard } from "./PlanWizard";
import { requireMembership } from "@/server/session";
import { getPlan } from "@/server/repositories/plans";

export const metadata = {
  title: "Üretim Planı",
  description:
    "Konum, alan, kaynak ve hedefinize göre kanıt seviyeli üretim planı. Uygunluk skoru ile veri güveni ayrı gösterilir; veri boşlukları açıktır.",
};

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const { membership } = await requireMembership();
  const initialPlan = await getPlan(membership.workspaceId);

  return (
    <RevealProvider>
      <Nav />
      <main>
        <PlanWizard initialPlan={initialPlan} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
