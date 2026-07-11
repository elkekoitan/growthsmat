// SmartGrowth OS — Ne-olursa senaryo motoru (PRD FR-048)
// Bir profil değişikliğinin uygunluk skoruna VE güvene AYRI etkisini gösterir; sert
// kısıtların çözülüp çözülmediğini (unlockedHardFails) açıkça raporlar.

import { assessCrop, type SiteProfile, type CandidateResult } from "@/lib/suitability";
import { CROP_BY_ID } from "@/data/crops";

export type WhatIfField = "sunHours" | "method" | "soilPh" | "waterAccess" | "season" | "containerL";

export interface WhatIfChange {
  field: WhatIfField;
  value: SiteProfile[WhatIfField];
}

export interface FactorDelta {
  factorKey: string;
  label: string;
  beforeScore: number;
  afterScore: number;
  delta: number;
}

export interface WhatIfResult {
  before: CandidateResult;
  after: CandidateResult;
  scoreDelta: number;
  confidenceDelta: number;
  factorDeltas: FactorDelta[];
  verdict: "iyilesti" | "kotulesti" | "degismedi";
  unlockedHardFails: string[]; // önce vardı, sonra yok
  newHardFails: string[]; // önce yoktu, sonra var
}

function applyChanges(profile: SiteProfile, changes: WhatIfChange[]): SiteProfile {
  const next = { ...profile };
  for (const c of changes) {
    // @ts-expect-error field/value tip eşleşmesi runtime'da doğru; birleşik atama
    next[c.field] = c.value;
  }
  return next;
}

/** Bir ürün için baz profil ile değiştirilmiş profili karşılaştırır. */
export function runWhatIf(baseProfile: SiteProfile, changes: WhatIfChange[], cropId: string): WhatIfResult {
  const crop = CROP_BY_ID[cropId];
  if (!crop) throw new Error(`Bilinmeyen ürün: ${cropId}`);

  const before = assessCrop(crop, baseProfile);
  const after = assessCrop(crop, applyChanges(baseProfile, changes));

  const factorDeltas: FactorDelta[] = before.factors.map((bf) => {
    const af = after.factors.find((f) => f.key === bf.key);
    const afterScore = af?.score ?? bf.score;
    return { factorKey: bf.key, label: bf.label, beforeScore: bf.score, afterScore, delta: afterScore - bf.score };
  });

  const scoreDelta = after.totalScore - before.totalScore;
  const confidenceDelta = Math.round((after.confidence - before.confidence) * 1000) / 1000;

  const beforeRules = new Set(before.hardFails.map((h) => h.rule));
  const afterRules = new Set(after.hardFails.map((h) => h.rule));
  const unlockedHardFails = [...beforeRules].filter((r) => !afterRules.has(r));
  const newHardFails = [...afterRules].filter((r) => !beforeRules.has(r));

  // Uygunluk durumu değişimi verdict'i belirler; eşitse skora bakılır
  let verdict: WhatIfResult["verdict"] = "degismedi";
  if (!before.eligible && after.eligible) verdict = "iyilesti";
  else if (before.eligible && !after.eligible) verdict = "kotulesti";
  else if (scoreDelta > 0) verdict = "iyilesti";
  else if (scoreDelta < 0) verdict = "kotulesti";

  return { before, after, scoreDelta, confidenceDelta, factorDeltas, verdict, unlockedHardFails, newHardFails };
}
