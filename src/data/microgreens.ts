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
}

// Uygun olmayan / toksik türler — reçete motorunda sert blok (FR-110, 05 §7)
export const BLOCKED_MICROGREENS: { name: string; family: string; reason: string }[] = [
  { name: "Domates", family: "Solanaceae", reason: "Fide evresi glikoalkaloit içerir — mikro filiz olarak tüketilmez." },
  { name: "Biber", family: "Solanaceae", reason: "Solanaceae fide toksisitesi — uygun değil." },
  { name: "Patates", family: "Solanaceae", reason: "Solanine riski — kesin blok." },
  { name: "Patlıcan", family: "Solanaceae", reason: "Solanaceae fide toksisitesi — uygun değil." },
  { name: "Rhubarb", family: "Polygonaceae", reason: "Yaprakta oksalik asit — uygun değil." },
];

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
