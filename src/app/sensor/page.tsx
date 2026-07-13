import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { SensorDashboard } from "./SensorDashboard";
import { requireMembership } from "@/server/session";
import { listOrSeedDevices, listReadings, listAlertRules } from "@/server/repositories/sensors";

export const metadata = {
  title: "Sensör ve Alarm",
  description:
    "Cihaz durumu, aykırı değer filtreleme ve süre/eşiğe dayalı alarm kuralları — tek anlık sıçrama yanlış alarm üretmez.",
};

export const dynamic = "force-dynamic";

export default async function SensorPage() {
  const { membership } = await requireMembership();
  const devices = await listOrSeedDevices(membership.workspaceId);
  const readingsByDevice: Record<string, Awaited<ReturnType<typeof listReadings>>> = {};
  const rulesByDevice: Record<string, Awaited<ReturnType<typeof listAlertRules>>> = {};
  for (const d of devices) {
    readingsByDevice[d.id] = await listReadings(membership.workspaceId, d.id);
    rulesByDevice[d.id] = await listAlertRules(membership.workspaceId, d.id);
  }

  return (
    <RevealProvider>
      <Nav />
      <main>
        <SensorDashboard devices={devices} readingsByDevice={readingsByDevice} rulesByDevice={rulesByDevice} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
