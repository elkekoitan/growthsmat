// SmartGrowth OS — Görev şablon motoru v1 (PRD FR-071, 03-TEKNIK-MIMARI §6.4)
// Ürün/yöntem/evreye göre görev şablonu üretir. Sabit metin değil; crop verisinden
// (careLoad, waterNeed, daysToHarvest) türetilir — her ürün kendi takvimini alır.

import type { Crop } from "@/data/crops";

export type TaskKind = "ekim" | "sulama" | "gubre" | "budama" | "gozlem" | "hasat";

export interface ScheduledTask {
  kind: TaskKind;
  dayOffset: number; // ekim gününden itibaren gün sayısı
  title: string;
}

const WATER_INTERVAL_DAYS: Record<1 | 2 | 3, number> = { 1: 6, 2: 4, 3: 2 };

/**
 * Bir ürün + yöntem + hasat aralığına göre görev takvimi üretir. Tüm görevler
 * daysToHarvest[1] (temkinli hasat üst sınırı) içinde kalır.
 */
export function generateTaskSchedule(crop: Crop): ScheduledTask[] {
  const tasks: ScheduledTask[] = [];
  const [harvestStart, harvestEnd] = crop.daysToHarvest;

  tasks.push({ kind: "ekim", dayOffset: 0, title: `${crop.name} ekimi` });

  const waterInterval = WATER_INTERVAL_DAYS[crop.waterNeed];
  for (let day = waterInterval; day < harvestStart; day += waterInterval) {
    tasks.push({ kind: "sulama", dayOffset: day, title: `${crop.name} sulama` });
  }

  if (harvestStart > 20) {
    tasks.push({ kind: "gubre", dayOffset: 14, title: `${crop.name} ilk besleme` });
  }
  if (harvestStart > 40) {
    tasks.push({ kind: "gubre", dayOffset: 30, title: `${crop.name} ikinci besleme` });
  }

  if (crop.careLoad === 3) {
    const pruneDay = Math.round(harvestStart * 0.4);
    if (pruneDay > 0 && pruneDay < harvestStart) {
      tasks.push({ kind: "budama", dayOffset: pruneDay, title: `${crop.name} budama/destekleme` });
    }
  }

  // Hastalık/gelişim gözlemi — hasat penceresinin ortasında bir kez
  const observeDay = Math.round((harvestStart + harvestEnd) / 2 / 2);
  if (observeDay > 0 && observeDay < harvestStart) {
    tasks.push({ kind: "gozlem", dayOffset: observeDay, title: `${crop.name} gelişim gözlemi` });
  }

  tasks.push({
    kind: "hasat",
    dayOffset: harvestStart,
    title: `${crop.name} hasat başlangıcı (pencere: ${harvestStart}-${harvestEnd}. gün)`,
  });

  return tasks.sort((a, b) => a.dayOffset - b.dayOffset);
}

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  ekim: "Ekim",
  sulama: "Sulama",
  gubre: "Besleme",
  budama: "Budama/Destek",
  gozlem: "Gözlem",
  hasat: "Hasat",
};

/** Bir tarih (ISO) + gün ofsetinden takvim tarihini hesaplar — saf, test edilebilir. */
export function addDaysISO(startDateISO: string, dayOffset: number): string {
  const d = new Date(startDateISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}
