import { test } from "node:test";
import assert from "node:assert/strict";
import { COTTAGE_FOOD_LAWS, lawByState, exceedsRevenueCap } from "../src/data/cottageFoodLaws.ts";

test("katalog 3 gerçek, kaynaklı eyalet yasası içerir", () => {
  assert.equal(COTTAGE_FOOD_LAWS.length, 3);
  for (const l of COTTAGE_FOOD_LAWS) {
    assert.ok(l.sourceFile.length > 0, `${l.state} sourceFile boş`);
    assert.ok(l.permittedCategories.length > 0, `${l.state} permittedCategories boş`);
    assert.ok(l.labelingRequirement.length > 0, `${l.state} labelingRequirement boş`);
  }
});

test("lawByState var olan bir eyaleti bulur", () => {
  const tx = lawByState("TX");
  assert.equal(tx?.stateName, "Texas");
});

test("lawByState olmayan eyalet için undefined döner", () => {
  const catalog = COTTAGE_FOOD_LAWS.filter((l) => l.state !== "GA");
  assert.equal(lawByState("GA", catalog), undefined);
});

test("exceedsRevenueCap: Texas'ta 150.000 USD tavanı aşan gelir true döner", () => {
  assert.equal(exceedsRevenueCap("TX", 200000), true);
});

test("exceedsRevenueCap: Texas'ta tavan altı gelir false döner", () => {
  assert.equal(exceedsRevenueCap("TX", 100000), false);
});

test("exceedsRevenueCap: Georgia'da tavan YOK — true/false yerine undefined döner (uydurulmaz)", () => {
  assert.equal(exceedsRevenueCap("GA", 500000), undefined);
});

test("exceedsRevenueCap: New Mexico'da da tavan yok — undefined", () => {
  assert.equal(exceedsRevenueCap("NM", 10000), undefined);
});

test("exceedsRevenueCap: bilinmeyen eyalet için undefined döner", () => {
  const catalog = COTTAGE_FOOD_LAWS.filter((l) => l.state !== "TX");
  assert.equal(exceedsRevenueCap("TX", 200000, catalog), undefined);
});

test("New Mexico kaynağının resmi yasa metni OLMADIĞI, çelişkili tarihiyle birlikte açıkça belgeli (sahte kesinlik yok)", () => {
  const nm = lawByState("NM");
  assert.ok(nm?.sourceNote?.includes("broşür"));
  assert.ok(nm?.effectiveDateNote?.includes("ÇELİŞİYOR"));
});

test("Georgia'nın belirsiz yürürlük tarihi UYDURULMADI (effectiveDate undefined, not kalır)", () => {
  const ga = lawByState("GA");
  assert.equal(ga?.effectiveDate, undefined);
  assert.ok(ga?.effectiveDateNote && ga.effectiveDateNote.length > 0);
});

test("Texas 2025 reformunda gelir tavanı yükseltildi (50.000 → 150.000 doları yansıtır)", () => {
  const tx = lawByState("TX");
  assert.equal(tx?.annualRevenueCapUSD, 150000);
});

test("her eyalette en az bir zorunlu etiket ibaresi 'exempt/inspection' temasını içerir", () => {
  for (const l of COTTAGE_FOOD_LAWS) {
    assert.ok(/exempt|not subject|licensing/i.test(l.labelingRequirement), `${l.state} etiket metni beklenen temayı içermiyor`);
  }
});
