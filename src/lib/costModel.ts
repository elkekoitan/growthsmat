// SmartGrowth OS — Maliyet kategorisi ve marj modeli (PRD FR-144–148)
// Genel üretim maliyeti (mikro filiz tepsi hesaplayıcısından ayrı). Sabit maliyet
// dağıtım yöntemi seçilebilir (FR-145). Sıfır verimde Infinity yerine güvenli değer.

export type CostCategory =
  | "tohum"
  | "girdi"
  | "ambalaj"
  | "enerji"
  | "su"
  | "iscilik"
  | "ekipman-amortisman";

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  tohum: "Tohum/Fide",
  girdi: "Girdi (gübre vb.)",
  ambalaj: "Ambalaj",
  enerji: "Enerji",
  su: "Su",
  iscilik: "İşçilik",
  "ekipman-amortisman": "Ekipman amortismanı",
};

export interface CostEntry {
  category: CostCategory;
  amountTRY: number;
  note?: string;
}

export type FixedAllocation = "alan-orani" | "dongu-basi";

export interface CycleCostResult {
  variableTRY: number;
  allocatedFixedTRY: number;
  totalTRY: number;
  byCategory: Record<string, number>;
}

/** Değişken maliyetleri toplar ve sabit maliyeti seçilen yönteme göre dağıtır. */
export function computeCycleCost(
  entries: CostEntry[],
  fixedCostsTRY: number,
  allocation: FixedAllocation,
  ctx: { areaM2: number; totalAreaM2: number } | { cycles: number }
): CycleCostResult {
  const byCategory: Record<string, number> = {};
  let variableTRY = 0;
  for (const e of entries) {
    const amt = Math.max(0, e.amountTRY);
    byCategory[e.category] = (byCategory[e.category] ?? 0) + amt;
    variableTRY += amt;
  }

  let allocatedFixedTRY = 0;
  const fixed = Math.max(0, fixedCostsTRY);
  if (allocation === "alan-orani" && "areaM2" in ctx) {
    const ratio = ctx.totalAreaM2 > 0 ? ctx.areaM2 / ctx.totalAreaM2 : 0;
    allocatedFixedTRY = fixed * ratio;
  } else if (allocation === "dongu-basi" && "cycles" in ctx) {
    allocatedFixedTRY = ctx.cycles > 0 ? fixed / ctx.cycles : fixed;
  }

  return {
    variableTRY: round2(variableTRY),
    allocatedFixedTRY: round2(allocatedFixedTRY),
    totalTRY: round2(variableTRY + allocatedFixedTRY),
    byCategory,
  };
}

export interface MarginResult {
  sellableKg: number;
  revenueTRY: number;
  grossMarginTRY: number;
  grossMarginPct: number;
  unitCostPerKg: number;
  breakEvenPricePerKg: number;
}

/** Toplam maliyet + verim + fire + fiyattan brüt marj ve başabaş fiyatı hesaplar. */
export function computeMargin(
  totalCostTRY: number,
  expectedYieldKg: number,
  wastePct: number,
  pricePerKgTRY: number
): MarginResult {
  const yieldKg = Math.max(0, expectedYieldKg);
  const sellableKg = yieldKg * (1 - clampPct(wastePct) / 100);
  const revenueTRY = sellableKg * Math.max(0, pricePerKgTRY);
  const grossMarginTRY = revenueTRY - Math.max(0, totalCostTRY);
  const grossMarginPct = revenueTRY > 0 ? (grossMarginTRY / revenueTRY) * 100 : 0;
  const unitCostPerKg = sellableKg > 0 ? totalCostTRY / sellableKg : 0;
  const breakEvenPricePerKg = sellableKg > 0 ? totalCostTRY / sellableKg : 0;

  return {
    sellableKg: round2(sellableKg),
    revenueTRY: round2(revenueTRY),
    grossMarginTRY: round2(grossMarginTRY),
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    unitCostPerKg: round2(unitCostPerKg),
    breakEvenPricePerKg: round2(breakEvenPricePerKg),
  };
}

/** Katkı marjı: gelir - değişken maliyet (sabit hariç). */
export function computeContribution(revenueTRY: number, variableCostTRY: number): {
  contributionTRY: number;
  contributionPct: number;
} {
  const contributionTRY = revenueTRY - Math.max(0, variableCostTRY);
  return {
    contributionTRY: round2(contributionTRY),
    contributionPct: revenueTRY > 0 ? Math.round((contributionTRY / revenueTRY) * 1000) / 10 : 0,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}
