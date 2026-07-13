import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MICROGREEN_RECIPES,
  BLOCKED_MICROGREENS,
  computeTrayCost,
  DEFAULT_TRAY_INPUT,
  SAFETY_LABELS,
} from "../src/data/microgreens.ts";

test("Solanaceae türleri mikro filizde bloklu (domates/biber/patlıcan/patates)", () => {
  const names = BLOCKED_MICROGREENS.map((b) => b.name.toLowerCase());
  for (const t of ["domates", "biber", "patlıcan", "patates"]) {
    assert.ok(names.includes(t), `${t} bloklu olmalı`);
  }
  // her blok bir gerekçe taşır
  for (const b of BLOCKED_MICROGREENS) assert.ok(b.reason.length > 0);
});

test("uygun reçeteler bloklu türlerle çakışmaz", () => {
  const blocked = new Set(BLOCKED_MICROGREENS.map((b) => b.family));
  for (const r of MICROGREEN_RECIPES) {
    if (r.safety === "uygun") {
      // Solanaceae uygun listesinde olmamalı
      assert.notEqual(r.family, "Solanaceae");
    }
  }
  assert.ok(blocked.has("Solanaceae"));
});

test("reçete alanları aralık (min<=max) ve tutarlı", () => {
  for (const r of MICROGREEN_RECIPES) {
    assert.ok(r.seedDensityGper1020[0] <= r.seedDensityGper1020[1], `${r.id} yoğunluk`);
    assert.ok(r.harvestDays[0] <= r.harvestDays[1], `${r.id} hasat`);
    assert.ok(r.expectedYieldG[0] <= r.expectedYieldG[1], `${r.id} verim`);
    assert.ok(SAFETY_LABELS[r.safety], `${r.id} güvenlik etiketi tanımlı`);
  }
});

test("05 §7 şema alanları (substrat/sıcaklık/nem/ışık/sulama/gıda güvenliği) dolu ve aralık tutarlı", () => {
  for (const r of MICROGREEN_RECIPES) {
    assert.ok(r.substrateTypeAndDepth.length > 0, `${r.id} substrat notu`);
    assert.ok(r.irrigationMethod.length > 0, `${r.id} sulama yöntemi`);
    assert.ok(r.foodSafetyNote.length > 0, `${r.id} gıda güvenliği notu`);
    assert.ok(r.germinationTempC[0] <= r.germinationTempC[1], `${r.id} çimlenme sıcaklığı`);
    assert.ok(r.growthTempC[0] <= r.growthTempC[1], `${r.id} büyüme sıcaklığı`);
    assert.ok(r.growthHumidityPct[0] <= r.growthHumidityPct[1], `${r.id} büyüme nemi`);
    assert.ok(r.growthHumidityPct[0] >= 0 && r.growthHumidityPct[1] <= 100, `${r.id} nem % aralığında`);
    if (r.lightDLI) assert.ok(r.lightDLI[0] <= r.lightDLI[1], `${r.id} DLI`);
    if (r.photoperiodHours) {
      assert.ok(r.photoperiodHours[0] <= r.photoperiodHours[1], `${r.id} fotoperiyot`);
      assert.ok(r.photoperiodHours[0] >= 0 && r.photoperiodHours[1] <= 24, `${r.id} fotoperiyot 24 saati aşmaz`);
    }
  }
});

test("computeTrayCost — kâr = gelir - toplam maliyet, marj tutarlı", () => {
  const r = computeTrayCost(DEFAULT_TRAY_INPUT);
  const sumCosts = r.seedCost + r.substrateCost + r.laborCost + r.energyCost + r.packagingCost;
  assert.ok(Math.abs(sumCosts - r.totalCostPerTray) < 0.02, "maliyet dökümü toplam ile uyumlu");
  assert.ok(Math.abs(r.revenuePerTray - r.totalCostPerTray - r.profitPerTray) < 0.02, "kâr = gelir - maliyet");
  const expectedMargin = (r.profitPerTray / r.revenuePerTray) * 100;
  assert.ok(Math.abs(expectedMargin - r.marginPct) < 1.5, "marj yüzdesi tutarlı");
});

test("computeTrayCost — fire arttıkça satılabilir gram ve kâr düşer", () => {
  const az = computeTrayCost({ ...DEFAULT_TRAY_INPUT, wastePct: 5 });
  const cok = computeTrayCost({ ...DEFAULT_TRAY_INPUT, wastePct: 40 });
  assert.ok(cok.sellableGrams < az.sellableGrams);
  assert.ok(cok.profitPerTray < az.profitPerTray);
});

test("computeTrayCost — haftalık/aylık kâr tepsi kârıyla ölçeklenir", () => {
  const r = computeTrayCost(DEFAULT_TRAY_INPUT);
  assert.ok(Math.abs(r.weeklyProfit - r.profitPerTray * DEFAULT_TRAY_INPUT.traysPerWeek) < 0.05);
  assert.ok(r.monthlyProfit > r.weeklyProfit, "aylık > haftalık");
});

test("computeTrayCost — başabaş fiyatta kâr ~0", () => {
  const r = computeTrayCost(DEFAULT_TRAY_INPUT);
  const atBreakEven = computeTrayCost({ ...DEFAULT_TRAY_INPUT, sellPricePer100g: r.breakEvenPricePer100g });
  assert.ok(Math.abs(atBreakEven.profitPerTray) < 0.5, "başabaş fiyatta kâr sıfıra yakın");
});
