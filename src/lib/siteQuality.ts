// SmartGrowth OS — Alan veri kalite skoru v1 (PRD FR-025, 03-TEKNIK-MIMARI §6.2, P03-11)
// "Veri güncelliği ve eksik alan göstergesi": eksik VE bayat veri ayrı ayrı işaretlenir.
// Skor tek başına "iyi/kötü" demez — hangi alanın eksik/bayat olduğunu açıkça listeler.

export interface SoilTest {
  ph: number;
  ec: number;
  organicMatterPct: number;
  sampledAt: string; // ISO tarih (YYYY-MM-DD)
}

export interface WaterTest {
  qualityOk: boolean;
  testedAt: string; // ISO tarih
}

export interface SiteProfile {
  id: string;
  name: string;
  areaM2: number;
  sunHoursObserved?: number;
  soilTest?: SoilTest;
  waterTest?: WaterTest;
  exactLocationKnown: boolean;
}

export type DataQualityGrade = "yuksek" | "orta" | "dusuk";

export interface FieldIssue {
  field: string;
  kind: "eksik" | "bayat";
  detail: string;
}

export interface DataQualityResult {
  score: number; // 0-100
  grade: DataQualityGrade;
  issues: FieldIssue[];
}

const STALE_MONTHS_THRESHOLD = 12;

function monthsBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00Z");
  const to = new Date(toISO + "T00:00:00Z");
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

/**
 * Bir alan profilinin veri kalite skorunu hesaplar. `nowISO` dışarıdan verilir
 * (deterministik/test edilebilir) — sistem saatine örtük bağımlılık yoktur.
 */
export function computeDataQuality(profile: SiteProfile, nowISO: string): DataQualityResult {
  const issues: FieldIssue[] = [];
  let score = 100;

  if (profile.sunHoursObserved === undefined) {
    issues.push({ field: "sunHoursObserved", kind: "eksik", detail: "Güneş saati gözlemi girilmemiş" });
    score -= 15;
  }

  if (!profile.soilTest) {
    issues.push({ field: "soilTest", kind: "eksik", detail: "Toprak testi yok — küresel varsayım kullanılıyor" });
    score -= 25;
  } else {
    const age = monthsBetween(profile.soilTest.sampledAt, nowISO);
    if (age > STALE_MONTHS_THRESHOLD) {
      issues.push({ field: "soilTest", kind: "bayat", detail: `Toprak testi ${age} ay önce yapılmış — yenilenmesi önerilir` });
      score -= 12;
    }
  }

  if (!profile.waterTest) {
    issues.push({ field: "waterTest", kind: "eksik", detail: "Su testi yok" });
    score -= 20;
  } else {
    const age = monthsBetween(profile.waterTest.testedAt, nowISO);
    if (age > STALE_MONTHS_THRESHOLD) {
      issues.push({ field: "waterTest", kind: "bayat", detail: `Su testi ${age} ay önce yapılmış — yenilenmesi önerilir` });
      score -= 10;
    }
  }

  if (!profile.exactLocationKnown) {
    issues.push({ field: "exactLocationKnown", kind: "eksik", detail: "Tam konum girilmemiş — bölge normali kullanılıyor" });
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));
  const grade: DataQualityGrade = score >= 80 ? "yuksek" : score >= 50 ? "orta" : "dusuk";

  return { score, grade, issues };
}

export const GRADE_LABELS: Record<DataQualityGrade, string> = {
  yuksek: "Yüksek veri kalitesi",
  orta: "Orta veri kalitesi",
  dusuk: "Düşük veri kalitesi",
};
