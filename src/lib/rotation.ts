// SmartGrowth OS — Rotasyon ve ardışık ekim çözücü v1 (PRD FR-060, 05-URUN-VE-BILGI-MODELI §6)
// Rotasyon (zamansal, aile bazlı) ile birlikte ekim (mekânsal, companions) BİLEREK ayrı
// tutulur — dokümandaki ayrımı korur. Kanıtsız "kesin uyumlu" iddiası üretmez.

import { CROPS, CROP_BY_ID, type Crop, type CompanionRelation } from "@/data/crops";
import { minRotationYearsForFamily } from "@/data/pestDisease";

export interface PlotHistoryEntry {
  cropId: string;
  seasonsAgo: number; // 0 = bu sezon, 1 = bir önceki sezon, ...
}

export interface FamilyConflict {
  family: string;
  historicalCropId: string;
  seasonsAgo: number;
  requiredYears: number; // bu çakışma için fiilen uygulanan minimum rotasyon süresi
  diseaseDriven: boolean; // true ise requiredYears varsayılan lookback'ten değil, gerçek hastalık kaynağından geliyor
}

export interface RotationCandidate {
  crop: Crop;
  eligible: boolean;
  conflict?: FamilyConflict;
  successionFriendly: boolean;
  companionSuggestions: CompanionRelation[]; // bilgilendirme amaçlı — rotasyon skoruna karışmaz
  score: number; // 0-100, sadece uygun adaylar arasında sıralama için
}

/**
 * Bir familya için fiilen uygulanacak minimum rotasyon süresini belirler: varsayılan
 * lookback ile o familyayı etkileyen gerçek hastalıkların (pestDisease.ts) belgelenmiş
 * minimum süresinden BÜYÜK OLANI kullanılır — sert kısıt hastalık verisiyle yalnız
 * SIKILAŞTIRILIR, asla gevşetilmez (ör. Brassicaceae varsayılan 3 yerine kökboğan
 * nedeniyle 7 yıl gerektirir).
 */
function requiredYearsForFamily(family: string, defaultLookback: number): { years: number; diseaseDriven: boolean } {
  const diseaseYears = minRotationYearsForFamily(family);
  if (diseaseYears !== undefined && diseaseYears > defaultLookback) {
    return { years: diseaseYears, diseaseDriven: true };
  }
  return { years: defaultLookback, diseaseDriven: false };
}

/**
 * Bir parselin ekim geçmişine göre aday ürünleri değerlendirir.
 * SERT KISIT: adayın `rotationAvoidFamilies` listesindeki bir aile, gereken pencerede
 * ekilmişse aday elenir (aynı aile hastalık/besin baskısını taşır — 05-doküman §6.3).
 */
export function evaluateRotation(
  history: PlotHistoryEntry[],
  candidates: Crop[] = CROPS,
  lookbackSeasons = 3
): RotationCandidate[] {
  // Çeşitlilik bonusu için genel (hastalık-farkında olmayan) pencere — sert kısıtı etkilemez.
  const recentFamilies = new Set<string>();
  for (const h of history) {
    if (h.seasonsAgo > lookbackSeasons) continue;
    const hc = CROP_BY_ID[h.cropId];
    if (hc) recentFamilies.add(hc.family);
  }

  const results: RotationCandidate[] = candidates.map((crop) => {
    let conflict: FamilyConflict | undefined;

    for (const avoidFamily of crop.rotationAvoidFamilies) {
      const { years: requiredYears, diseaseDriven } = requiredYearsForFamily(avoidFamily, lookbackSeasons);
      const historical = history.find((h) => {
        const hc = CROP_BY_ID[h.cropId];
        return hc && hc.family === avoidFamily && h.seasonsAgo <= requiredYears;
      });
      if (historical) {
        conflict = {
          family: avoidFamily,
          historicalCropId: historical.cropId,
          seasonsAgo: historical.seasonsAgo,
          requiredYears,
          diseaseDriven,
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
