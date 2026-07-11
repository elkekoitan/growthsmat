// SmartGrowth OS — Lot izlenebilirlik, mass balance ve geri çağırma motoru
// (03-TEKNIK-MIMARI §6.5, 06-MEVZUAT-GIDA-GUVENLIGI §9, PRD §9.9 FR-124–143)
//
// "En az bir adım geri / bir adım ileri" ilkesi: her lot, girdi lotlarına (parentLotIds)
// ve ondan üretilen çıktı lotlarına transitif olarak izlenebilir. Organik iddiası,
// zincirdeki TÜM atalar sertifikalı olmadıkça yayınlanamaz (paralel üretim ayrımı, FR-129).

export type LotType = "tohum" | "girdi" | "uretim" | "hasat" | "paket" | "sevkiyat";
export type LotStatus = "aktif" | "incelemede" | "karantina" | "geri-cagrildi" | "tuketildi";

export interface Lot {
  id: string;
  type: LotType;
  label: string;
  cropId?: string;
  quantity: number;
  unit: string;
  producedAt: string; // ISO tarih
  parentLotIds: string[]; // girdi lotları (bir adım geri)
  status: LotStatus;
  certifiedOrigin: boolean; // bu lotun KENDİ üretim adımı sertifikalı mı
  ownerLabel: string; // üretici veya alıcı/sipariş etiketi
}

// ---------- Örnek lot grafiği (cherry domates hattı) ----------
// tohum → üretim → hasat → 2 paket lotu (biri sertifikalı zincir, biri karışık) → sevkiyat
export const LOTS: Lot[] = [
  {
    id: "SEED-2026-014",
    type: "tohum",
    label: "Cherry domates tohum lotu",
    cropId: "cherry-domates-kompakt",
    quantity: 500,
    unit: "tohum",
    producedAt: "2026-02-10",
    parentLotIds: [],
    status: "tuketildi",
    certifiedOrigin: true,
    ownerLabel: "Sertifikalı tedarikçi — Anadolu Tohumculuk",
  },
  {
    id: "PROD-2026-031",
    type: "uretim",
    label: "Sera üretim partisi",
    cropId: "cherry-domates-kompakt",
    quantity: 480,
    unit: "bitki",
    producedAt: "2026-03-05",
    parentLotIds: ["SEED-2026-014"],
    status: "tuketildi",
    certifiedOrigin: true,
    ownerLabel: "Ayşe — Sera İşletmesi",
  },
  {
    id: "HARVEST-2026-058",
    type: "hasat",
    label: "Hasat lotu — hafta 22",
    cropId: "cherry-domates-kompakt",
    quantity: 340,
    unit: "kg",
    producedAt: "2026-06-02",
    parentLotIds: ["PROD-2026-031"],
    status: "tuketildi",
    certifiedOrigin: true,
    ownerLabel: "Ayşe — Sera İşletmesi",
  },
  {
    id: "PKG-2026-102",
    type: "paket",
    label: "500g file — parti A (sertifikalı)",
    cropId: "cherry-domates-kompakt",
    quantity: 200,
    unit: "kg",
    producedAt: "2026-06-03",
    parentLotIds: ["HARVEST-2026-058"],
    status: "aktif",
    certifiedOrigin: true,
    ownerLabel: "Ayşe — Sera İşletmesi",
  },
  {
    id: "PKG-2026-103",
    type: "paket",
    label: "500g file — parti B (su testi şüpheli)",
    cropId: "cherry-domates-kompakt",
    quantity: 140,
    unit: "kg",
    producedAt: "2026-06-03",
    parentLotIds: ["HARVEST-2026-058"],
    status: "incelemede",
    certifiedOrigin: true,
    ownerLabel: "Ayşe — Sera İşletmesi",
  },
  {
    id: "SHIP-2026-210",
    type: "sevkiyat",
    label: "Yerel vitrin sevkiyatı — İstanbul",
    cropId: "cherry-domates-kompakt",
    quantity: 90,
    unit: "kg",
    producedAt: "2026-06-05",
    parentLotIds: ["PKG-2026-102"],
    status: "aktif",
    certifiedOrigin: true,
    ownerLabel: "Alıcı: Yerel Vitrin — İstanbul",
  },
  {
    id: "SHIP-2026-211",
    type: "sevkiyat",
    label: "Restoran teslimatı — Şef Deniz",
    cropId: "cherry-domates-kompakt",
    quantity: 60,
    unit: "kg",
    producedAt: "2026-06-06",
    parentLotIds: ["PKG-2026-103"],
    status: "aktif",
    certifiedOrigin: true,
    ownerLabel: "Alıcı: Restoran — Şef Deniz",
  },
  {
    id: "SHIP-2026-212",
    type: "sevkiyat",
    label: "Etsy kurutulmuş ürün sevkiyatı",
    cropId: "aromatik-kekik",
    quantity: 12,
    unit: "kg",
    producedAt: "2026-06-07",
    parentLotIds: ["PKG-2026-103"],
    status: "aktif",
    certifiedOrigin: true,
    ownerLabel: "Alıcı: Etsy siparişi #EC-4471",
  },
];

export const LOT_BY_ID: Record<string, Lot> = Object.fromEntries(LOTS.map((l) => [l.id, l]));

export const LOT_TYPE_LABELS: Record<LotType, string> = {
  tohum: "Tohum lotu",
  girdi: "Girdi lotu",
  uretim: "Üretim partisi",
  hasat: "Hasat lotu",
  paket: "Paket lotu",
  sevkiyat: "Sevkiyat / sipariş",
};

// ---------- Bir adım / transitif izleme ----------
export function directParents(lotId: string): Lot[] {
  const lot = LOT_BY_ID[lotId];
  if (!lot) return [];
  return lot.parentLotIds.map((id) => LOT_BY_ID[id]).filter((l): l is Lot => Boolean(l));
}

export function directChildren(lotId: string): Lot[] {
  return LOTS.filter((l) => l.parentLotIds.includes(lotId));
}

/** Geriye doğru transitif iz — "bu lot nereden geldi?" */
export function traceBackward(lotId: string): Lot[] {
  const visited = new Set<string>();
  const result: Lot[] = [];
  const stack = [lotId];
  while (stack.length) {
    const id = stack.pop()!;
    const lot = LOT_BY_ID[id];
    if (!lot || visited.has(id)) continue;
    visited.add(id);
    if (id !== lotId) result.push(lot);
    stack.push(...lot.parentLotIds);
  }
  return result;
}

/** İleriye doğru transitif iz — "bu lot hangi lot/siparişlere gitti?" */
export function traceForward(lotId: string): Lot[] {
  const visited = new Set<string>();
  const result: Lot[] = [];
  const stack = [lotId];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const children = directChildren(id);
    for (const c of children) {
      if (!visited.has(c.id)) {
        result.push(c);
        stack.push(c.id);
      }
    }
  }
  return result;
}

// ---------- Mass balance doğrulama ----------
export interface MassBalanceResult {
  lotId: string;
  outputQty: number;
  inputQty: number;
  lossPct: number;
  valid: boolean; // çıktı, girdilerin toplamını AŞAMAZ
  reason?: string;
}

/** Bir lotun çıktı miktarı, doğrudan girdi lotlarının toplamını aşarsa yayın/hareket bloklanır. */
export function validateMassBalance(lotId: string): MassBalanceResult {
  const lot = LOT_BY_ID[lotId];
  if (!lot) {
    return { lotId, outputQty: 0, inputQty: 0, lossPct: 0, valid: false, reason: "Lot bulunamadı" };
  }
  const parents = directParents(lotId);
  if (parents.length === 0) {
    // kök lot (tohum/girdi) — girdi kısıtı yok
    return { lotId, outputQty: lot.quantity, inputQty: lot.quantity, lossPct: 0, valid: true };
  }
  const inputQty = parents.reduce((sum, p) => sum + p.quantity, 0);
  const valid = lot.quantity <= inputQty * 1.0001; // yuvarlama payı
  const lossPct = inputQty > 0 ? Math.round(((inputQty - lot.quantity) / inputQty) * 1000) / 10 : 0;
  return {
    lotId,
    outputQty: lot.quantity,
    inputQty,
    lossPct,
    valid,
    reason: valid ? undefined : `Çıktı (${lot.quantity}) girdi toplamını (${inputQty}) aşıyor — düzeltici kayıt gerekir`,
  };
}

// ---------- Organik iddia zinciri kontrolü (FR-129: paralel üretim ayrımı) ----------
export interface ClaimChainResult {
  lotId: string;
  publishable: boolean;
  brokenAt?: string;
  chain: string[];
}

/** Bir lotun "sertifikalı organik" iddiası, TÜM atalarının sertifikalı olmasını gerektirir. */
export function checkOrganicClaimChain(lotId: string): ClaimChainResult {
  const lot = LOT_BY_ID[lotId];
  if (!lot) return { lotId, publishable: false, chain: [] };
  const ancestry = [lot, ...traceBackward(lotId)];
  const broken = ancestry.find((l) => !l.certifiedOrigin);
  return {
    lotId,
    publishable: !broken,
    brokenAt: broken?.id,
    chain: ancestry.map((l) => l.id),
  };
}

// ---------- Geri çağırma simülasyonu (06-doküman §9, US-10 senaryosu) ----------
export interface RecallResult {
  suspectLotId: string;
  quarantineLots: Lot[]; // elde kalan/aktif etkilenen lotlar — hemen karantina
  affectedShipments: Lot[]; // alıcıya gitmiş, bildirim gereken sevkiyatlar
  upstreamSources: Lot[]; // kök neden analizi için yukarı zincir
  stepCount: number;
}

/** Şüpheli/uygunsuz bir lottan başlayarak aşağı zincirdeki tüm etkilenen lotları çıkarır. */
export function simulateRecall(suspectLotId: string): RecallResult {
  const downstream = traceForward(suspectLotId);
  const quarantineLots = downstream.filter((l) => l.status === "aktif" && l.type !== "sevkiyat");
  const affectedShipments = downstream.filter((l) => l.type === "sevkiyat");
  const upstreamSources = traceBackward(suspectLotId);
  return {
    suspectLotId,
    quarantineLots,
    affectedShipments,
    upstreamSources,
    stepCount: downstream.length,
  };
}
