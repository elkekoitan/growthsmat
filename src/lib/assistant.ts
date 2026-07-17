// SmartGrowth OS — Kaynak gösteren AI asistan motoru v1 (PRD §9.12, 03-TEKNIK-MIMARI §9)
// Kural-tabanlı eşleştirme; gerçek bir LLM çağrısı YAPMAZ. "Kaynakta bulunmayan kritik
// iddia" üretmez — yalnız data katmanındaki gerçek kayıtlardan alıntı yapar.
// Yüksek risklidoz/tıbbi iddia soruları güvenlik filtresinden geçer, asistan cevap vermez.

import { CROPS, CROP_BY_ID, EVIDENCE_LABELS, type Crop } from "@/data/crops";
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

// ---------- Kişisel bağlam (Bahçem + Görevler) ----------
// Bu modül SAF kalır: DB'ye/prisma'ya dokunmaz. Giriş yapmış kullanıcının gerçek
// bahçe/görev satırları PARAMETRE olarak girer (page.tsx server tarafında toplar).
// Her kişisel cevap bu gerçek satırlardan türetilir — uydurma yok.
export interface AssistantContextCrop {
  cropId: string;
  status: string;
  zone: string;
}

export interface AssistantContextTask {
  title: string;
  cropId: string;
  type: string;
}

export interface AssistantContext {
  crops: AssistantContextCrop[];
  tasksToday: AssistantContextTask[];
  tasksOverdue: number;
}

// Bahçem durum kodları → okunur Türkçe etiket (bkz. /bahcem STATUS_META ile uyumlu).
const CONTEXT_STATUS_LABELS: Record<string, string> = {
  planlaniyor: "planlanıyor",
  ekildi: "ekildi",
  buyuyor: "büyüyor",
  hasat: "hasada hazır",
  arsiv: "arşivde",
};

function contextStatusLabel(status: string): string {
  return CONTEXT_STATUS_LABELS[status] ?? status;
}

function contextCropName(cropId: string): string {
  return CROP_BY_ID[cropId]?.name ?? cropId;
}

const GARDEN_CITATION: Citation = { title: "Bahçem kaydın", org: "SmartGrowth Bahçem", year: 2026 };
const TASKS_CITATION: Citation = { title: "Görev takvimin", org: "SmartGrowth Görevler", year: 2026 };

const LOGIN_NOTE = "Giriş yaparsan bahçene ve görevlerine göre kişisel cevap verebilirim.";

// Kişisel niyet desenleri: kullanıcı KENDİ bahçesini/görevlerini soruyor.
const PERSONAL_INTENT = {
  garden: /bah[çc]em|ürünlerim|urunlerim|neler ekili/i,
  today: /bug[üu]n/i,
  // "ne iş" kalıbı eklendi (2026-07-17, altın set bulgusu): "Bugün ne iş var?" yalın "iş"
  // kelimesiyle sorulur — yalnız "işler/işim" çekimleri yetmiyordu. DİKKAT: JS \b ASCII
  // tabanlıdır, "ş"den sonra kelime sınırı ÜRETMEZ (\bi[şs]\b asla eşleşmez) — bu yüzden
  // sınır yerine "ne " öneki kullanılır.
  todayTopic: /ne\s+yap|yapmal[ıi]|g[öo]rev|i[şs]ler|i[şs]im|ne\s+i[şs]/i,
};

function hasGardenIntent(query: string): boolean {
  return PERSONAL_INTENT.garden.test(query);
}

function hasTodayIntent(query: string): boolean {
  return PERSONAL_INTENT.today.test(query) && PERSONAL_INTENT.todayTopic.test(query);
}

// ---------- Güvenlik filtresi (06-MEVZUAT-GIDA-GUVENLIGI §10-11, PRD FR-193) ----------
// Pestisit dozu, sağlık/tıbbi iddia ve tehlikeli yöntem sorularında asistan doğrudan
// cevap üretmez; uzman/yetkili kaynağa yönlendirir.
// 2026-07-17 genişletme (LLM gateway review bulgusu): "ne kadar ilaç atmalıyım" gibi
// doz-niyetli ama "doz/ml" kelimesi geçmeyen sorular da bloklanır. Bilinçli olarak
// muhafazakâr: "ilaç atmadan yetişir mi" gibi organik-yöntem soruları da bloklanabilir —
// yanlış-pozitifin bedeli uzmana yönlendirme, yanlış-negatifin bedeli doz önerisidir.
const PESTICIDE_DOSE_PATTERNS = [
  // \bdoz\b DEĞİL \bdoz: Türkçe ekler ("dozu", "dozda", "dozajı") kelime sınırını bozar —
  // altın set bulgusu (2026-07-17): "Bakır sülfat dozu ne olmalı?" bloklanmıyordu.
  /\bdoz/i,
  /ka[çc]\s*(ml|gram|gr|cc|litre)/i,
  /ilaçlama/i,
  /pestisit/i,
  /ilaç\s*(oran|miktar)/i,
  /ne\s*kadar\s*ilaç/i,
  /ilaç\s*at/i,
];
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
  // 1) Tam ad / bilimsel ad eşleşmesi (en güvenilir — önce bu denenir).
  const exact = CROPS.find(
    (c) =>
      q.includes(c.name.toLocaleLowerCase("tr-TR")) ||
      q.includes(c.scientificName.toLocaleLowerCase("tr-TR").split(" ")[0])
  );
  if (exact) return exact;
  // 2) Baş-isim eşleşmesi (2026-07-17, altın set bulgusu): "Yağlı Yaprak Marul"
  // kataloğdaki ad ama kullanıcı "Marul balkonda yetişir mi?" diye sorar — Türkçe
  // bileşik ürün adlarında baş isim SONDADIR. Sorgu token'ı baş isme eşitse veya
  // baş isim + kısa Türkçe ek toleransıyla başlıyorsa eşleş. BİLİNÇLİ TAKAS:
  // bu genişleme nadiren yanlış ürüne bağlanabilir (ör. katalog dışı "biberiye"
  // sorusu "Biber"e düşer) ama cevap konusunu her zaman tam adıyla söylediği için
  // yanlışlık şeffaftır; en yaygın sorgu sınıfının (yalın ürün adı) boş dönmesinden
  // daha dürüst bir davranıştır.
  const tokens = q.split(/[^a-zçğıöşüâîû]+/).filter(Boolean);
  return CROPS.find((c) => {
    const head = c.name.toLocaleLowerCase("tr-TR").split(/\s+/).pop() ?? "";
    if (head.length < 4) return false;
    return tokens.some((t) => t === head || (t.startsWith(head) && t.length <= head.length + 4));
  });
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
export function askAssistant(rawQuery: string, context?: AssistantContext | null): AssistantAnswer {
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

  // Güvenlik filtresi HER ZAMAN önce çalışır — kişiselleştirme onu bypass EDEMEZ.
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

  // ---------- Kişisel kurallar (yalnız gerçek bağlam satırlarından) ----------
  if (context && hasGardenIntent(query)) {
    if (context.crops.length === 0) {
      return {
        query,
        safetyBlocked: false,
        answer:
          "Bahçen şu an boş — henüz takip ettiğin bir ürün yok. Uydurma bir liste göstermek yerine açıkça söylüyorum: kayıt yok.",
        citations: [GARDEN_CITATION],
        confidence: "yuksek",
        suggestedAction: "Ürün kâşifinden (/urunler) bir ürün seçip \"Bahçeme ekle\" ile takibe başla.",
      };
    }
    const items = context.crops.map(
      (c) => `${contextCropName(c.cropId)} (${contextStatusLabel(c.status)}, bölge: ${c.zone})`
    );
    return {
      query,
      safetyBlocked: false,
      answer: `Bahçende ${context.crops.length} ürün takip ediyorsun: ${items.join("; ")}.`,
      citations: [GARDEN_CITATION],
      confidence: "yuksek",
      suggestedAction: "Durum güncellemek veya yeni ürün eklemek için /bahcem sayfasına git.",
    };
  }

  if (context && hasTodayIntent(query)) {
    const overdueNote =
      context.tasksOverdue > 0 ? ` Ayrıca ${context.tasksOverdue} gecikmiş açık görevin var.` : "";
    if (context.tasksToday.length === 0) {
      return {
        query,
        safetyBlocked: false,
        answer: `Bugüne planlanmış işin yok.${overdueNote}`,
        citations: [TASKS_CITATION],
        confidence: "yuksek",
        suggestedAction:
          context.tasksOverdue > 0
            ? "Gecikmiş görevleri /gorevler sayfasından tamamla veya yeniden planla."
            : "Yeni görev eklemek için /gorevler sayfasını kullan.",
      };
    }
    const shown = context.tasksToday.slice(0, 5);
    const lines = shown.map((t) => `${t.title} (${contextCropName(t.cropId)})`);
    const more = context.tasksToday.length > 5 ? ` (+${context.tasksToday.length - 5} görev daha)` : "";
    return {
      query,
      safetyBlocked: false,
      answer: `Bugün ${context.tasksToday.length} açık görevin var: ${lines.join("; ")}${more}.${overdueNote}`,
      citations: [TASKS_CITATION],
      confidence: "yuksek",
      suggestedAction: "Görevleri tamamladıkça /gorevler sayfasından işaretle.",
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

  // 2026-07-17 (altın set bulgusu): mikro filiz eşleşmesi artık NİYET kapılı —
  // "Fesleğende yaprak lekesi görüyorum" sorusu fesleğen MİKRO FİLİZ reçetesine değil
  // fesleğen ÜRÜNÜNE (hastalık cevabına) düşmeli. Bloklu tür kontrolü zaten aynı
  // kapıyı kullanıyordu; buradaki eksikti.
  const microgreen = findMicrogreen(query);
  if (microgreen && INTENT.microgreen.test(query)) {
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
    // Kişisel satır: sorulan ürün kullanıcının GERÇEK bahçesindeyse gerçek kaydı ekle.
    const citations: Citation[] = [{ title: crop.source.title, org: crop.source.org, year: crop.source.year }];
    const tracked = context?.crops.filter((c) => c.cropId === crop.id) ?? [];
    if (tracked.length > 0) {
      const own = tracked
        .map((c) => `${contextStatusLabel(c.status)} durumunda, bölge: ${c.zone}`)
        .join(" | ");
      parts.push(`Senin bahçende ${crop.name} ${own}.`);
      citations.push(GARDEN_CITATION);
    }
    return {
      query,
      safetyBlocked: false,
      matchedCrop: crop.id,
      answer: parts.join(" "),
      citations,
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

  // Kişisel niyetli soru ama bağlam yok (oturum kapalı): mevcut dürüst "veri boşluğu"
  // davranışı korunur, yalnız küçük bir giriş notu eklenir — kişisel veri UYDURULMAZ.
  const loginHint = !context && (hasGardenIntent(query) || hasTodayIntent(query)) ? ` ${LOGIN_NOTE}` : "";

  return {
    query,
    safetyBlocked: false,
    answer:
      "Bu soruyu bilgi grafiğimizdeki bir ürün, mikro filiz türü veya satış kanalıyla eşleştiremedim. Kaynağı olmayan bir cevap uydurmak yerine açıkça söylüyorum: veri boşluğu var." +
      loginHint,
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
