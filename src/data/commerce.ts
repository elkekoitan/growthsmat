// SmartGrowth OS — Ticaret, alıcı ve kanal merkezi (PRD §9.11, 08-MONETIZASYON-VE-GTM)
// "Organik bir pazarlama etiketi değildir": sertifika doğrulanmadan iddia yayınlanmaz.
// Etsy ücretleri SmartGrowth ücretinden ayrı gösterilir; işlemi kaçıran yönlendirme kurulmaz.

import { CROP_BY_ID } from "@/data/crops";
import { MICROGREEN_RECIPES } from "@/data/microgreens";

export type ProductFormat = "adet" | "agirlik" | "demet" | "tepsi" | "kutu" | "abonelik";
export type StockType = "mevcut" | "tahmini-hasat" | "on-siparis";
export type ChannelId = "yerel-vitrin" | "restoran-b2b" | "csa-kutu" | "etsy";
export type OrganicClaimStatus = "sertifikali" | "gecis-sureci" | "yontem-kayitli" | "belge-bekliyor";

export const FORMAT_LABELS: Record<ProductFormat, string> = {
  adet: "Adet",
  agirlik: "Ağırlık",
  demet: "Demet",
  tepsi: "Tepsi",
  kutu: "Kutu",
  abonelik: "Abonelik",
};

export const STOCK_LABELS: Record<StockType, { label: string; tone: "ok" | "warn" | "info" }> = {
  mevcut: { label: "Mevcut stok", tone: "ok" },
  "tahmini-hasat": { label: "Tahmini hasat", tone: "warn" },
  "on-siparis": { label: "Ön sipariş", tone: "info" },
};

// FR-126: sertifika yoksa "organik" iddiası yayın kapısından geçemez — ayrı ve dürüst gösterim.
export const CLAIM_LABELS: Record<OrganicClaimStatus, { label: string; publishable: boolean; tone: "ok" | "warn" | "info" }> = {
  sertifikali: { label: "Sertifikalı organik", publishable: true, tone: "ok" },
  "gecis-sureci": { label: "Geçiş süreci", publishable: true, tone: "info" },
  "yontem-kayitli": { label: "Üretim uygulamaları kayıtlı", publishable: true, tone: "warn" },
  "belge-bekliyor": { label: "Doğrulama bekliyor — organik filtresinde gösterilmez", publishable: false, tone: "warn" },
};

export interface CatalogListing {
  id: string;
  cropId?: string;
  microgreenId?: string;
  title: string;
  producer: string;
  region: string;
  format: ProductFormat;
  unitLabel: string;
  priceTRY: number;
  stockType: StockType;
  channels: ChannelId[];
  claim: OrganicClaimStatus;
  shelfLifeDays: number;
  repeatOrderRate: number; // 0-1, tekrar sipariş oranı — alıcı güveni sinyali
}

function emojiFor(l: Pick<CatalogListing, "cropId" | "microgreenId">): string {
  if (l.cropId) return CROP_BY_ID[l.cropId]?.emoji ?? "🌱";
  if (l.microgreenId) return MICROGREEN_RECIPES.find((r) => r.id === l.microgreenId)?.emoji ?? "🌱";
  return "🌱";
}

export const CATALOG: CatalogListing[] = [
  {
    id: "cherry-500g",
    cropId: "cherry-domates-kompakt",
    title: "Cherry Domates",
    producer: "Elif — Balkon Üretimi",
    region: "İstanbul, Marmara",
    format: "agirlik",
    unitLabel: "500 g file",
    priceTRY: 89,
    stockType: "mevcut",
    channels: ["yerel-vitrin", "restoran-b2b"],
    claim: "yontem-kayitli",
    shelfLifeDays: 6,
    repeatOrderRate: 0.62,
  },
  {
    id: "feslegen-demet",
    cropId: "feslegen",
    title: "Taze Fesleğen",
    producer: "Derya — Şehir Bahçesi",
    region: "İzmir, Ege",
    format: "demet",
    unitLabel: "1 demet · ~80 g",
    priceTRY: 35,
    stockType: "mevcut",
    channels: ["yerel-vitrin", "restoran-b2b", "etsy"],
    claim: "sertifikali",
    shelfLifeDays: 4,
    repeatOrderRate: 0.71,
  },
  {
    id: "bezelye-tepsi",
    microgreenId: "bezelye",
    title: "Bezelye Filizi",
    producer: "Derya — Mikro Filiz Stüdyosu",
    region: "İzmir, Ege",
    format: "tepsi",
    unitLabel: "1 tepsi · ~400 g",
    priceTRY: 140,
    stockType: "tahmini-hasat",
    channels: ["restoran-b2b", "csa-kutu"],
    claim: "yontem-kayitli",
    shelfLifeDays: 8,
    repeatOrderRate: 0.84,
  },
  {
    id: "brokoli-tepsi",
    microgreenId: "brokoli",
    title: "Brokoli Filizi",
    producer: "Derya — Mikro Filiz Stüdyosu",
    region: "İzmir, Ege",
    format: "tepsi",
    unitLabel: "1 tepsi · ~220 g",
    priceTRY: 110,
    stockType: "mevcut",
    channels: ["restoran-b2b", "yerel-vitrin"],
    claim: "yontem-kayitli",
    shelfLifeDays: 9,
    repeatOrderRate: 0.77,
  },
  {
    id: "aile-kutusu-haftalik",
    title: "Haftalık Aile Sebze Kutusu",
    producer: "Mehmet — Organik Çiftlik",
    region: "Antalya, Akdeniz",
    format: "kutu",
    unitLabel: "~5 kg karışık sebze",
    priceTRY: 420,
    stockType: "on-siparis",
    channels: ["csa-kutu", "yerel-vitrin"],
    claim: "sertifikali",
    shelfLifeDays: 10,
    repeatOrderRate: 0.9,
  },
  {
    id: "roka-100g",
    cropId: "roka",
    title: "Roka",
    producer: "Murat Ailesi — Hobi Bahçesi",
    region: "Ankara, İç Anadolu",
    format: "agirlik",
    unitLabel: "100 g",
    priceTRY: 28,
    stockType: "mevcut",
    channels: ["yerel-vitrin"],
    claim: "belge-bekliyor",
    shelfLifeDays: 5,
    repeatOrderRate: 0.48,
  },
  {
    id: "kurutulmus-karisim",
    cropId: "aromatik-kekik",
    title: "Kurutulmuş Aromatik Karışım",
    producer: "Ece — Butik Üretici",
    region: "Muğla, Ege",
    format: "adet",
    unitLabel: "80 g kavanoz",
    priceTRY: 145,
    stockType: "mevcut",
    channels: ["etsy", "yerel-vitrin"],
    claim: "gecis-sureci",
    shelfLifeDays: 365,
    repeatOrderRate: 0.55,
  },
  {
    id: "cilek-500g",
    cropId: "cilek",
    title: "Çilek",
    producer: "Ayşe — Sera İşletmesi",
    region: "Bursa, Marmara",
    format: "agirlik",
    unitLabel: "500 g",
    priceTRY: 160,
    stockType: "tahmini-hasat",
    channels: ["restoran-b2b", "yerel-vitrin"],
    claim: "sertifikali",
    shelfLifeDays: 4,
    repeatOrderRate: 0.8,
  },
];

export const CATALOG_WITH_EMOJI = CATALOG.map((l) => ({ ...l, emoji: emojiFor(l) }));

export interface DeliveryZone {
  id: string;
  region: string;
  radiusKm: number;
  minOrderTRY: number;
  deliveryFeeTRY: number;
  sameDay: boolean;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "ist-avr", region: "İstanbul (Avrupa)", radiusKm: 18, minOrderTRY: 150, deliveryFeeTRY: 39, sameDay: true },
  { id: "ist-and", region: "İstanbul (Anadolu)", radiusKm: 15, minOrderTRY: 150, deliveryFeeTRY: 39, sameDay: true },
  { id: "izmir", region: "İzmir merkez", radiusKm: 12, minOrderTRY: 120, deliveryFeeTRY: 29, sameDay: true },
  { id: "ankara", region: "Ankara merkez", radiusKm: 14, minOrderTRY: 120, deliveryFeeTRY: 35, sameDay: false },
  { id: "antalya", region: "Antalya merkez", radiusKm: 20, minOrderTRY: 150, deliveryFeeTRY: 45, sameDay: false },
];

export interface ChannelInfo {
  id: ChannelId;
  name: string;
  tagline: string;
  feeNote: string;
  feePct: [number, number]; // aralık
  requirements: string[];
  bestFor: string;
}

export const CHANNELS: ChannelInfo[] = [
  {
    id: "yerel-vitrin",
    name: "SmartGrowth Yerel Vitrin",
    tagline: "Kendi üretici sayfan; komşu ve mahalle alıcısına doğrudan satış",
    feeNote: "Kategoriye göre %2,5–6 hizmet bedeli; abonelik yükseldikçe düşer",
    feePct: [2.5, 6],
    requirements: ["Üretim kaydı", "Teslimat bölgesi tanımlı", "Fiyat/vergi/kargo şeffaf gösterimi"],
    bestFor: "Öz tüketim fazlası ve düzenli mahalle alıcısı",
  },
  {
    id: "restoran-b2b",
    name: "Restoran / Şef Aboneliği",
    tagline: "Haftalık sözleşmeli teslimat; kapasite simülasyonuyla kabul",
    feeNote: "Sözleşmeli sabit işlem veya düşük yüzde (referans %1,5–3)",
    feePct: [1.5, 3],
    requirements: ["Kapasite/hasat takvimi eşleşmesi", "Kalite kabul geçmişi", "Zamanında teslim SLA'sı"],
    bestFor: "Tekrarlanabilir kalite ve öngörülebilir gelir arayan profesyoneller",
  },
  {
    id: "csa-kutu",
    name: "Topluluk Destekli Tarım (CSA) Kutusu",
    tagline: "Ön ödemeli abonelik; sezon başında talep, sezon boyu teslim",
    feeNote: "Platform hizmet bedeli %3–5; üyelik iptali/duraklatma şeffaf",
    feePct: [3, 5],
    requirements: ["Sezonluk üretim planı", "Minimum üye eşiği", "Duraklatma/iptal politikası"],
    bestFor: "Öngörülebilir nakit akışı isteyen küçük-orta üretici",
  },
  {
    id: "etsy",
    name: "Etsy (Dış Kanal)",
    tagline: "OAuth 2.0 PKCE ile bağlan; taslak listing kullanıcı onayı olmadan yayına geçmez",
    feeNote: "0,20 USD listing + %6,5 transaction + ülkeye göre ödeme işleme (ayrı gösterilir)",
    feePct: [6.5, 6.5],
    requirements: ["Gıda/bitki/tohum ülke kuralı kontrolü", "Görsel lisans doğrulama", "Off-platform yönlendirme yasağına uyum"],
    bestFor: "Kurutulmuş ürün, tohum kiti ve uluslararası butik alıcı",
  },
];

export const CHANNEL_BY_ID: Record<ChannelId, ChannelInfo> = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c])
) as Record<ChannelId, ChannelInfo>;

// ---------- Etsy ücret simülatörü (07-VERI-KAYNAKLARI §7, 08-MONETIZASYON §4) ----------
// Sabitler Etsy'nin yayınlanmış ücret sayfasına göre referanstır; üretimde dinamik katalogdan çekilir.
export const ETSY_LISTING_FEE_USD = 0.2;
export const ETSY_TRANSACTION_FEE_PCT = 6.5;

export type PaymentCountry = "TR" | "US" | "EU" | "UK";

// İşlem ücreti ülkeye göre değişir — kaynak: Etsy Payments referans oranları (temsili; üretimde dinamik).
export const PAYMENT_PROCESSING: Record<PaymentCountry, { pct: number; fixedUSD: number; label: string }> = {
  TR: { pct: 4, fixedUSD: 0.3, label: "Türkiye" },
  US: { pct: 3, fixedUSD: 0.25, label: "ABD" },
  EU: { pct: 4, fixedUSD: 0.3, label: "Avrupa Birliği" },
  UK: { pct: 4, fixedUSD: 0.3, label: "Birleşik Krallık" },
};

// Basitleştirilmiş, açıkça etiketlenmiş temsili kur — gerçek sistemde kur tarihi kaydıyla saklanır (FR-154).
export const USD_TO_TRY_REFERENCE = 34.5;

export interface EtsyFeeInput {
  priceUSD: number;
  quantity: number;
  shippingUSD: number;
  country: PaymentCountry;
}

export interface EtsyFeeResult {
  revenueUSD: number;
  listingFeeUSD: number;
  transactionFeeUSD: number;
  paymentProcessingUSD: number;
  totalFeesUSD: number;
  netToSellerUSD: number;
  netToSellerTRY: number;
  feePercentOfRevenue: number;
}

export function simulateEtsyFees(input: EtsyFeeInput): EtsyFeeResult {
  const revenueUSD = input.priceUSD * input.quantity + input.shippingUSD;
  const listingFeeUSD = ETSY_LISTING_FEE_USD * input.quantity;
  const transactionFeeUSD = revenueUSD * (ETSY_TRANSACTION_FEE_PCT / 100);
  const pp = PAYMENT_PROCESSING[input.country];
  const paymentProcessingUSD = revenueUSD * (pp.pct / 100) + pp.fixedUSD;
  const totalFeesUSD = listingFeeUSD + transactionFeeUSD + paymentProcessingUSD;
  const netToSellerUSD = revenueUSD - totalFeesUSD;
  return {
    revenueUSD: round2(revenueUSD),
    listingFeeUSD: round2(listingFeeUSD),
    transactionFeeUSD: round2(transactionFeeUSD),
    paymentProcessingUSD: round2(paymentProcessingUSD),
    totalFeesUSD: round2(totalFeesUSD),
    netToSellerUSD: round2(netToSellerUSD),
    netToSellerTRY: round2(netToSellerUSD * USD_TO_TRY_REFERENCE),
    feePercentOfRevenue: revenueUSD > 0 ? Math.round((totalFeesUSD / revenueUSD) * 1000) / 10 : 0,
  };
}

// ---------- Yerel vitrin / B2B komisyon simülatörü ----------
export interface LocalFeeInput {
  priceTRY: number;
  quantity: number;
  deliveryFeeTRY: number;
  commissionPct: number; // kullanıcı planına göre seçilebilir (2.5-6 arası)
}

export interface LocalFeeResult {
  revenueTRY: number;
  commissionTRY: number;
  netToProducerTRY: number;
  feePercentOfRevenue: number;
}

export function simulateLocalFees(input: LocalFeeInput): LocalFeeResult {
  const revenueTRY = input.priceTRY * input.quantity + input.deliveryFeeTRY;
  const commissionTRY = revenueTRY * (input.commissionPct / 100);
  const netToProducerTRY = revenueTRY - commissionTRY;
  return {
    revenueTRY: round2(revenueTRY),
    commissionTRY: round2(commissionTRY),
    netToProducerTRY: round2(netToProducerTRY),
    feePercentOfRevenue: revenueTRY > 0 ? Math.round((commissionTRY / revenueTRY) * 1000) / 10 : 0,
  };
}

// ---------- B2B talep akışı (US-06 senaryosu) ----------
export interface DemandStage {
  stage: string;
  detail: string;
}

export const B2B_FLOW: DemandStage[] = [
  { stage: "Talep", detail: "Şef/alıcı ürün, hafta, kalite ve yaklaşık miktar tanımlar" },
  { stage: "Eşleşme", detail: "Sistem yalnız aktif teslimat bölgesi + yeterli kapasiteli üreticileri gösterir" },
  { stage: "Kapasite kontrolü", detail: "Üretici kabul etmeden önce ekim/hasat simülasyonunu görür" },
  { stage: "Teklif", detail: "Fiyat, teslim tarihi ve kalite taahhüdüyle teklif oluşur" },
  { stage: "Sözleşmeli tekrar", detail: "Kabul edilen talep haftalık plana otomatik yansır" },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
