import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { listTrackedCrops } from "@/server/repositories/trackedCrops";
import { listOrSeedTasks } from "@/server/repositories/tasks";
import { Garden } from "./Garden";

export const metadata = {
  title: "Bahçem",
  description: "Takip ettiğin ürünler ve her biri için tek bir sonraki adım.",
};

export const dynamic = "force-dynamic";

export default async function BahcemPage() {
  // Bu, kullanıcının KENDİ bahçesi — anonim ziyaretçiye gösterilecek bir şey yok.
  const { membership } = await requireMembership();
  const trackedCrops = await listTrackedCrops(membership.workspaceId);
  const tasks = await listOrSeedTasks(membership.workspaceId);

  // "Bugün N işin var" satırı GERÇEK görev listesinden türetilir — uydurma sayı yok.
  const today = new Date().toISOString().slice(0, 10);
  const todayOpenTaskCount = tasks.filter((t) => t.date === today && !t.done).length;

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Garden trackedCrops={trackedCrops} todayOpenTaskCount={todayOpenTaskCount} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
