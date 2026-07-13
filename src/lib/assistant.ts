// SmartGrowth OS — Kaynak gösteren AI asistan motoru v1 (PRD §9.12, 03-TEKNIK-MIMARI §9)
// Kural-tabanlı eşleştirme; gerçek bir LLM çağrısı YAPMAZ. "Kaynakta bulunmayan kritik
// iddia" üretmez — yalnız data katmanındaki gerçek kayıtlardan alıntı yapar.
// Yüksek risklidoz/tıbbi iddia soruları güvenlik filtresinden geçer, asistan cevap vermez.

import { CROPS, EVIDENCE_LABELS, type Crop } from "@/data/crops";
import { MICROGREEN_RECIPES, BLOCKED_MICROGREENS, type MicrogreenRecipe } from "@/data/microgreens";
import { CHANNELS } from "@/data/commerce";

export type ConfidenceLevel = "yuksek" | "orta" | "dusuk";

export interface Citation {
  title: string;
  org: string;
  year: number;
}

export interface AssistantAnswer {
  query: string;
  safetyBlocked: boolean;
  safetyReason?: string;
  matchedCrop?: string;
  matchedMicrogreen?: string;
  answer: string;
  citations: Citation[];
  confidence: ConfidenceLevel;
  suggestedAction: string;
}

// ---------- Güvenlik filtresi (06-MEVZUAT-GIDA-GUVENLIGI §10-11, PRD FR-193) ----------
// Pestisit dozu, sağlık/tıbbi iddia ve tehlikeli yöntem sorularında asistan doğrudan
// cevap üretmez; uzman/yetkili kaynağa yönlendirir.
const PESTICIDE_DOSE_PATTERNS = [/\bdoz\b/i, /ka[çc]\s*ml/i, /ilaçlama/i, /pestisit/i, /ilaç\s*(oran|miktar)/i];
const MEDICAL_CLAIM_PATTERNS = [
  /tedavi eder/i,
  /hastalığı önler/i,
  /ilaç yerine/i,
  /kanseri (önler|tedavi)/i,
  /şifa/i,
  /iyileştirir mi/i,
];

export type SafetyBlockCategory = "girdi-dozu" | "tibbi-iddia";

/**
 * Bir sorgunun hangi güvenlik kategorisine girdiğini döner (checkSafety ile aynı desenler).
 * Dışa açık — uzman danışma akışı (expertConsult.ts) bloklanan bir soru için sensible bir
 * uzmanlık alanı önerebilsin diye.
 */
export function classifySafetyBlock(query: string): SafetyBlockCategory | undefined {
  if (PESTICIDE_DOSE_PATTERNS.some((p) => p.test(query))) return "girdi-dozu";
  if (MEDICAL_CLAIM_PATTERNS.some((p) => p.test(query))) return "tibbi-iddia";
  return undefined;
}

function checkSafety(query: string): { blocked: boolean; reason?: string } {
  const category = classifySafetyBlock(query);
  if (category === "girdi-dozu") {
    return {
      blocked: true,
      reason:
        "Pestisit/girdi dozu ülke ve ürüne göre resmi olarak doğrulanmadan önerilemez. Etikette veya yetkili kaynakta olmayan doz/karışım AI tarafından üretilmez.",
    };
  }
  if (category === "tibbi-iddia") {
    return {
      blocked: true,
      reason:
        "Tıbbi/sağlık iddiası içeren sorular yanıtlanmaz. Besin içeriği bilgisi kaynağa dayanır ama tedavi/önleme iddiasına çevrilmez.",
    };
  }
  return { blocked: false };
}

// ---------- Eşleştirme ----------
function findCrop(query: string): Crop | undefined {
  const q = query.toLocaleLowerCase("tr-TR");
  return CROPS.find(
    (c) =>
      q.includes(c.name.toLocaleLowerCase("tr-TR")) ||
      q.includes(c.scientificName.toLocaleLowerCase("tr-TR").split(" ")[0])
  );
}

function findMicrogreen(query: string): MicrogreenRecipe | undefined {
  const q = query.toLocaleLowerCase("tr-TR");
  return MICROGREEN_RECIPES.find((r) => q.includes(r.name.toLocaleLowerCase("tr-TR")));
}

function findBlockedMicrogreen(query: string): { name: string; family: string; reason: string } | undefined {
  const q = query.toLocaleLowerCase("tr-TR");
  return BLOCKED_MICROGREENS.find((b) => q.includes(b.name.toLocaleLowerCase("tr-TR")));
}

const INTENT = {
  microgreen: /mikro\s*filiz|filiz/i,
  satis: /sat|pazar|etsy|kanal|komisyon|ücret/i,
  hastalik: /hastalık|leke|küf|zararlı|böcek/i,
};

// ---------- Ana fonksiyon ----------
export function askAssistant(rawQuery: string): AssistantAnswer {
  const query = rawQuery.trim();

  if (!query) {
    return {
      query,
      safetyBlocked: false,
      answer: "Bir soru yazmadın. Örneğin: \"Balkonda domates yetişir mi?\" ya da \"Bezelye filizi kaç günde hasat olur?\"",
      citations: [],
      confidence: "dusuk",
      suggestedAction: "Bir ürün adı veya konu belirterek tekrar sor.",
    };
  }

  const safety = checkSafety(query);
  if (safety.blocked) {
    return {
      query,
      safetyBlocked: true,
      safetyReason: safety.reason,
      answer: safety.reason ?? "Bu soru güvenlik filtresinden geçemedi.",
      citations: [],
      confidence: "dusuk",
      suggestedAction: "Uzman danışmanlığı talep et veya yetkili/resmi kaynağa başvur.",
    };
  }

  // Mikro filizde bloklu tür sorgusu
  const blockedMicro = findBlockedMicrogreen(query);
  if (blockedMicro && INTENT.microgreen.test(query)) {
    return {
      query,
      safetyBlocked: false,
      answer: `${blockedMicro.name}, ${blockedMicro.family} familyasında olduğu için mikro filiz üretimine uygun değildir. Gerekçe: ${blockedMicro.reason}`,
      citations: [{ title: "Mikro Filiz Güvenlik Kataloğu", org: "SmartGrowth Uyum Kuralları", year: 2026 }],
      confidence: "yuksek",
      suggestedAction: "Alternatif mikro filiz türü sor (ör. brokoli, turp, bezelye).",
    };
  }

  const microgreen = findMicrogreen(query);
  if (microgreen) {
    const [dLow, dHigh] = microgreen.harvestDays;
    const [yLow, yHigh] = microgreen.expectedYieldG;
    return {
      query,
      safetyBlocked: false,
      matchedMicrogreen: microgreen.id,
      answer: `${microgreen.name} (${microgreen.scientificName}) genellikle ${dLow}-${dHigh} günde hasada gelir; tepsi başına beklenen verim ${yLow}-${yHigh} g aralığındadır. Zorluk: ${
        ["kolay", "orta", "zor"][microgreen.difficulty - 1]
      }. ${microgreen.note}`,
      citations: [
        { title: "Grow Your Own Microgreens", org: "Utah State University Extension", year: 2023 },
        { title: "Ensuring Food Safety in Microgreens Production", org: "Penn State Extension", year: 2025 },
      ],
      confidence: microgreen.evidence === "A" || microgreen.evidence === "B" ? "yuksek" : "orta",
      suggestedAction: "Tepsi maliyet hesaplayıcısında bu reçeteyi seçerek marjını hesapla (/mikrofiliz).",
    };
  }

  const crop = findCrop(query);
  if (crop) {
    const parts: string[] = [
      `${crop.name} (${crop.scientificName}) için optimum sıcaklık ${crop.tempC.optLow}-${crop.tempC.optHigh}°C, günde en az ${crop.sunMinHours} saat güneş ister.`,
    ];
    if (INTENT.hastalik.test(query)) {
      parts.push(
        `Hastalık/zararlı direnci: ${["düşük", "orta", "yüksek"][crop.pestResilience - 1]}. Kesin teşhis için fotoğraflı gözlem + uzman eskalasyonu önerilir; AI tek başına kesin tanı koymaz.`
      );
    } else {
      parts.push(`İlk hasat ${crop.daysToHarvest[0]}-${crop.daysToHarvest[1]} günde beklenir; ${crop.tips[0]}`);
    }
    return {
      query,
      safetyBlocked: false,
      matchedCrop: crop.id,
      answer: parts.join(" "),
      citations: [{ title: crop.source.title, org: crop.source.org, year: crop.source.year }],
      confidence: crop.evidence === "A" || crop.evidence === "B" ? "yuksek" : "orta",
      suggestedAction: `Konumuna göre tam uygunluk skoru ve güven düzeyi için /plan sihirbazını kullan.`,
    };
  }

  if (INTENT.satis.test(query)) {
    const names = CHANNELS.map((c) => c.name.replace("SmartGrowth ", "")).join(", ");
    return {
      query,
      safetyBlocked: false,
      answer: `Satış için dört kanal var: ${names}. Her kanalın ücreti ayrı gösterilir; Etsy'de başlayan işlem platform dışına yönlendirilmez.`,
      citations: [{ title: "Ticaret ve Kanal Merkezi", org: "SmartGrowth Monetizasyon Modeli", year: 2026 }],
      confidence: "yuksek",
      suggestedAction: "Ücret simülatörünü dene (/pazar).",
    };
  }

  return {
    query,
    safetyBlocked: false,
    answer:
      "Bu soruyu bilgi grafiğimizdeki bir ürün, mikro filiz türü veya satış kanalıyla eşleştiremedim. Kaynağı olmayan bir cevap uydurmak yerine açıkça söylüyorum: veri boşluğu var.",
    citations: [],
    confidence: "dusuk",
    suggestedAction: "Ürün kâşifinde (/urunler) tam listeye bakabilir veya soruyu bir ürün adıyla tekrar sorabilirsin.",
  };
}

export const EXAMPLE_QUESTIONS = [
  "Balkonda cherry domates yetişir mi?",
  "Bezelye filizi kaç günde hasat olur?",
  "Fesleğende yaprak lekesi görüyorum, ne yapmalıyım?",
  "Etsy'de satış yaparken hangi ücretler kesilir?",
  "Domates mikro filiz olarak yetiştirilebilir mi?",
];

export { EVIDENCE_LABELS };
