// SmartGrowth OS — İş gücü/bütçe kapasitesi (PRD P03-09)
// Birden fazla ürünün haftalık görev yükünü (taskTemplates.ts çıktısından) toplar ve
// kullanıcının ayırabildiği haftalık dakika (weeklyMinutes, bkz. suitability.ts SiteProfile)
// ile karşılaştırır. Aşım haftaları AÇIKÇA işaretlenir — sessizce göz ardı edilmez.

import type { ScheduledTask, TaskKind } from "@/lib/taskTemplates";

/** Görev türü başına temel süre (dakika) — sabit kurulum/erişim maliyeti. */
export const BASE_TASK_MINUTES: Record<TaskKind, number> = {
  ekim: 20,
  sulama: 5,
  gubre: 10,
  budama: 15,
  gozlem: 5,
  hasat: 15,
};

/** Alan başına ek dakika (m²) — daha büyük alan aynı görev için orantılı olarak daha uzun sürer. */
export const AREA_MINUTES_PER_M2: Record<TaskKind, number> = {
  ekim: 3,
  sulama: 1,
  gubre: 1.5,
  budama: 2,
  gozlem: 0.5,
  hasat: 4,
};

/** Ertelenebilir görev türleri — aşım durumunda önce bunlar komşu haftaya kaydırılabilir. */
export const FLEXIBLE_TASK_KINDS: TaskKind[] = ["sulama", "gozlem"];

export function estimateTaskMinutes(kind: TaskKind, areaM2: number): number {
  return Math.round(BASE_TASK_MINUTES[kind] + AREA_MINUTES_PER_M2[kind] * Math.max(0, areaM2));
}

export interface CropPlanEntry {
  cropId: string;
  areaM2: number;
  schedule: ScheduledTask[]; // generateTaskSchedule(crop) çıktısı
  plantingOffsetDays?: number; // bu ürün diğerlerine göre kaç gün sonra ekildi (succession planting)
}

export interface CropWeekLoad {
  cropId: string;
  minutes: number;
  kinds: TaskKind[];
}

export interface WeekLoad {
  weekIndex: number; // 0-based, plan başlangıcından itibaren
  totalMinutes: number;
  taskCount: number;
  tasksByCrop: CropWeekLoad[];
}

export interface LaborCapacityResult {
  weeklyBudgetMinutes: number;
  weeks: WeekLoad[];
  overloadedWeeks: WeekLoad[];
  peakWeek: WeekLoad | null;
  feasible: boolean;
}

/** Çoklu ürün planının haftalık iş gücü yükünü toplar ve bütçeyle karşılaştırır. */
export function computeLaborCapacity(plan: CropPlanEntry[], weeklyBudgetMinutes: number): LaborCapacityResult {
  const weekMap = new Map<number, WeekLoad>();

  for (const entry of plan) {
    const offset = entry.plantingOffsetDays ?? 0;
    const perCropByWeek = new Map<number, { minutes: number; kinds: Set<TaskKind> }>();

    for (const task of entry.schedule) {
      const weekIndex = Math.floor((task.dayOffset + offset) / 7);
      const minutes = estimateTaskMinutes(task.kind, entry.areaM2);

      if (!weekMap.has(weekIndex)) {
        weekMap.set(weekIndex, { weekIndex, totalMinutes: 0, taskCount: 0, tasksByCrop: [] });
      }
      const week = weekMap.get(weekIndex)!;
      week.totalMinutes += minutes;
      week.taskCount += 1;

      if (!perCropByWeek.has(weekIndex)) perCropByWeek.set(weekIndex, { minutes: 0, kinds: new Set() });
      const cropWeek = perCropByWeek.get(weekIndex)!;
      cropWeek.minutes += minutes;
      cropWeek.kinds.add(task.kind);
    }

    for (const [weekIndex, data] of perCropByWeek) {
      weekMap.get(weekIndex)!.tasksByCrop.push({ cropId: entry.cropId, minutes: data.minutes, kinds: Array.from(data.kinds) });
    }
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.weekIndex - b.weekIndex);
  const overloadedWeeks = weeks.filter((w) => w.totalMinutes > weeklyBudgetMinutes);
  const peakWeek = weeks.reduce<WeekLoad | null>((max, w) => (!max || w.totalMinutes > max.totalMinutes ? w : max), null);

  return { weeklyBudgetMinutes, weeks, overloadedWeeks, peakWeek, feasible: overloadedWeeks.length === 0 };
}

/**
 * Aşım varsa en aşırı yüklü haftaya göre öneri metni döner. Esnek görev (sulama/gözlem)
 * varsa kaydırma önerilir; yoksa (yalnız ekim/hasat/besleme gibi ertelenemez görevler)
 * süre artırma veya alan küçültme önerilir — sahte "her şey çözülür" izlenimi verilmez.
 */
export function suggestRebalance(result: LaborCapacityResult): string | undefined {
  if (result.feasible) return undefined;
  const worst = result.overloadedWeeks.reduce((a, b) => (b.totalMinutes > a.totalMinutes ? b : a));
  const overBy = worst.totalMinutes - result.weeklyBudgetMinutes;
  const hasFlexible = worst.tasksByCrop.some((c) => c.kinds.some((k) => FLEXIBLE_TASK_KINDS.includes(k)));

  if (hasFlexible) {
    return `${worst.weekIndex + 1}. hafta bütçeyi ${overBy} dakika aşıyor — esnek görevleri (sulama, gözlem) komşu haftaya kaydırmayı dene.`;
  }
  return `${worst.weekIndex + 1}. hafta bütçeyi ${overBy} dakika aşıyor — bu haftadaki görevler (ekim/hasat/besleme) ertelenemez; haftalık ayrılan süreni artırmayı veya ekili alanı azaltmayı düşün.`;
}
