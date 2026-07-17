import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Dashboard } from "./Dashboard";
import { WorkspaceSummary, type WorkspaceSummaryData } from "./WorkspaceSummary";
import { GoLiveChecklist } from "./GoLiveChecklist";
import { getGoLiveState } from "@/server/goLive";
import { getOptionalMembership } from "@/server/session";
import { listOrSeedTasks } from "@/server/repositories/tasks";
import { listOrSeedLots } from "@/server/repositories/lots";
import { listMyListings } from "@/server/repositories/listings";
import { listMyOrdersAsBuyer, listOrdersForListing } from "@/server/repositories/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yol Haritası",
  description:
    "SmartGrowth OS'nin yapım durumunu gösteren canlı takip panosu — 13 epik, ağırlıklı ilerleme, kritik yol ve risk görünümü. 04 Görev Matrisi'nin canlı hâli.",
};

/** UTC gün başlangıcı — RealTask.date de UTC dilimlenmiş "yyyy-mm-dd" (bkz. tasks.ts toRealTask). */
function todayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

async function buildSummary(workspaceId: string): Promise<WorkspaceSummaryData> {
  const today = todayUTC();

  const [tasks, lots, myListings, myBuyerOrders] = await Promise.all([
    listOrSeedTasks(workspaceId),
    listOrSeedLots(workspaceId),
    listMyListings(workspaceId),
    listMyOrdersAsBuyer(workspaceId),
  ]);

  const tasksToday = tasks.filter((t) => t.date === today).length;
  const tasksOverdue = tasks.filter((t) => t.date < today && !t.done).length;
  const activeLots = lots.filter((l) => l.status === "aktif").length;
  const activeListings = myListings.filter((l) => l.active).length;
  const openBuyerOrders = myBuyerOrders.filter((o) => o.status === "beklemede").length;

  // Kendi ilanlarıma gelen bekleyen siparişler — her aktif/pasif ilanın siparişlerini toplayıp say.
  const incomingLists = await Promise.all(myListings.map((l) => listOrdersForListing(l.id)));
  const pendingIncomingOrders = incomingLists
    .flat()
    .filter((o) => o.status === "beklemede").length;

  return { tasksToday, tasksOverdue, activeLots, activeListings, openBuyerOrders, pendingIncomingOrders };
}

export default async function PanelPage() {
  const session = await getOptionalMembership();
  const [summary, goLive] = await Promise.all([
    session ? buildSummary(session.membership.workspaceId) : Promise.resolve(null),
    getGoLiveState(),
  ]);

  return (
    <RevealProvider>
      <Nav />
      <main>
        <WorkspaceSummary session={session ? { email: session.user.email } : null} summary={summary} />
        <GoLiveChecklist items={goLive.items} summary={goLive.summary} />
        <Dashboard />
      </main>
      <Footer />
    </RevealProvider>
  );
}
