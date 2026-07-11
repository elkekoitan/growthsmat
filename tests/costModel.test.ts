import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCycleCost, computeMargin, computeContribution, type CostEntry } from "../src/lib/costModel.ts";

const ENTRIES: CostEntry[] = [
  { category: "tohum", amountTRY: 100 },
  { category: "girdi", amountTRY: 50 },
  { category: "iscilik", amountTRY: 200 },
];

test("kategori toplamı değişken maliyete eşittir", () => {
  const r = computeCycleCost(ENTRIES, 0, "dongu-basi", { cycles: 1 });
  const sum = Object.values(r.byCategory).reduce((a, b) => a + b, 0);
  assert.equal(sum, r.variableTRY);
  assert.equal(r.variableTRY, 350);
});

test("alan-oranı dağıtımı sabit maliyeti doğru böler", () => {
  const r = computeCycleCost(ENTRIES, 1000, "alan-orani", { areaM2: 25, totalAreaM2: 100 });
  assert.equal(r.allocatedFixedTRY, 250); // 1000 * 25/100
  assert.equal(r.totalTRY, 600); // 350 + 250
});

test("döngü-başı dağıtımı sabit maliyeti eşit böler", () => {
  const r = computeCycleCost(ENTRIES, 900, "dongu-basi", { cycles: 3 });
  assert.equal(r.allocatedFixedTRY, 300);
});

test("negatif tutarlar 0'a sabitlenir (güvenli davranış)", () => {
  const r = computeCycleCost([{ category: "tohum", amountTRY: -50 }], 0, "dongu-basi", { cycles: 1 });
  assert.equal(r.variableTRY, 0);
});

test("fire satılabilir kg'yi düşürür", () => {
  const noWaste = computeMargin(100, 10, 0, 20);
  const withWaste = computeMargin(100, 10, 20, 20);
  assert.equal(noWaste.sellableKg, 10);
  assert.equal(withWaste.sellableKg, 8);
  assert.ok(withWaste.grossMarginTRY < noWaste.grossMarginTRY);
});

test("başabaş fiyatında marj ~0", () => {
  const r = computeMargin(160, 10, 0, 100);
  const atBreakEven = computeMargin(160, 10, 0, r.breakEvenPricePerKg);
  assert.ok(Math.abs(atBreakEven.grossMarginTRY) < 0.5);
});

test("sıfır verimde çökme yok, Infinity üretmez", () => {
  const r = computeMargin(100, 0, 0, 50);
  assert.equal(r.sellableKg, 0);
  assert.ok(Number.isFinite(r.unitCostPerKg));
  assert.ok(Number.isFinite(r.grossMarginPct));
});

test("marj yüzdesi gelir ve marjla tutarlı", () => {
  const r = computeMargin(100, 10, 0, 20); // gelir 200, marj 100
  assert.equal(r.revenueTRY, 200);
  assert.equal(r.grossMarginTRY, 100);
  assert.equal(r.grossMarginPct, 50);
});

test("katkı marjı geliri değişken maliyetten arındırır", () => {
  const c = computeContribution(200, 120);
  assert.equal(c.contributionTRY, 80);
  assert.equal(c.contributionPct, 40);
});
