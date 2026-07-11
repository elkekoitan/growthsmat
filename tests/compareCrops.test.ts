import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPARISON_METRICS, findBestCropIndex } from "../src/lib/compareCrops.ts";
import { CROP_BY_ID } from "../src/data/crops.ts";

function metric(key: string) {
  const m = COMPARISON_METRICS.find((x) => x.key === key);
  assert.ok(m, `metrik bulunamadı: ${key}`);
  return m!;
}

test("düşük su ihtiyaçlı ürün 'water' metriğinde en iyi olarak işaretlenir", () => {
  const kekik = CROP_BY_ID["aromatik-kekik"]; // waterNeed 1
  const salatalik = CROP_BY_ID["salatalik"]; // waterNeed 3
  const idx = findBestCropIndex([salatalik, kekik], metric("water"));
  assert.equal(idx, 1); // kekik (index 1) en iyi
});

test("yüksek verimli ürün 'yield' metriğinde en iyi olarak işaretlenir", () => {
  const marul = CROP_BY_ID["marul"]; // 1.5-3
  const sirikDomates = CROP_BY_ID["sirik-domates-beefsteak"]; // 5-10
  const idx = findBestCropIndex([marul, sirikDomates], metric("yield"));
  assert.equal(idx, 1);
});

test("EŞİTLİK: aynı değere sahip ürünlerde hiçbiri 'en iyi' vurgulanmaz (sahte kesinlik yok)", () => {
  // iki ürün de careLoad=1 olsun diye seçildi
  const roka = CROP_BY_ID["roka"]; // careLoad 1
  const marul = CROP_BY_ID["marul"]; // careLoad 1
  assert.equal(roka.careLoad, marul.careLoad);
  const idx = findBestCropIndex([roka, marul], metric("care"));
  assert.equal(idx, null);
});

test("'none' (betterWhen) metriklerde asla en iyi vurgulanmaz", () => {
  const a = CROP_BY_ID["cherry-domates-kompakt"];
  const b = CROP_BY_ID["marul"];
  assert.equal(findBestCropIndex([a, b], metric("sun")), null);
  assert.equal(findBestCropIndex([a, b], metric("beginner")), null);
});

test("kanıt seviyesi A, E'den daha iyi kabul edilir", () => {
  const highEvidence = { ...CROP_BY_ID["marul"], evidence: "A" as const };
  const lowEvidence = { ...CROP_BY_ID["roka"], evidence: "C" as const };
  const idx = findBestCropIndex([lowEvidence, highEvidence], metric("evidence"));
  assert.equal(idx, 1);
});

test("tek ürünle karşılaştırma çökmez, en iyi belirlenmez (karşılaştıracak başka yok)", () => {
  const idx = findBestCropIndex([CROP_BY_ID["marul"]], metric("water"));
  assert.equal(idx, null);
});

test("her metrik her gerçek ürün için bir değer string'i üretir (boş/undefined dönmez)", () => {
  const crops = Object.values(CROP_BY_ID).slice(0, 5);
  for (const m of COMPARISON_METRICS) {
    for (const c of crops) {
      const v = m.getValue(c);
      assert.ok(typeof v === "string" && v.length > 0, `${m.key} → ${c.id} boş değer döndü`);
    }
  }
});
