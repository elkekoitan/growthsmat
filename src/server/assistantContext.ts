// Asistan kişisel bağlamını (Bahçem + Görevler) DB'den toplayan ortak yardımcı.
// Hem /asistan page.tsx (ilk render) hem askAssistantAction (her soru) kullanır —
// bağlam HER ZAMAN sunucuda kurulur, istemciden gelen bağlama asla güvenilmez.
import "server-only";

import { listTrackedCrops } from "./repositories/trackedCrops";
import { listOrSeedTasks } from "./repositories/tasks";
import type { AssistantContext } from "@/lib/assistant";

export async function buildAssistantContext(workspaceId: string): Promise<AssistantContext> {
  const [crops, tasks] = await Promise.all([
    listTrackedCrops(workspaceId),
    listOrSeedTasks(workspaceId),
  ]);
  // tasks.ts tarihleri UTC yyyy-mm-dd string'i olarak döner — aynı formatta
  // leksikografik karşılaştırma gün karşılaştırmasıyla birebir eşdeğerdir.
  const today = new Date().toISOString().slice(0, 10);
  return {
    crops: crops.map((c) => ({ cropId: c.cropId, status: c.status, zone: c.zone })),
    tasksToday: tasks
      .filter((t) => !t.done && t.date === today)
      .map((t) => ({ title: t.title, cropId: t.cropId, type: t.type })),
    tasksOverdue: tasks.filter((t) => !t.done && t.date < today).length,
  };
}
