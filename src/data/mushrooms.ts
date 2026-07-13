// SmartGrowth OS — Mantar yetiştiriciliği kataloğu (yeni ürün kategorisi, PRD P04 kapsam genişletmesi)
// Kaynak: research/mushroom-cultivation/ — Cornell/NC State/SARE shiitake rehberleri, Penn State
// istiridye mantarı yetiştirme kılavuzu, Thammasat Üniversitesi Hericium çalışması, Penn State +
// Mississippi State agaricus kaynakları (2026-07-12 paralel araştırma okuması), MDPI Horticulturae
// Stropharia/şarap mantarı çalışması + 21 CFR 112.3 (2026-07-13 dokümantasyon doğruluğu turu —
// research/mushroom-cultivation/report.md §5'in belgelediği 5. tür koda hiç taşınmamıştı).
//
// Mantarlar crops.ts'teki Crop arayüzüne UYMAZ (fotosentez/güneş/toprak pH yerine substrat,
// nem, karanlık/ışık döngüsü belirleyici) — bu yüzden ayrı bir arayüz (microgreens.ts'in
// MicrogreenRecipe'i gibi). "Sahte kesinlik yok": bir tür için kaynakta bulunmayan parametre
// UYDURULMAZ — undefined bırakılır ve dataGaps'te açıkça belirtilir (bkz. agaricus-bisporus:
// kaynaklar yalnızca laboratuvar spawn/tohumluk aşamasını kapsıyor, meyvelenme verisi yok).

export interface TempRange {
  min: number;
  max: number;
}

export interface MushroomProfile {
  id: string;
  name: string;
  scientificName: string;
  substrates: string[];
  incubationTempC?: TempRange; // miselyum yürüyüşü (spawn run) sıcaklığı
  fruitingTempC?: TempRange; // meyvelenme dönemi sıcaklığı
  fruitingHumidityPct?: TempRange;
  daysToFirstHarvest?: [number, number]; // aşılamadan ilk hasada gün
  yieldNote: string; // birimler türe göre çok farklı (BE%, kütük başına g, şişe başına g) — tek sayısal alana zorlanmaz
  foodSafetyNotes: string;
  difficultyLevel: 1 | 2 | 3; // 1: ev ölçeği erişilebilir · 2: orta/ticari eğilimli · 3: uzman/araştırma ölçeği
  sourceOrg: string;
  sourceFiles: string[];
  dataGaps?: string[];
}

export const MUSHROOM_CATALOG: MushroomProfile[] = [
  {
    id: "shiitake",
    name: "Shiitake",
    scientificName: "Lentinula edodes",
    substrates: [
      "Meşe kütüğü (kırmızı/beyaz meşe en iyi sonucu verir)",
      "Şeker akçaağacı, gürgen, kayın, demir ağacı kütüğü (iyi alternatif)",
      "Tatlı sığla ağacı (bazı suşlarla iyi sonuç — NC State)",
    ],
    incubationTempC: { min: 22, max: 25 },
    fruitingTempC: { min: 10, max: 20 },
    fruitingHumidityPct: { min: 60, max: 85 },
    daysToFirstHarvest: [240, 540],
    yieldNote:
      "Kütük başına flush başına 115-225 g; kütük ömrü boyunca (3-4 yıl, ortalama 8 flush) toplam 1,4-1,8 kg.",
    foodSafetyNotes:
      "Su ile yıkanmaz, fırçayla temizlenir; hasat sonrası 3-4°C'de gevşek kapaklı saklama. Zehirli Galerina türleriyle karışmaması için spor izi testi şart (shiitake beyaz, Galerina kahverengi iz bırakır).",
    difficultyLevel: 1,
    sourceOrg: "NC State Extension, SARE Northeast, Cornell CALS",
    sourceFiles: ["ncstate_shiitake_logs_smallscale.pdf", "sare_shiitake_bmp_northeast.pdf", "cornell_shiitake_viability_workbook.pdf"],
    dataGaps: ["Kütük iç nem oranı (%35-55, misel için kritik) hava nemiyle aynı alanda karışmasın diye ayrıca not edilmelidir."],
  },
  {
    id: "istiridye-mantari",
    name: "İstiridye mantarı",
    scientificName: "Pleurotus spp.",
    substrates: ["Buğday samanı", "Pamuk tohumu kabuğu (yaygın karışım: %75 pamuk kabuğu + %24 saman + %1 kireçtaşı)"],
    incubationTempC: { min: 23, max: 25 },
    fruitingHumidityPct: { min: 80, max: 85 },
    daysToFirstHarvest: [21, 28],
    yieldNote:
      "Standart bir biyolojik etkinlik yüzdesi kaynakta verilmemiş; spawn oranını %1,25'ten %5'e çıkarmak verimi ~%50, besin takviyesi (%6 kuru ağırlık) eklemek ~%90 artırabiliyor.",
    foodSafetyNotes:
      "Pseudomonas tolaasii (bakteriyel leke) yüksek nemle tetiklenir — flaşlar arası %0,2 çamaşır suyu solüsyonu püskürtme ve nem düşürme ile kontrol edilir. Sinek zararlılarına karşı kimyasal pestisit yerine Bacillus thuringiensis var. israeliensis önerilir (pestisit meyve gövdesinde deformasyona yol açar).",
    difficultyLevel: 2,
    sourceOrg: "Penn State University (D.J. Royse)",
    sourceFiles: ["oyster_cultivation_paoyster.pdf"],
    dataGaps: [
      "Meyvelenme oda sıcaklığı kaynakta muhtemel baskı hatasıyla belirsiz ('18-2°C' olarak geçiyor) — bu yüzden fruitingTempC alanı boş bırakıldı, uydurulmadı.",
    ],
  },
  {
    id: "aslan-yelesi-mantari",
    name: "Aslan yelesi mantarı",
    scientificName: "Hericium erinaceus",
    substrates: ["Kauçuk ağacı (Hevea) talaşı", "Bambu talaşı (destekleyici karışım — tek başına düşük verim)", "Mısır koçanı + pirinç kepeği takviyesi (3:1:1)"],
    incubationTempC: { min: 20, max: 20 },
    fruitingTempC: { min: 16, max: 24 },
    fruitingHumidityPct: { min: 65, max: 75 },
    daysToFirstHarvest: [45, 50],
    yieldNote:
      "En yüksek biyolojik verimlilik %100 kauçuk talaşında %42,6 (BE), 3:1 kauçuk:bambu karışımında %40,9; %100 bambuda yalnızca %14,5 — kauçuk oranı arttıkça verim artıyor. Şişe başına taze ağırlık 38-113 g arası (karışıma göre).",
    foodSafetyNotes:
      "Substrat otoklavda sterilize edilir; hasat sonrası substrat pH'ı düşer (asidik) — aşırı alkali substrat (özellikle %100 bambu) miselyum gelişimini olumsuz etkiler. Kaynakta doğrudan kontaminasyon/gıda güvenliği verisi yok, çalışma ağırlıklı agronomik/verim odaklı.",
    difficultyLevel: 3,
    sourceOrg: "Thammasat University / BIOTEC, Tayland (Chutimanukul ve ark., Scientific Reports 2023)",
    sourceFiles: ["nature_hericium_rubber_bamboo_sawdust.pdf"],
    dataGaps: [
      "Meyvelenme sıcaklığı bu çalışmada tropik iklime özel 16°C olarak uygulanmış; genel literatürde Hericium için 18-24°C bildiriliyor — fruitingTempC aralığı ikisini de yansıtır.",
      "Ev/hobi ölçeğine yönelik pratik rehberlik yok — akademik/yarı-endüstriyel ölçek verisi.",
    ],
  },
  {
    id: "agaricus-bisporus",
    name: "Beyaz (düğme) mantar",
    scientificName: "Agaricus bisporus",
    substrates: ["Kompostlanmış at gübresi (taze veya kompostlanmış — kompostlama süreci/oranları kaynakta detaylandırılmamış)"],
    incubationTempC: { min: 23, max: 23 },
    yieldNote: "Kaynakta verim/biyolojik etkinlik rakamı yok.",
    foodSafetyNotes:
      "Genel uyarı (tüm mantar türleri için, msstate_growing_mushrooms.pdf): tarımsal atık substratlar pestisit/aflatoksin gibi toksik kalıntı içerebilir — hijyenik üretim, kayıt tutma ve sorumluluk sigortası önerilir.",
    difficultyLevel: 3,
    sourceOrg: "Penn State University, Mississippi State University Extension",
    sourceFiles: ["psu_agaricus_culture_care_handling.pdf", "msstate_growing_mushrooms.pdf"],
    dataGaps: [
      "Meyvelenme sıcaklığı, nem, hasada gün sayısı ve verim kaynak belgelerde YOK — yalnızca laboratuvar spawn/tohumluk üretimi bilgisi mevcut; bu yüzden fruitingTempC/fruitingHumidityPct/daysToFirstHarvest alanları boş bırakıldı.",
      "incubationTempC (23°C) kompost/meyvelenme aşamasına DEĞİL, tahıl spawn üretimi (miselyum inkübasyonu) aşamasına aittir — karıştırılmamalı.",
      "Kaynak, ev ölçeği üreticiye önerilmediğini açıkça belirtiyor (ciddi sermaye/yönetim gerektirir).",
    ],
  },
  {
    id: "sarap-mantari",
    name: "Şarap mantarı (Kral Stropharia)",
    scientificName: "Stropharia rugosoannulata",
    substrates: [
      "Bahçe yatağı yöntemi: sert ağaç yongası + tahıl samanı (~%50:50), çürümüş ahır gübresiyle zenginleştirilebilir — akçaağaç, kavak, karaağaç, manolya önerilir",
      "Ticari/laboratuvar ölçek (hakemli): %55 talaş + %43 mısır koçanı + %2 kireç, ~%75 nem",
    ],
    incubationTempC: { min: 25, max: 25 },
    fruitingTempC: { min: 16, max: 21 },
    fruitingHumidityPct: { min: 85, max: 95 },
    daysToFirstHarvest: [55, 90],
    yieldNote:
      "Biyolojik etkinlik talaş bazlı substratta ~%51-52 (hakemli); ayrı bir çalışmada %50 pirinç samanı + %50 pirinç kavuzunda %81,74 BE bildirilmiş (tek çalışma). 3-4 aylık üretken sezonda 3-4 flaş (2-6 hafta arayla); bahçe yatakları yıllık taze odun eklemesiyle yıllarca üretken kalabilir.",
    foodSafetyNotes:
      "Substrat kaynağı gıda güvenliğini doğrudan etkiler: jenerik/karışık talaşta yetişen mantarlarda Çin gıda güvenliği sınırları kadmiyum (1,27 vs 1,0 mg/kg) ve arsenik (2,56 vs 1,0 mg/kg) için aşılmış, izlenebilir tek-kaynaklı (kış hünnabı) talaşta aşılmamış — substrat izlenebilirliği somut bir gıda güvenliği kontrol noktasıdır. Trichoderma (yeşil küf) bu türde de hakemli literatürde doğrulanmış (2024, Guizhou). Hasat şapka hâlâ çan şeklindeyken ve kısmi örtü/solungaçlar yırtılmadan önce yapılmalı — geç hasatta kalite düşer. Diğer dört türle paylaşılan genel uyarı: 21 CFR 112.3 mantarları kapsanan ürün (\"covered produce\") sayar ve taze paketlemede Clostridium botulinum'u açıkça isimlendirilmiş bir tehlike olarak tanır.",
    difficultyLevel: 1,
    sourceOrg: "MDPI Horticulturae (hakemli, 2024); US FDA/eCFR 21 CFR 112.3",
    sourceFiles: ["fda_21cfr112_produce_safety_rule.pdf"],
    dataGaps: [
      "Birincil agronomik kaynak (MDPI Horticulturae, Stropharia/kış hünnabı çalışması) otomatik PDF indirmeyi engelliyor — tam metin yalnız HTML makale sayfası üzerinden incelendi, diğer 4 türden farklı olarak yerel bir PDF kopyası documents/ klasöründe YOK.",
      "Hasat sonrası raf ömrü (gün, saklama sıcaklığı) hiçbir üniversite/hakemli kaynakta bulunamadı — foodSafetyNotes'a uydurma bir değer eklenmedi.",
      "daysToFirstHarvest aralığı iki farklı yöntemi TEK aralıkta birleştiriyor: açık hava bahçe yatağı (~2 ay, mevsime bağlı, kanıt C/D) ile hakemli laboratuvar protokolü (~55-60 gün, kanıt B) — ayrı ayrı okunmalı, tek kesin sayı değildir.",
    ],
  },
];

export function mushroomById(id: string, catalog: MushroomProfile[] = MUSHROOM_CATALOG): MushroomProfile | undefined {
  return catalog.find((m) => m.id === id);
}

/** Kaynakta eksik bırakılan (uydurulmayan) alan sayısını döner — güven/şeffaflık göstergesi. */
export function dataGapCount(profile: MushroomProfile): number {
  return profile.dataGaps?.length ?? 0;
}

export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Ev ölçeği — erişilebilir",
  2: "Orta — ticari eğilimli kaynak",
  3: "Uzman/araştırma ölçeği",
};
