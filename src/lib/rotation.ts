// SmartGrowth OS — Rotasyon ve ardışık ekim çözücü v1 (PRD FR-060, 05-URUN-VE-BILGI-MODELI §6)
// Rotasyon (zamansal, aile bazlı) ile birlikte ekim (mekânsal, companions) BİLEREK ayrı
// tutulur — dokümandaki ayrımı korur. Kanıtsız "kesin uyumlu" iddiası üretmez.

import { CROPS, CROP_BY_ID, type Crop, type CompanionRelation } from "@/data/crops";

export interface PlotHistoryEntry {
  cropId: string;
  seasonsAgo: number; // 0 = bu sezon, 1 = bir önceki sezon, ...
}

export interface FamilyConflict {
  family: string;
  historicalCropId: string;
  seasonsAgo: number;
}

export interface RotationCandidate {
  crop: Crop;
  eligible: boolean;
  conflict?: FamilyConflict;
  successionFriendly: boolean;
  companionSuggestions: CompanionRelation[]; // bilgilendirme amaçlı — rotasyon skoruna karışmaz
  score: number; // 0-100, sadece uygun adaylar arasında sıralama için
}

/** Geriye dönük `lookbackSeasons` içinde ekilmiş ürün ailelerini çıkarır. */
function familiesInHistory(history: PlotHistoryEntry[], lookbackSeasons: number): Set<string> {
  const families = new Set<string>();
  for (const h of history) {
    if (h.seasonsAgo > lookbackSeasons) continue;
    const crop = CROP_BY_ID[h.cropId];
    if (crop) families.add(crop.family);
  }
  return families;
}

/**
 * Bir parselin ekim geçmişine göre aday ürünleri değerlendirir.
 * SERT KISIT: adayın `rotationAvoidFamilies` listesindeki bir aile, lookback penceresinde
 * ekilmişse aday elenir (aynı aile hastalık/besin baskısını taşır — 05-doküman §6.3).
 */
export function evaluateRotation(
  history: PlotHistoryEntry[],
  candidates: Crop[] = CROPS,
  lookbackSeasons = 3
): RotationCandidate[] {
  const recentFamilies = familiesInHistory(history, lookbackSeasons);

  const results: RotationCandidate[] = candidates.map((crop) => {
    let conflict: FamilyConflict | undefined;

    for (const avoidFamily of crop.rotationAvoidFamilies) {
      if (recentFamilies.has(avoidFamily)) {
        const historical = history.find((h) => {
          const hc = CROP_BY_ID[h.cropId];
          return hc && hc.family === avoidFamily && h.seasonsAgo <= lookbackSeasons;
        });
        conflict = {
          family: avoidFamily,
          historicalCropId: historical?.cropId ?? "bilinmeyen",
          seasonsAgo: historical?.seasonsAgo ?? 0,
        };
        break;
      }
    }

    const eligible = !conflict;
    const successionFriendly = crop.successionCrop;
    const companionSuggestions = crop.companions.filter((c) => c.effect === "faydali");

    let score = 0;
    if (eligible) {
      score = 70;
      if (successionFriendly) score += 15;
      if (companionSuggestions.length > 0) score += 10;
      // aile hiç geçmişte yoksa (uzak/hiç ekilmemiş) hafif bonus — çeşitlilik teşviki
      if (!Array.from(recentFamilies).includes(crop.family)) score += 5;
      score = Math.min(100, score);
    }

    return { crop, eligible, conflict, successionFriendly, companionSuggestions, score };
  });

  return results.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.score - a.score;
  });
}

/** Yalnız uygun adayları, skora göre azalan sırada döner — plan ekranı için kısayol. */
export function suggestNextCrops(history: PlotHistoryEntry[], limit = 5, lookbackSeasons = 3): RotationCandidate[] {
  return evaluateRotation(history, CROPS, lookbackSeasons)
    .filter((r) => r.eligible)
    .slice(0, limit);
}
