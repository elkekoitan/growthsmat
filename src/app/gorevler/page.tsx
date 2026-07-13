import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Tasks } from "./Tasks";
import { requireMembership } from "@/server/session";
import { listOrSeedTasks } from "@/server/repositories/tasks";
import { computeWorkspaceLaborCapacity } from "@/server/repositories/laborCapacity";

export const metadata = {
  title: "Görev ve saha günlüğü",
  description:
    "Bahçeni bir defter gibi tut: güne göre gruplanan bakım ritüelleri, haftalık takvim şeridi ve kalıcı saha günlüğü.",
};

export const dynamic = "force-dynamic";

export default async function GorevlerPage() {
  const { membership } = await requireMembership();
  const tasks = await listOrSeedTasks(membership.workspaceId);
  const laborCapacity = await computeWorkspaceLaborCapacity(membership.workspaceId);

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Tasks initialTasks={tasks} laborCapacity={laborCapacity} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
