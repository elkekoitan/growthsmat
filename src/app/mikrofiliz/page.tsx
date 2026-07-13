import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { getRoom, listSubscriptions, computeWorkspaceCapacityPlan } from "@/server/repositories/microCapacity";
import { Studio } from "./Studio";

export const metadata = {
  title: "Mikro Filiz Stüdyosu",
  description:
    "Doğrulanmış mikro filiz reçeteleri, sert gıda güvenliği blokları ve tepsi başına maliyet-marj hesaplayıcı. m² başına yüksek verim, hızlı döngü, restoran talebi.",
};

export const dynamic = "force-dynamic";

export default async function MikrofilizPage() {
  const session = await getOptionalMembership();

  let room = null as Awaited<ReturnType<typeof getRoom>>;
  let subscriptions: Awaited<ReturnType<typeof listSubscriptions>> = [];
  let capacityPlan: Awaited<ReturnType<typeof computeWorkspaceCapacityPlan>> = null;

  if (session) {
    room = await getRoom(session.membership.workspaceId);
    subscriptions = await listSubscriptions(session.membership.workspaceId);
    capacityPlan = await computeWorkspaceCapacityPlan(session.membership.workspaceId);
  }

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Studio hasSession={!!session} room={room} subscriptions={subscriptions} capacityPlan={capacityPlan} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
