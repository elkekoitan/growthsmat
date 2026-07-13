// SmartGrowth OS — İş gücü kapasitesi repository katmanı (gerçek Postgres okuma, yazma yok).
// src/lib/laborCapacity.ts'in computeLaborCapacity() SAF fonksiyonu değişmedi — bu dosya
// gerçek Plan.weeklyMinutes + gerçek Task satırlarını (mutlak tarih) bu fonksiyonun beklediği
// dayOffset tabanlı ScheduledTask[] biçimine çevirir.
//
// DÜRÜSTLÜK NOTU (bilinçli sınır): Plan modelinin TEK bir workspace-geneli areaM2'si var —
// ürün başına ayrı bir alan tahsisi şeması yok (bkz. plan dosyasının kendi notu: "current UI
// only ever plans one plot"). Bu yüzden her cropId grubu aynı toplam alanı kullanır; aynı
// planda BİRDEN FAZLA ürünün örtüşen görevleri varsa toplam dakika tahmini OLDUĞUNDAN YÜKSEK
// çıkabilir (aynı fiziksel alan birden fazla kez sayılır). Gerçek bir Plot/alan-tahsis şeması
// olmadan bu düzeltilemez — sahte kesinlik yerine burada açıkça belirtilir.
import "server-only";

import { getDb } from "../db";
import { computeLaborCapacity, type CropPlanEntry, type LaborCapacityResult } from "@/lib/laborCapacity";
import type { TaskKind } from "@/lib/taskTemplates";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function computeWorkspaceLaborCapacity(workspaceId: string): Promise<LaborCapacityResult | null> {
  const db = getDb();
  const plan = await db.plan.findUnique({ where: { workspaceId } });
  if (!plan) return null;

  const tasks = await db.task.findMany({ where: { workspaceId }, orderBy: { date: "asc" } });
  if (tasks.length === 0) return computeLaborCapacity([], plan.weeklyMinutes);

  const earliest = tasks[0].date.getTime();
  const byCrop = new Map<string, CropPlanEntry>();
  for (const t of tasks) {
    const dayOffset = Math.round((t.date.getTime() - earliest) / MS_PER_DAY);
    let entry = byCrop.get(t.cropId);
    if (!entry) {
      entry = { cropId: t.cropId, areaM2: plan.areaM2, schedule: [] };
      byCrop.set(t.cropId, entry);
    }
    entry.schedule.push({ kind: t.type as TaskKind, dayOffset, title: t.title });
  }

  return computeLaborCapacity(Array.from(byCrop.values()), plan.weeklyMinutes);
}
