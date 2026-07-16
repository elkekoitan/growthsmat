// /asistan — oturum varsa asistana kullanıcının GERÇEK bahçe/görev satırları bağlam
// olarak geçirilir (kişisel cevaplar bu satırlardan türetilir, uydurma yok). Oturum
// yoksa context=null ve asistan eski genel davranışında kalır.
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { listTrackedCrops } from "@/server/repositories/trackedCrops";
import { listOrSeedTasks } from "@/server/repositories/tasks";
import type { AssistantContext } from "@/lib/assistant";
import { Assistant } from "./Assistant";

// Oturum cookie'sine ve canlı DB verisine bağlı — statik prerender edilemez.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Asistan",
  description:
    "Kaynak gösteren kural tabanlı asistan — pestisit dozu ve sağlık iddiası sorularında cevap üretmez, uzmana yönlendirir.",
};

export default async function AsistanPage() {
  const auth = await getOptionalMembership();

  let context: AssistantContext | null = null;
  if (auth) {
    const [crops, tasks] = await Promise.all([
      listTrackedCrops(auth.membership.workspaceId),
      listOrSeedTasks(auth.membership.workspaceId),
    ]);
    // tasks.ts tarihleri UTC yyyy-mm-dd string'i olarak döner — aynı formatta
    // leksikografik karşılaştırma gün karşılaştırmasıyla birebir eşdeğerdir.
    const today = new Date().toISOString().slice(0, 10);
    context = {
      crops: crops.map((c) => ({ cropId: c.cropId, status: c.status, zone: c.zone })),
      tasksToday: tasks
        .filter((t) => !t.done && t.date === today)
        .map((t) => ({ title: t.title, cropId: t.cropId, type: t.type })),
      tasksOverdue: tasks.filter((t) => !t.done && t.date < today).length,
    };
  }

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Assistant context={context} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
