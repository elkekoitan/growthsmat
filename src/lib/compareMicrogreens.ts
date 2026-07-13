// SmartGrowth OS — Mikro filiz reçetesi karşılaştırma motoru (PRD 9.8, P09-04)
// "Reçeteleri güvenlik, kanıt, zorluk, süre ve verimle karşılaştırma."
// Eşitlik durumunda hiçbir aday "en iyi" olarak vurgulanmaz — sahte kesinlik üretmez.
// src/lib/compareCrops.ts'teki ürün karşılaştırma motoruyla aynı desen (findBestCropIndex).

import { SAFETY_LABELS, type MicrogreenRecipe } from "@/data/microgreens";

const EVIDENCE_RANK: Record<MicrogreenRecipe["evidence"], number> = { A: 4, B: 3, C: 2, D: 1 };
const DIFFICULTY_LABELS = ["", "Kolay", "Orta", "Zor"];

export interface ComparisonMetric {
  key: string;
  label: string;
  getValue: (r: MicrogreenRecipe) => string;
  getSortValue?: (r: MicrogreenRecipe) => number;
  betterWhen: "lower" | "higher" | "none";
}

export const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    key: "safety",
    label: "Güvenlik sınıfı",
    getValue: (r) => SAFETY_LABELS[r.safety].label,
    betterWhen: "none",
  },
  {
    key: "evidence",
    label: "Kanıt seviyesi",
    getValue: (r) => r.evidence,
    getSortValue: (r) => EVIDENCE_RANK[r.evidence],
    betterWhen: "higher",
  },
  {
    key: "difficulty",
    label: "Zorluk",
    getValue: (r) => DIFFICULTY_LABELS[r.difficulty],
    getSortValue: (r) => r.difficulty,
    betterWhen: "lower",
  },
  {
    key: "presoak",
    label: "Ön ıslatma",
    getValue: (r) =>
      r.presoakHours[1] === 0 ? "Yok" : `${r.presoakHours[0]}–${r.presoakHours[1]} sa`,
    getSortValue: (r) => r.presoakHours[1],
    betterWhen: "lower",
  },
  {
    key: "blackout",
    label: "Karartma",
    getValue: (r) => `${r.blackoutDays[0]}–${r.blackoutDays[1]} gün`,
    getSortValue: (r) => r.blackoutDays[1],
    betterWhen: "lower",
  },
  {
    key: "harvest",
    label: "Hasat",
    getValue: (r) => `${r.harvestDays[0]}–${r.harvestDays[1]} gün`,
    getSortValue: (r) => r.harvestDays[0],
    betterWhen: "lower",
  },
  {
    key: "yield",
    label: "Verim (tepsi başına)",
    getValue: (r) => `${r.expectedYieldG[0]}–${r.expectedYieldG[1]} g`,
    getSortValue: (r) => r.expectedYieldG[1],
    betterWhen: "higher",
  },
  {
    key: "family",
    label: "Familya",
    getValue: (r) => r.family,
    betterWhen: "none",
  },
];

/**
 * Bir metrikte hangi reçetenin "en iyi" olduğunu bulur. Eşitlik varsa (birden fazla
 * reçete aynı en iyi değeri paylaşıyorsa) hiçbiri vurgulanmaz — null döner.
 */
export function findBestRecipeIndex(
  recipes: MicrogreenRecipe[],
  metric: ComparisonMetric,
): number | null {
  if (metric.betterWhen === "none" || !metric.getSortValue || recipes.length < 2) return null;
  const values = recipes.map(metric.getSortValue);
  const best = metric.betterWhen === "lower" ? Math.min(...values) : Math.max(...values);
  const winners = values.filter((v) => v === best).length;
  return winners === 1 ? values.indexOf(best) : null;
}
