// SmartGrowth OS — Ürün/çeşit karşılaştırma motoru (PRD FR-036, P04-11)
// "Çeşitleri erkencilik, büyüme tipi, verim, tat, raf ömrü ve dirençle karşılaştırma."
// Eşitlik durumunda hiçbir aday "en iyi" olarak vurgulanmaz — sahte kesinlik üretmez.

import type { Crop, EvidenceGrade } from "@/data/crops";

const EVIDENCE_RANK: Record<EvidenceGrade, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const LEVEL_LABELS = ["Düşük", "Orta", "Yüksek"];

export interface ComparisonMetric {
  key: string;
  label: string;
  getValue: (c: Crop) => string;
  getSortValue?: (c: Crop) => number;
  betterWhen: "lower" | "higher" | "none";
}

export const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    key: "sun",
    label: "Güneş ihtiyacı",
    getValue: (c) => `${c.sunMinHours}–${c.sunOptHours} sa`,
    getSortValue: (c) => c.sunOptHours,
    betterWhen: "none",
  },
  {
    key: "water",
    label: "Su ihtiyacı",
    getValue: (c) => LEVEL_LABELS[c.waterNeed - 1],
    getSortValue: (c) => c.waterNeed,
    betterWhen: "lower",
  },
  {
    key: "care",
    label: "Bakım yükü",
    getValue: (c) => LEVEL_LABELS[c.careLoad - 1],
    getSortValue: (c) => c.careLoad,
    betterWhen: "lower",
  },
  {
    key: "harvest",
    label: "İlk hasat",
    getValue: (c) => `${c.daysToHarvest[0]}–${c.daysToHarvest[1]} gün`,
    getSortValue: (c) => c.daysToHarvest[0],
    betterWhen: "lower",
  },
  {
    key: "yield",
    label: "Verim (m² başına)",
    getValue: (c) => `${c.yieldPerM2Kg[0]}–${c.yieldPerM2Kg[1]} kg`,
    getSortValue: (c) => c.yieldPerM2Kg[1],
    betterWhen: "higher",
  },
  {
    key: "pestResilience",
    label: "Hastalık direnci",
    getValue: (c) => LEVEL_LABELS[c.pestResilience - 1],
    getSortValue: (c) => c.pestResilience,
    betterWhen: "higher",
  },
  {
    key: "evidence",
    label: "Kanıt seviyesi",
    getValue: (c) => c.evidence,
    getSortValue: (c) => EVIDENCE_RANK[c.evidence],
    betterWhen: "higher",
  },
  {
    key: "beginner",
    label: "Yeni başlayana uygun",
    getValue: (c) => (c.beginnerFriendly ? "Evet" : "Hayır"),
    betterWhen: "none",
  },
];

/**
 * Bir metrikte hangi ürünün "en iyi" olduğunu bulur. Eşitlik varsa (birden fazla
 * ürün aynı en iyi değeri paylaşıyorsa) hiçbiri vurgulanmaz — null döner.
 */
export function findBestCropIndex(crops: Crop[], metric: ComparisonMetric): number | null {
  if (metric.betterWhen === "none" || !metric.getSortValue || crops.length < 2) return null;
  const values = crops.map(metric.getSortValue);
  const best = metric.betterWhen === "lower" ? Math.min(...values) : Math.max(...values);
  const winners = values.filter((v) => v === best).length;
  return winners === 1 ? values.indexOf(best) : null;
}
