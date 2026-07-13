// SmartGrowth OS — Mikro filiz uzmanlık modeli (05 §7, PRD 9.8)
// Reçete = tür sayfasından ayrı. Uygun olmayan türler SERT blok (Solanaceae vb.).

export type SafetyClass =
  | "uygun"
  | "dogrulanmis-tohum-gerekli"
  | "alerjen-uyarili"
  | "uygun-degil";

export interface MicrogreenRecipe {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  emoji: string;
  safety: SafetyClass;
  seedDensityGper1020: [number, number]; // 10x20 tepsi başına gram
  presoakHours: [number, number]; // 0 = ıslatma yok
  blackoutDays: [number, number];
  harvestDays: [number, number];
  expectedYieldG: [number, number]; // tepsi başına taze gram
  flavor: string;
  difficulty: 1 | 2 | 3;
  evidence: "A" | "B" | "C" | "D";
  commonFailures: string[];
  note: string;
  // ---- 05 §7 MicrogreenRecipe şemasını tamamlayan alanlar ----
  // Kaynak: research/microgreens/report.md §5 (çapraz kesişen genel tablo) ve §6
  // (türe özel profil). Hangi kaynağın kullanıldığı her reçetede satır içi yorumla
  // belirtilir — bkz. MICROGREEN_RECIPES üstündeki açıklama.
  substrateTypeAndDepth: string; // ortam tipi ve derinlik (05 §7 substrate_type_and_depth)
  germinationTempC: [number, number]; // çimlenme evresi ortam/substrat sıcaklığı (°C)
  growthTempC: [number, number]; // karartma sonrası büyüme evresi hava sıcaklığı (°C)
  growthHumidityPct: [number, number]; // büyüme evresi bağıl nem (%)
  lightDLI?: [number, number]; // mol/m²/gün — yalnız tür-özel/genel kaynakta sayısal DLI varsa dolu
  photoperiodHours?: [number, number]; // gün içi aydınlatma süresi (saat) — yalnız kaynakta varsa dolu
  irrigationMethod: string; // sulama yöntemi/sıklığı (05 §7 irrigation_method/frequency)
  foodSafetyNote: string; // gıda güvenliği notu (05 §7 food_safety_SOP)
}

// Uygun olmayan / toksik türler — reçete motorunda sert blok (FR-110, 05 §7)
export const BLOCKED_MICROGREENS: { name: string; family: string; reason: string }[] = [
  { name: "Domates", family: "Solanaceae", reason: "Fide evresi glikoalkaloit içerir — mikro filiz olarak tüketilmez." },
  { name: "Biber", family: "Solanaceae", reason: "Solanaceae fide toksisitesi — uygun değil." },
  { name: "Patates", family: "Solanaceae", reason: "Solanine riski — kesin blok." },
  { name: "Patlıcan", family: "Solanaceae", reason: "Solanaceae fide toksisitesi — uygun değil." },
  { name: "Rhubarb", family: "Polygonaceae", reason: "Yaprakta oksalik asit — uygun değil." },
];

// ---- 05 §7 şema tamamlama notu (kaynak: research/microgreens/report.md) ----
// substrateTypeAndDepth/germinationTempC/growthTempC/growthHumidityPct/lightDLI/
// photoperiodHours/irrigationMethod/foodSafetyNote alanları, rapor §5'teki "aksi
// belirtilmedikçe TÜM türlere uygulanan" çapraz kesişen genel tablodan veya §6'daki
// türe özel profil tablosundan alınır; hangisi kullanıldığı her reçetede satır içi
// yorumla belirtilir. Genel tabloya düşen alanlar bir veri eksikliği değildir —
// kaynağın kendisinin öngördüğü açık varsayılan davranıştır.
// Türe özel SOURCED (genel tablonun ötesinde) değer taşıyanlar: brokoli (ışık+
// sulama), turp (fotoperiyot, tek çalışma), hardal (ışık DLI + Kanada alerjen
// notu), roka (ışık DLI + musilaj), amarant (substrat + büyüme sıcaklığı/nemi —
// tek Brezilya saha denemesinin ortam ölçümü, kaynakta "test edilmiş optimum
// değil" diye açıkça işaretli), fesleğen (fotoperiyot, tek çalışma). Geri kalanı
// (bezelye, ayçiçeği, kale, kişniş çoğu alanda) genel tabloya düşer.
// 05 §7'nin seed_lot_requirements ve tray_dimensions alanları tüm türler için
// ortaktır; 29 kez tekrarlanmadan aşağıdaki paylaşılan sabitlerde tutulur.
export const STANDARD_TRAY_DIMENSIONS =
  "10x20 inç (25.4×50.8 cm), ~0.129 m² — standart 1020 tepsi (report.md tanım notu)";
export const SEED_LOT_GENERAL_NOTE =
  "Tohum lotu izlenebilir ve gıda güvenliği açısından test edilmiş/onaylı olmalı — 100+ tür ticari mikro filiz üretiminde kullanıldığından bu ilke tür-spesifik değil, geneldir (Alberta Agriculture, report.md §4 [S10]).";

export const MICROGREEN_RECIPES: MicrogreenRecipe[] = [
  {
    id: "brokoli",
    name: "Brokoli",
    scientificName: "Brassica oleracea",
    family: "Brassicaceae",
    emoji: "🥦",
    safety: "uygun",
    seedDensityGper1020: [28, 35],
    presoakHours: [0, 0],
    blackoutDays: [3, 4],
    harvestDays: [8, 12],
    expectedYieldG: [180, 260],
    flavor: "Hafif, taze, lahanamsı",
    difficulty: 1,
    evidence: "A",
    commonFailures: ["Aşırı yoğunlukta küf", "Yetersiz hava akımıyla sararma"],
    note: "Başlangıç için en güvenilir tür; yüksek ve tutarlı verim.",
    substrateTypeAndDepth: "Topraksız karışım / hindistan cevizi lifi / hidroponik mat, 2.5–5 cm derinlik — report.md §6.1 [S9][S16]",
    germinationTempC: [15.5, 24], // genel tablo; brokoliye özel kaynak da aynı aralığı doğruluyor — report.md §5/§6.1 [S7][S15]
    growthTempC: [16, 21], // genel tablo — report.md §5 [S7][S17]
    growthHumidityPct: [50, 70], // genel tablo — report.md §5 [S17][S18]
    lightDLI: [9, 16], // genel çapraz-çalışma sentezi; brokoli profilinde de aynı genel değer anılıyor — report.md §5/§6.1
    photoperiodHours: [12, 18], // genel tablo — report.md §5/§6.1
    irrigationMethod: "Alttan/kılcal sulama; çimlenme öncesi yalnız püskürtme, büyümüş yapraklara üstten su verilmez — report.md §6.1 [S16]",
    foodSafetyNote: "Standart Brassicaceae hijyeni; musilajlı (jel) tohum değildir; glukosinolat bakımından zengin — report.md §6.1 [S5][S10].",
  },
  {
    id: "turp",
    name: "Turp (Daikon)",
    scientificName: "Raphanus sativus",
    family: "Brassicaceae",
    emoji: "🌶️",
    safety: "uygun",
    seedDensityGper1020: [30, 40],
    presoakHours: [0, 0],
    blackoutDays: [3, 4],
    harvestDays: [6, 10],
    expectedYieldG: [200, 300],
    flavor: "Keskin, biberimsi",
    difficulty: 1,
    evidence: "A",
    commonFailures: ["Nemli ortamda sap uzaması", "Erken ışıkla renk kaybı"],
    note: "En hızlı türlerden; restoran garnitüründe yoğun talep.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm derinlik — report.md §6.2 [S9][S16]",
    germinationTempC: [15.5, 24], // genel tablo, turpa özel geçersiz kılma yok — report.md §5 [S7]
    growthTempC: [16, 21], // genel tablo — report.md §5
    growthHumidityPct: [50, 70], // genel tablo — report.md §5
    photoperiodHours: [8, 8], // tek çalışma: 8 saat/gün @200 µmol/m²/s PPFD (DLI birimine çevrilmedi) — report.md §6.2 [S17], kanıt C
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, turpa özel kaynak yok) — report.md §5",
    foodSafetyNote: "İnce tohum kabuğu, musilajlı değildir; standart Brassicaceae hijyeni; gecikmiş hasatta keskinlik hızla artar — report.md §6.2 [S5][S10].",
  },
  {
    id: "bezelye",
    name: "Bezelye Filizi",
    scientificName: "Pisum sativum",
    family: "Fabaceae",
    emoji: "🫛",
    safety: "uygun",
    seedDensityGper1020: [150, 220],
    presoakHours: [8, 12],
    blackoutDays: [3, 5],
    harvestDays: [10, 14],
    expectedYieldG: [350, 500],
    flavor: "Tatlı, gevrek, bezelye",
    difficulty: 2,
    evidence: "A",
    commonFailures: ["Ön ıslatma eksikse düzensiz çimlenme", "Yüksek nemde kök küfü"],
    note: "Ön ıslatma zorunlu; ağır tohumla en yüksek gram verim.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm; tohum/ağırlık sıkı ortam temasına bastırılmalı — report.md §6.3 [S8][S9]",
    germinationTempC: [15.5, 24], // genel tablo — bezelyeye özel optimum kaynakta bulunamadı, kanıt C (fallback) — report.md §6.3 [S7]
    growthTempC: [16, 21], // genel tablo — report.md §5
    growthHumidityPct: [50, 70], // genel tablo — report.md §5
    lightDLI: [9, 16], // tür-özel veri yok, genel tablo — report.md §5
    photoperiodHours: [12, 18], // tür-özel veri yok, genel tablo — report.md §5
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, bezelyeye özel kaynak yok) — report.md §5",
    foodSafetyNote: "Kalın/sert tohum kabuğu nedeniyle ön ıslatma zorunlu; ıslatma sırasında 1–2 kez durulama önerilir (hijyen + oksijen) — report.md §6.3 [S8].",
  },
  {
    id: "aycicegi",
    name: "Ayçiçeği Filizi",
    scientificName: "Helianthus annuus",
    family: "Asteraceae",
    emoji: "🌻",
    safety: "dogrulanmis-tohum-gerekli",
    seedDensityGper1020: [120, 160],
    presoakHours: [8, 12],
    blackoutDays: [3, 4],
    harvestDays: [8, 12],
    expectedYieldG: [300, 450],
    flavor: "Fındıksı, çıtır",
    difficulty: 2,
    evidence: "B",
    commonFailures: ["Kabuk atmama (tohum başlığı takılı kalır)", "Yüksek yoğunlukta çürüme"],
    note: "İşlem görmemiş, gıda sınıfı ayçiçeği tohumu doğrulanmalı.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm — report.md §6.4 [S9]",
    germinationTempC: [15.5, 24], // genel tablo, ayçiçeğine özel kaynak yok, kanıt C (fallback) — report.md §6.4 [S7]
    growthTempC: [16, 21], // genel tablo (tür-özel satır yok) — report.md §5
    growthHumidityPct: [50, 70], // genel tablo
    lightDLI: [9, 16], // tür-özel veri yok, genel tablo
    photoperiodHours: [12, 18], // tür-özel veri yok, genel tablo
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, tür-özel kaynak yok) — report.md §5",
    foodSafetyNote: "Kabuk (hull) kotiledona yapışık kalabilir — fiziksel kontaminasyon/boğulma riski ve nem cebinde küf riski; ağırlıklama tekniği veya hasat sonrası elle kabuk giderme/durulama gerekir — report.md §6.4 [S8][S10].",
  },
  {
    id: "hardal",
    name: "Hardal",
    scientificName: "Brassica juncea",
    family: "Brassicaceae",
    emoji: "🌿",
    safety: "uygun",
    seedDensityGper1020: [20, 28],
    presoakHours: [0, 0],
    blackoutDays: [2, 3],
    harvestDays: [6, 10],
    expectedYieldG: [150, 220],
    flavor: "Baharatlı, wasabi benzeri",
    difficulty: 1,
    evidence: "A",
    commonFailures: ["Mus­ilaj (jel) tohum yapışması", "Fazla sulamada küf"],
    note: "Hızlı ve keskin lezzet; salata karışımlarına renk katar.",
    substrateTypeAndDepth: "Topraksız karışım (turba/hindistan cevizi lifi bazlı), 2.5–5 cm — genel tablo, hardala özel kaynak yok — report.md §5",
    germinationTempC: [15.5, 24], // genel tablo — report.md §5
    growthTempC: [16, 21], // genel tablo
    growthHumidityPct: [50, 70], // genel tablo
    lightDLI: [12, 12], // tür-özel: "Mizuna ve Hardal" için 12 mol/m²/gün "ya da daha yüksek" — report.md §6.5 [S17], kanıt C (tek çalışma)
    photoperiodHours: [12, 18], // tür-özel fotoperiyot verisi yok, genel tablo
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, tür-özel kaynak yok) — report.md §5",
    foodSafetyNote: "Kanada'da tanınan öncelikli alerjen (hardal) — etiketleme ve çapraz bulaşmayı önleyecek ayrıştırma doğrulanmalı — report.md §6.5 [S11].",
  },
  {
    id: "kale",
    name: "Kale (Kara Lahana)",
    scientificName: "Brassica oleracea var. acephala",
    family: "Brassicaceae",
    emoji: "🥬",
    safety: "uygun",
    seedDensityGper1020: [22, 30],
    presoakHours: [0, 0],
    blackoutDays: [3, 4],
    harvestDays: [8, 12],
    expectedYieldG: [160, 230],
    flavor: "Yumuşak, hafif tatlı",
    difficulty: 1,
    evidence: "B",
    commonFailures: ["Yavaş çimlenmede yosun", "Düşük ışıkta soluk renk"],
    note: "Besin yoğun; mavi-yeşil renk sunum değeri yüksek.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm — report.md §6.6 [S9]",
    germinationTempC: [15.5, 24], // genel tablo, kale için tür-özel satır yok — report.md §5
    growthTempC: [16, 21], // genel tablo
    growthHumidityPct: [50, 70], // genel tablo
    lightDLI: [9, 16], // tür-özel veri yok, genel tablo
    photoperiodHours: [12, 18], // tür-özel veri yok, genel tablo
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, tür-özel kaynak yok) — report.md §5",
    foodSafetyNote: "Standart Brassicaceae hijyeni; C vitamini bakımından zengin (turp, roka, brokoli ile birlikte hakemli derlemede anılıyor) — report.md §6.6 [S17][S18].",
  },
  {
    id: "roka",
    name: "Roka",
    scientificName: "Eruca vesicaria",
    family: "Brassicaceae",
    emoji: "🌱",
    safety: "uygun",
    seedDensityGper1020: [18, 25],
    presoakHours: [0, 0],
    blackoutDays: [2, 3],
    harvestDays: [6, 9],
    expectedYieldG: [120, 190],
    flavor: "Fındıksı-acı, karakterli",
    difficulty: 2,
    evidence: "B",
    commonFailures: ["Mus­ilaj tohum yapışması", "Aşırı nemde kök boğazı çürümesi"],
    note: "Küçük tohum; su püskürtme yöntemi jelleşmeyi azaltır.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm — report.md §6.7 [S9]",
    germinationTempC: [15.5, 24], // genel tablo, rokaya özel satır yok — report.md §5
    growthTempC: [16, 21], // genel tablo; 18°C'de 28°C'ye göre daha fazla gövde uzaması bildiren tek çalışma var ama aralık değiştirilmedi — report.md §6.7 [S18]
    growthHumidityPct: [50, 70], // genel tablo
    lightDLI: [9, 9], // tür-özel: bulunan en düşük DLI değeri, UMD'nin bağımsız "düşük ışıkta da iyi büyür" gözlemiyle tutarlı — report.md §6.7 [S17][S15]
    photoperiodHours: [12, 18], // tür-özel fotoperiyot verisi yok (yalnız DLI var), genel tablo
    irrigationMethod: "Alttan/kılcal sulama; musilaj nedeniyle üstten sulama ve ön ıslatma yapılmaz — report.md §5/§6.7",
    foodSafetyNote: "Musilajlı tohum: jel tabakası yüzey nemini uzun tutar — yetersiz hava akımı/drenajda küf/kök çürümesi riski yüksek — report.md §6.7 [S10].",
  },
  {
    id: "amarant",
    name: "Amarant (Kırmızı)",
    scientificName: "Amaranthus tricolor",
    family: "Amaranthaceae",
    emoji: "🔴",
    safety: "uygun",
    seedDensityGper1020: [12, 18],
    presoakHours: [0, 0],
    blackoutDays: [4, 6],
    harvestDays: [12, 18],
    expectedYieldG: [90, 150],
    flavor: "Yumuşak, topraksı",
    difficulty: 3,
    evidence: "C",
    commonFailures: ["Çok küçük tohum — düzensiz dağılım", "Yavaş büyümede kuruma"],
    note: "Canlı kırmızı rengiyle premium tabak sunumu; sabır ister.",
    substrateTypeAndDepth: "Hindistan cevizi lifi — tek kontrollü çalışmada fenolik köpüğe göre anlamlı derecede daha iyi performans; derinlik ~2.5–5 cm (genel tablo) — report.md §6.8 [S19], kanıt C",
    germinationTempC: [15.5, 24], // tür-özel doğrulanmış kaynak yok, genel tabloya düşüldü — sıcak iklim tercihi olası ama doğrulanmamış (D/E), kullanılmadı — report.md §6.8
    growthTempC: [24.5, 33.8], // tek Brezilya seragövde ortam ölçümü (ortalama 27.5°C) — TEST EDİLMİŞ/ONAYLI BİR OPTİMUM DEĞİL, dolaylı destek olarak işaretli — report.md §6.8 [S19], kanıt C
    growthHumidityPct: [66, 95], // aynı çalışma, ortam ölçümü (ortalama %86.6) — endorse edilmiş optimum değil — report.md §6.8 [S19], kanıt C
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, amaranta özel kaynak yok) — report.md §5",
    foodSafetyNote: "Tür-özel gıda güvenliği/alerjen bulgusu yok (gerçek veri boşluğu, güvenlik kanıtı değil); aşırı ekim yoğunluğu hipokotil uzamasına ve daha kırılgan/çürümeye yatkın fidelere yol açabilir — report.md §6.8 [S19].",
  },
  {
    id: "kisnis",
    name: "Kişniş",
    scientificName: "Coriandrum sativum",
    family: "Apiaceae",
    emoji: "🌿",
    safety: "uygun",
    seedDensityGper1020: [40, 55],
    presoakHours: [6, 10],
    blackoutDays: [4, 6],
    harvestDays: [14, 21],
    expectedYieldG: [130, 200],
    flavor: "Yoğun, karakteristik kişniş",
    difficulty: 3,
    evidence: "C",
    commonFailures: ["Bütün tohum kırılmazsa çift çıkış", "Uzun döngüde küf riski"],
    note: "En uzun döngü; tohum kabuğunu kırmak (çatlatmak) çimlenmeyi hızlandırır.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm — genel tablo, kişnişe özel satır yok — report.md §5",
    germinationTempC: [15.5, 24], // genel tablo; doğrulanmamış grower kaynağı daha serin tercih iddia ediyor ama kaynak D ve kullanılmadı — report.md §6.9
    growthTempC: [16, 21], // genel tablo
    growthHumidityPct: [50, 70], // genel tablo
    lightDLI: [9, 16], // tür-özel veri yok, genel tablo
    photoperiodHours: [12, 18], // tür-özel veri yok, genel tablo
    irrigationMethod: "Alttan/kılcal sulama (genel tablo, tür-özel kaynak yok) — report.md §5",
    foodSafetyNote: "Tür-özel bulgu yok; alışılmadık uzun karartma (7–14 gün) süresince tepsi daha uzun süre sıcak/nemli/karanlık kalır — genel küf/kök çürümesi riski bu nedenle diğer türlere göre daha uzun süre geçerlidir (çıkarım) — report.md §6.9 [S9][S4][S7].",
  },
  {
    id: "feslegen",
    name: "Fesleğen",
    scientificName: "Ocimum basilicum",
    family: "Lamiaceae",
    emoji: "🌱",
    safety: "uygun",
    seedDensityGper1020: [10, 16],
    presoakHours: [0, 0],
    blackoutDays: [3, 5],
    harvestDays: [16, 22],
    expectedYieldG: [80, 140],
    flavor: "Aromatik, tatlı fesleğen",
    difficulty: 3,
    evidence: "C",
    commonFailures: ["Mus­ilaj tohum — üstten sulama zorunlu", "Düşük sıcaklıkta çok yavaş"],
    note: "Yüksek katma değer; ıslak tohum jeli nedeniyle alttan sulama önerilir.",
    substrateTypeAndDepth: "Topraksız karışım, 2.5–5 cm — report.md §6.10 [S9]",
    germinationTempC: [15.5, 24], // genel tablo; fesleğenin "serin seven brassicalardan" daha yüksek çimlenme sıcaklığı istediği belirtiliyor ama kesin rakam yok — report.md §6.10
    growthTempC: [16, 21], // genel tablo, tür-özel satır yok
    growthHumidityPct: [50, 70], // genel tablo
    photoperiodHours: [16, 16], // tek çalışma: 16 saat/gün @231 PPFD, hasada 3 gün kala 300 µmol/m²/s kırmızı ışığa çıkarılıyor — report.md §6.10 [S17], kanıt C
    irrigationMethod: "Alttan sulama zorunlu (musilaj nedeniyle üstten sulama ve ön ıslatma yapılmaz) — report.md §5/§6.10 [S10]",
    foodSafetyNote: "Musilajlı tohum (roka ile aynı risk sınıfı): jel tabakası nem tutar; sıcaklık tercihiyle birleşince (kaynakta kesin rakam yok) küf/kök çürümesi riski artabilir (yazarın sentezi, doğrudan çalışma değil) — report.md §6.10 [S10][S14].",
  },
];

export const SAFETY_LABELS: Record<SafetyClass, { label: string; tone: "ok" | "warn" | "danger" }> = {
  uygun: { label: "Uygun", tone: "ok" },
  "dogrulanmis-tohum-gerekli": { label: "Doğrulanmış tohum gerekli", tone: "warn" },
  "alerjen-uyarili": { label: "Alerjen uyarılı", tone: "warn" },
  "uygun-degil": { label: "Uygun değil — blok", tone: "danger" },
};

// ---------- Tepsi maliyet & marj hesaplayıcı (FR-120, GTM edinme aracı) ----------

export interface TrayCostInput {
  recipeId: string;
  traysPerWeek: number;
  seedCostPerKg: number; // TL/kg
  substrateCostPerTray: number; // TL
  laborCostPerHour: number; // TL
  laborMinutesPerTray: number;
  energyCostPerTray: number; // TL (ışık + iklim)
  packagingPerTray: number; // TL
  wastePct: number; // % fire
  sellPricePer100g: number; // TL
}

export interface TrayCostResult {
  seedCost: number;
  substrateCost: number;
  laborCost: number;
  energyCost: number;
  packagingCost: number;
  totalCostPerTray: number;
  sellableGrams: number;
  revenuePerTray: number;
  profitPerTray: number;
  marginPct: number;
  weeklyProfit: number;
  monthlyProfit: number;
  breakEvenPricePer100g: number;
}

export function computeTrayCost(input: TrayCostInput): TrayCostResult {
  const recipe = MICROGREEN_RECIPES.find((r) => r.id === input.recipeId) ?? MICROGREEN_RECIPES[0];
  const avgDensityG = (recipe.seedDensityGper1020[0] + recipe.seedDensityGper1020[1]) / 2;
  const avgYieldG = (recipe.expectedYieldG[0] + recipe.expectedYieldG[1]) / 2;

  const seedCost = (avgDensityG / 1000) * input.seedCostPerKg;
  const substrateCost = input.substrateCostPerTray;
  const laborCost = (input.laborMinutesPerTray / 60) * input.laborCostPerHour;
  const energyCost = input.energyCostPerTray;
  const packagingCost = input.packagingPerTray;

  const totalCostPerTray = seedCost + substrateCost + laborCost + energyCost + packagingCost;
  const sellableGrams = avgYieldG * (1 - input.wastePct / 100);
  const revenuePerTray = (sellableGrams / 100) * input.sellPricePer100g;
  const profitPerTray = revenuePerTray - totalCostPerTray;
  const marginPct = revenuePerTray > 0 ? (profitPerTray / revenuePerTray) * 100 : 0;
  const breakEvenPricePer100g = sellableGrams > 0 ? (totalCostPerTray / sellableGrams) * 100 : 0;

  return {
    seedCost: round2(seedCost),
    substrateCost: round2(substrateCost),
    laborCost: round2(laborCost),
    energyCost: round2(energyCost),
    packagingCost: round2(packagingCost),
    totalCostPerTray: round2(totalCostPerTray),
    sellableGrams: Math.round(sellableGrams),
    revenuePerTray: round2(revenuePerTray),
    profitPerTray: round2(profitPerTray),
    marginPct: Math.round(marginPct),
    weeklyProfit: round2(profitPerTray * input.traysPerWeek),
    monthlyProfit: round2(profitPerTray * input.traysPerWeek * 4.33),
    breakEvenPricePer100g: round2(breakEvenPricePer100g),
  };
}

export const DEFAULT_TRAY_INPUT: TrayCostInput = {
  recipeId: "bezelye",
  traysPerWeek: 30,
  seedCostPerKg: 180,
  substrateCostPerTray: 12,
  laborCostPerHour: 120,
  laborMinutesPerTray: 6,
  energyCostPerTray: 8,
  packagingPerTray: 6,
  wastePct: 10,
  sellPricePer100g: 90,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
