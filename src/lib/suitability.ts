// SmartGrowth OS — Uygunluk ve senaryo motoru v1 (03-TEKNIK-MIMARI §7)
// Sert kısıt ihlali eleme + çok ölçütlü skor + AYRI güven hesabı.
// "Sahte kesinlik yok": güven, uygunluk skoruna karıştırılmaz; veri boşlukları açıkça listelenir.

import {
  CROPS,
  type Crop,
  type GrowMethod,
  type Season,
} from "@/data/crops";

export const ENGINE_VERSION = "suitability-v1.0.0";

// ---------- Türkiye iklim üretim bölgeleri (7 bölge — Dalga 1) ----------

export type ClimateZoneId =
  | "marmara"
  | "ege"
  | "akdeniz"
  | "ic-anadolu"
  | "karadeniz"
  | "dogu-anadolu"
  | "guneydogu";

export interface ClimateZone {
  id: ClimateZoneId;
  name: string;
  // Mevsim ortalama gündüz sıcaklıkları (°C) — bölgesel normal, parsel ölçümü DEĞİL
  seasonTempC: Record<Season, [number, number]>;
  lastFrost: string; // yaklaşık son don
  firstFrost: string;
  humidity: "dusuk" | "orta" | "yuksek";
  note: string;
}

export const CLIMATE_ZONES: Record<ClimateZoneId, ClimateZone> = {
  marmara: {
    id: "marmara",
    name: "Marmara",
    seasonTempC: { ilkbahar: [12, 20], yaz: [23, 30], sonbahar: [12, 20], kis: [4, 10] },
    lastFrost: "Mart sonu",
    firstFrost: "Kasım ortası",
    humidity: "orta",
    note: "Geçiş iklimi; ilkbahar ve sonbahar pencereleri geniştir.",
  },
  ege: {
    id: "ege",
    name: "Ege",
    seasonTempC: { ilkbahar: [14, 22], yaz: [26, 34], sonbahar: [14, 22], kis: [6, 13] },
    lastFrost: "Mart başı",
    firstFrost: "Aralık başı",
    humidity: "orta",
    note: "Uzun sezon; yaz sıcağında gölgeleme gerekebilir.",
  },
  akdeniz: {
    id: "akdeniz",
    name: "Akdeniz",
    seasonTempC: { ilkbahar: [15, 23], yaz: [27, 35], sonbahar: [16, 24], kis: [8, 16] },
    lastFrost: "Şubat sonu",
    firstFrost: "Aralık sonu",
    humidity: "yuksek",
    note: "Kış üretimi mümkün; yaz aşırı sıcağı serin sezon ürünlerini zorlar.",
  },
  "ic-anadolu": {
    id: "ic-anadolu",
    name: "İç Anadolu",
    seasonTempC: { ilkbahar: [8, 17], yaz: [20, 30], sonbahar: [8, 16], kis: [-4, 4] },
    lastFrost: "Nisan sonu",
    firstFrost: "Ekim ortası",
    humidity: "dusuk",
    note: "Don penceresi geniş; gece-gündüz farkı yüksek.",
  },
  karadeniz: {
    id: "karadeniz",
    name: "Karadeniz",
    seasonTempC: { ilkbahar: [10, 17], yaz: [20, 27], sonbahar: [11, 18], kis: [4, 10] },
    lastFrost: "Nisan başı",
    firstFrost: "Kasım başı",
    humidity: "yuksek",
    note: "Yüksek nem mantari hastalık baskısını artırır; havalandırma önemli.",
  },
  "dogu-anadolu": {
    id: "dogu-anadolu",
    name: "Doğu Anadolu",
    seasonTempC: { ilkbahar: [5, 14], yaz: [17, 27], sonbahar: [4, 13], kis: [-10, -1] },
    lastFrost: "Mayıs ortası",
    firstFrost: "Eylül sonu",
    humidity: "dusuk",
    note: "Kısa sezon; erkenci çeşit ve korumalı üretim öne çıkar.",
  },
  guneydogu: {
    id: "guneydogu",
    name: "Güneydoğu Anadolu",
    seasonTempC: { ilkbahar: [14, 24], yaz: [28, 38], sonbahar: [14, 24], kis: [3, 10] },
    lastFrost: "Mart ortası",
    firstFrost: "Kasım ortası",
    humidity: "dusuk",
    note: "Yaz aşırı sıcak ve kurak; su yönetimi kritik.",
  },
};

export const CITY_TO_ZONE: Record<string, ClimateZoneId> = {
  İstanbul: "marmara",
  Bursa: "marmara",
  Kocaeli: "marmara",
  Edirne: "marmara",
  İzmir: "ege",
  Aydın: "ege",
  Muğla: "ege",
  Denizli: "ege",
  Antalya: "akdeniz",
  Mersin: "akdeniz",
  Adana: "akdeniz",
  Hatay: "akdeniz",
  Ankara: "ic-anadolu",
  Konya: "ic-anadolu",
  Kayseri: "ic-anadolu",
  Eskişehir: "ic-anadolu",
  Samsun: "karadeniz",
  Trabzon: "karadeniz",
  Rize: "karadeniz",
  Ordu: "karadeniz",
  Erzurum: "dogu-anadolu",
  Kars: "dogu-anadolu",
  Van: "dogu-anadolu",
  Malatya: "dogu-anadolu",
  Gaziantep: "guneydogu",
  Şanlıurfa: "guneydogu",
  Diyarbakır: "guneydogu",
  Mardin: "guneydogu",
};

export const CITIES = Object.keys(CITY_TO_ZONE);

// ---------- Girdi profili ----------

export type Goal = "oz-tuketim" | "ogrenme" | "gelir" | "az-bakim";

export interface SiteProfile {
  city: string;
  method: GrowMethod;
  areaM2: number;
  sunHours: number; // kullanıcı gözlemi
  containerL?: number; // saksı yönteminde tipik kap hacmi
  waterAccess: 1 | 2 | 3; // 1 kısıtlı · 2 orta · 3 rahat
  weeklyMinutes: number; // ayrılabilen bakım süresi
  experience: 1 | 2 | 3; // 1 yeni · 2 orta · 3 deneyimli
  goal: Goal;
  hasKidsOrPets: boolean;
  season: Season;
  soilPh?: number; // ölçülmediyse undefined → güven düşer
}

export const GOAL_LABELS: Record<Goal, string> = {
  "oz-tuketim": "Aile için üretim",
  ogrenme: "Öğrenmek ve denemek",
  gelir: "Gelir / satış",
  "az-bakim": "Az bakımla yeşillik",
};

// ---------- Sonuç modeli ----------

export interface FactorScore {
  key: string;
  label: string;
  weight: number;
  score: number; // 0–100
  detail: string;
}

export interface HardFail {
  rule: string;
  detail: string;
  remedy: string; // giderilebilirlik açıklaması (PRD FR-045)
}

export interface ConfidenceFactor {
  key: string;
  label: string;
  value: number; // 0–1
  detail: string;
}

export interface CandidateResult {
  crop: Crop;
  eligible: boolean;
  hardFails: HardFail[];
  totalScore: number; // 0–100
  factors: FactorScore[];
  confidence: number; // 0–1 — uygunluktan AYRI
  confidenceLevel: "dusuk" | "orta" | "yuksek";
  confidenceFactors: ConfidenceFactor[];
  reasons: string[]; // neden önerildi
  cautions: string[]; // dikkat noktaları
  dataGaps: string[]; // değerli bilgi soruları
  yieldRange: { pessimist: number; expected: number; optimist: number }; // kg, alan bazlı
  firstHarvestDays: [number, number];
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  crops: CandidateResult[];
  weeklyCareMin: number;
  firstHarvestDays: number;
  riskNote: string;
  fitGoal: Goal[];
}

export interface AssessmentResult {
  engineVersion: string;
  zone: ClimateZone;
  candidates: CandidateResult[]; // uygun olanlar, skora göre
  excluded: CandidateResult[]; // sert kısıtla elenenler
  scenarios: Scenario[];
  globalGaps: string[];
}

// ---------- Yardımcılar ----------

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

/** Bir değerin [min, optLow, optHigh, max] zarfına 0–100 uyumu */
function envelopeScore(v: number, min: number, optLow: number, optHigh: number, max: number): number {
  if (v <= min || v >= max) return 0;
  if (v >= optLow && v <= optHigh) return 100;
  if (v < optLow) return clamp(((v - min) / (optLow - min)) * 100);
  return clamp(((max - v) / (max - optHigh)) * 100);
}

// ---------- Motor ----------

export function assessCrop(crop: Crop, p: SiteProfile): CandidateResult {
  const zone = CLIMATE_ZONES[CITY_TO_ZONE[p.city] ?? "marmara"];
  const [seasonLow, seasonHigh] = zone.seasonTempC[p.season];
  const seasonMid = (seasonLow + seasonHigh) / 2;

  const hardFails: HardFail[] = [];

  // --- Sert kısıtlar (03-TEKNIK-MIMARI §7.2) ---
  if (!crop.methods.includes(p.method)) {
    hardFails.push({
      rule: "Yöntem uyumsuz",
      detail: `${crop.name} bu üretim yöntemi için profillenmemiş.`,
      remedy: "Farklı bir yöntem seçin veya bu ürünün uygun yöntem varyantını inceleyin.",
    });
  }
  if (p.sunHours < crop.sunMinHours) {
    hardFails.push({
      rule: "Yetersiz güneş",
      detail: `Günde en az ${crop.sunMinHours} saat güneş gerekir; alanınızda ${p.sunHours} saat gözlendi.`,
      remedy: "Daha güneşli bir konum seçin veya gölgeye toleranslı yapraklı ürünlere yönelin.",
    });
  }
  if (p.method === "saksi" && crop.minContainerL && (p.containerL ?? 0) < crop.minContainerL) {
    hardFails.push({
      rule: "Kök hacmi yetersiz",
      detail: `En az ${crop.minContainerL} L kap gerekir; mevcut kap ${p.containerL ?? 0} L.`,
      remedy: `${crop.minContainerL} L ve üzeri saksı edinin veya daha küçük kök hacimli ürün seçin.`,
    });
  }
  if (!crop.plantingSeasons.includes(p.season) && p.method !== "sera") {
    hardFails.push({
      rule: "Sezon penceresi kapalı",
      detail: `${crop.name} bu bölgede ${p.season} ekim penceresinde değil.`,
      remedy: "Uygun sezonu bekleyin veya korumalı (sera/tünel) üretim değerlendirin.",
    });
  }
  if (!crop.frostTolerant && p.method !== "sera" && seasonLow < crop.tempC.min) {
    hardFails.push({
      rule: "Don / düşük sıcaklık riski",
      detail: `Bölgesel ${p.season} alt sıcaklığı ${seasonLow} °C; tür minimumu ${crop.tempC.min} °C.`,
      remedy: `${zone.lastFrost} sonrasını bekleyin veya korumalı üretim kullanın.`,
    });
  }

  // --- Alt skorlar ---
  const effTempScore =
    p.method === "sera"
      ? envelopeScore(
          Math.max(seasonMid + 4, crop.tempC.optLow),
          crop.tempC.min, crop.tempC.optLow, crop.tempC.optHigh, crop.tempC.max
        )
      : envelopeScore(seasonMid, crop.tempC.min, crop.tempC.optLow, crop.tempC.optHigh, crop.tempC.max);

  const humidityPenalty =
    zone.humidity === "yuksek" && crop.pestResilience === 1 ? 12 : 0;

  const climate = clamp(effTempScore - humidityPenalty);

  const soil =
    p.soilPh !== undefined
      ? envelopeScore(p.soilPh, crop.ph.min, crop.ph.optLow, crop.ph.optHigh, crop.ph.max)
      : 62; // bölgesel varsayım — güven tarafında ayrıca düşülür

  const water = clamp(100 - Math.max(0, crop.waterNeed - p.waterAccess) * 38);

  const methodFit = crop.methods[0] === p.method ? 95 : crop.methods.includes(p.method) ? 82 : 0;

  const careCapacity = p.weeklyMinutes / 60; // saat
  const careNeed = crop.careLoad * 0.9; // kaba saat/hafta
  const expBonus = (p.experience - 1) * 8;
  const operational = clamp(
    (careCapacity >= careNeed ? 85 : 85 - (careNeed - careCapacity) * 30) +
      expBonus +
      (crop.beginnerFriendly && p.experience === 1 ? 8 : 0)
  );

  const pest = crop.pestResilience * 30 + 10;

  const market =
    p.goal === "gelir"
      ? crop.marketDemand * 30 + 5
      : 60; // talep hedefi yoksa nötr davranış (FR-053/PRD)

  const sustainability = crop.sustainability * 30 + 5;

  const factors: FactorScore[] = [
    { key: "climate", label: "İklim", weight: 0.23, score: Math.round(climate), detail: `${zone.name} ${p.season} normali ${seasonLow}–${seasonHigh} °C · tür optimumu ${crop.tempC.optLow}–${crop.tempC.optHigh} °C` },
    { key: "soil", label: "Toprak", weight: 0.18, score: Math.round(soil), detail: p.soilPh !== undefined ? `Ölçülen pH ${p.soilPh} · tür optimumu ${crop.ph.optLow}–${crop.ph.optHigh}` : "pH ölçülmedi — bölgesel varsayım kullanıldı" },
    { key: "water", label: "Su", weight: 0.10, score: Math.round(water), detail: `Su ihtiyacı ${["düşük", "orta", "yüksek"][crop.waterNeed - 1]} · erişiminiz ${["kısıtlı", "orta", "rahat"][p.waterAccess - 1]}` },
    { key: "method", label: "Yöntem uyumu", weight: 0.11, score: Math.round(methodFit), detail: `Seçilen yöntem: ${p.method}` },
    { key: "operational", label: "Operasyon", weight: 0.10, score: Math.round(operational), detail: `~${careNeed.toFixed(1)} sa/hafta bakım · ayırdığınız ${(careCapacity).toFixed(1)} sa` },
    { key: "pest", label: "Hastalık direnci", weight: 0.10, score: Math.round(pest), detail: `Tür direnci: ${["düşük", "orta", "yüksek"][crop.pestResilience - 1]}` },
    { key: "market", label: "Pazar", weight: 0.10, score: Math.round(market), detail: p.goal === "gelir" ? `Yerel talep: ${["düşük", "orta", "yüksek"][crop.marketDemand - 1]}` : "Gelir hedefi seçilmedi — nötr puan" },
    { key: "sustainability", label: "Sürdürülebilirlik", weight: 0.08, score: Math.round(sustainability), detail: "Su ayak izi, girdi yükü ve döngü uzunluğu" },
  ];

  const totalScore = Math.round(
    factors.reduce((acc, f) => acc + f.weight * f.score, 0)
  );

  // --- Güven (uygunluktan ayrı; çarpımsal model §7.4) ---
  const evidenceCoverage = { A: 0.95, B: 0.85, C: 0.72, D: 0.6, E: 0.5 }[crop.evidence];
  const confidenceFactors: ConfidenceFactor[] = [
    { key: "source_coverage", label: "Kaynak kapsaması", value: evidenceCoverage, detail: `Kanıt seviyesi ${crop.evidence} · ${crop.source.org} (${crop.source.year})` },
    { key: "spatial", label: "Mekânsal uygunluk", value: 0.82, detail: "Bölgesel iklim normali — parsel ölçümü değil" },
    { key: "temporal", label: "Veri tazeliği", value: 0.9, detail: `Kaynak ${crop.source.year} sürümü` },
    { key: "measurement", label: "Ölçüm kalitesi", value: p.soilPh !== undefined ? 0.92 : 0.68, detail: p.soilPh !== undefined ? "Yerel pH ölçümü mevcut" : "Toprak testi yok — varsayım kullanıldı" },
    { key: "cultivar", label: "Çeşit özgüllüğü", value: 0.85, detail: crop.cultivarNote },
    { key: "calibration", label: "Model kalibrasyonu", value: 0.8, detail: "v1 kural motoru — saha geri bildirimiyle kalibre edilecek" },
  ];
  const confidence = confidenceFactors.reduce((acc, f) => acc * f.value, 1);
  const confidenceLevel = confidence >= 0.5 ? "yuksek" : confidence >= 0.32 ? "orta" : "dusuk";

  // --- Açıklama ---
  const sorted = [...factors].sort((a, b) => b.score - a.score);
  const reasons = sorted
    .filter((f) => f.score >= 75)
    .slice(0, 3)
    .map((f) => `${f.label}: ${f.detail}`);
  const cautions = sorted
    .filter((f) => f.score < 55)
    .map((f) => `${f.label} düşük — ${f.detail}`);
  if (crop.petCaution && p.hasKidsOrPets) {
    cautions.push("Evcil hayvan/çocuk notu: yaprak ve olgunlaşmamış kısımlar için temkin gerekir; erişimi sınırlayın.");
  }

  const dataGaps: string[] = [];
  if (p.soilPh === undefined) dataGaps.push("Toprak pH testi yapın (≈ ucuz kit) — toprak skoru varsayımla hesaplandı.");
  if (p.sunHours === crop.sunMinHours) dataGaps.push("Güneş süresi sınırda — bir hafta boyunca saatlik gölge gözlemi önerilir.");

  // --- Verim aralığı: iyimser/beklenen/temkinli (§7.5) ---
  const usable = Math.max(p.areaM2 * 0.8, 0.2);
  const [yLow, yHigh] = crop.yieldPerM2Kg;
  const quality = totalScore / 100;
  const expected = usable * (yLow + (yHigh - yLow) * quality);
  const yieldRange = {
    pessimist: Math.round(expected * 0.55 * 10) / 10,
    expected: Math.round(expected * 10) / 10,
    optimist: Math.round(usable * yHigh * 10) / 10,
  };

  return {
    crop,
    eligible: hardFails.length === 0,
    hardFails,
    totalScore,
    factors,
    confidence,
    confidenceLevel,
    confidenceFactors,
    reasons,
    cautions,
    dataGaps,
    yieldRange,
    firstHarvestDays: crop.daysToHarvest,
  };
}

export function runAssessment(p: SiteProfile): AssessmentResult {
  const zone = CLIMATE_ZONES[CITY_TO_ZONE[p.city] ?? "marmara"];
  const results = CROPS.map((c) => assessCrop(c, p));
  const candidates = results
    .filter((r) => r.eligible)
    .sort((a, b) => b.totalScore - a.totalScore);
  const excluded = results.filter((r) => !r.eligible);

  const globalGaps: string[] = [];
  if (p.soilPh === undefined)
    globalGaps.push("Toprak pH'ı ölçülmedi. Plan orta güvenle ilerleyebilir; test sonrası öneriler yeniden puanlanır.");
  globalGaps.push(`İklim verisi ${zone.name} bölge normalidir; parsel/balkon mikroklima ölçümü güveni yükseltir.`);

  // --- 3 senaryo (J01: düşük bakım · aile hasadı · öğrenme) ---
  const lowCare = candidates.filter((r) => r.crop.careLoad === 1).slice(0, 4);
  const family = pickFamilyMix(candidates);
  const learning = pickLearningMix(candidates);

  const scenarioDefs: Scenario[] = [
    {
      id: "dusuk-bakim",
      title: "Düşük bakım",
      tagline: "Aromatik + yapraklı ardışık ekim — haftada 1-2 saat",
      crops: lowCare,
      weeklyCareMin: lowCare.reduce((a, r) => a + r.crop.careLoad * 25, 0),
      firstHarvestDays: Math.min(...lowCare.map((r) => r.firstHarvestDays[0]), 99),
      riskNote: "Düşük risk: kısa döngüler hatayı erken gösterir, kayıp sınırlı kalır.",
      fitGoal: ["az-bakim", "oz-tuketim"],
    },
    {
      id: "aile-hasadi",
      title: "Aile hasadı",
      tagline: "Meyveli sebze + yapraklı karışım — düzenli sofra ürünü",
      crops: family,
      weeklyCareMin: family.reduce((a, r) => a + r.crop.careLoad * 25, 0),
      firstHarvestDays: Math.min(...family.map((r) => r.firstHarvestDays[0]), 99),
      riskNote: "Orta risk: meyveli türler su ve sıcaklık dalgalanmasına duyarlıdır.",
      fitGoal: ["oz-tuketim", "gelir"],
    },
    {
      id: "ogrenme",
      title: "Öğrenme deneyi",
      tagline: "Üç küçük kontrollü deneme — sonuç kaydıyla",
      crops: learning,
      weeklyCareMin: learning.reduce((a, r) => a + r.crop.careLoad * 20, 0),
      firstHarvestDays: Math.min(...learning.map((r) => r.firstHarvestDays[0]), 99),
      riskNote: "Deneysel: amaç verim değil, alanınızın gerçek performans verisini toplamak.",
      fitGoal: ["ogrenme"],
    },
  ];
  const scenarios = scenarioDefs.filter((s) => s.crops.length > 0);

  return { engineVersion: ENGINE_VERSION, zone, candidates, excluded, scenarios, globalGaps };
}

function pickFamilyMix(candidates: CandidateResult[]): CandidateResult[] {
  const fruity = candidates.find((r) => r.crop.category === "meyveli-sebze");
  const leafy = candidates.filter((r) => r.crop.category === "yaprakli").slice(0, 2);
  const herb = candidates.find((r) => r.crop.category === "aromatik");
  return [fruity, ...leafy, herb].filter(Boolean) as CandidateResult[];
}

function pickLearningMix(candidates: CandidateResult[]): CandidateResult[] {
  const fast = [...candidates].sort(
    (a, b) => a.firstHarvestDays[0] - b.firstHarvestDays[0]
  );
  const seen = new Set<string>();
  const mix: CandidateResult[] = [];
  for (const r of fast) {
    if (!seen.has(r.crop.category)) {
      mix.push(r);
      seen.add(r.crop.category);
    }
    if (mix.length === 3) break;
  }
  return mix;
}
