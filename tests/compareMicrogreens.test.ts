import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPARISON_METRICS, findBestRecipeIndex } from "../src/lib/compareMicrogreens.ts";
import { MICROGREEN_RECIPES, type MicrogreenRecipe } from "../src/data/microgreens.ts";

function metric(key: string) {
  const m = COMPARISON_METRICS.find((x) => x.key === key);
  assert.ok(m, `metrik bulunamadı: ${key}`);
  return m!;
}

function recipeById(id: string): MicrogreenRecipe {
  const r = MICROGREEN_RECIPES.find((x) => x.id === id);
  assert.ok(r, `reçete bulunamadı: ${id}`);
  return r!;
}

test("kısa hasat süreli reçete 'harvest' metriğinde en iyi olarak işaretlenir", () => {
  const turp = recipeById("turp"); // harvestDays [6,10]
  const kisnis = recipeById("kisnis"); // harvestDays [14,21]
  const idx = findBestRecipeIndex([kisnis, turp], metric("harvest"));
  assert.equal(idx, 1); // turp (index 1) en iyi
});

test("yüksek verimli reçete 'yield' metriğinde en iyi olarak işaretlenir", () => {
  const kisnis = recipeById("kisnis"); // expectedYieldG [130,200]
  const bezelye = recipeById("bezelye"); // expectedYieldG [350,500]
  const idx = findBestRecipeIndex([kisnis, bezelye], metric("yield"));
  assert.equal(idx, 1);
});

test("EŞİTLİK: aynı zorluğa sahip reçetelerde hiçbiri 'en iyi' vurgulanmaz (sahte kesinlik yok)", () => {
  // brokoli ve turp ikisi de difficulty 1 olsun diye seçildi
  const brokoli = recipeById("brokoli");
  const turp = recipeById("turp");
  assert.equal(brokoli.difficulty, turp.difficulty);
  const idx = findBestRecipeIndex([brokoli, turp], metric("difficulty"));
  assert.equal(idx, null);
});

test("'none' (betterWhen) metriklerde asla en iyi vurgulanmaz", () => {
  const a = recipeById("brokoli");
  const b = recipeById("bezelye");
  assert.equal(findBestRecipeIndex([a, b], metric("safety")), null);
  assert.equal(findBestRecipeIndex([a, b], metric("family")), null);
});

test("kanıt seviyesi A, C'den daha iyi kabul edilir", () => {
  const highEvidence = { ...recipeById("kisnis"), evidence: "A" as const };
  const lowEvidence = { ...recipeById("brokoli"), evidence: "C" as const };
  const idx = findBestRecipeIndex([lowEvidence, highEvidence], metric("evidence"));
  assert.equal(idx, 1);
});

test("tek reçeteyle karşılaştırma çökmez, en iyi belirlenmez (karşılaştıracak başka yok)", () => {
  const idx = findBestRecipeIndex([recipeById("brokoli")], metric("harvest"));
  assert.equal(idx, null);
});

test("her metrik her gerçek reçete için bir değer string'i üretir (boş/undefined dönmez)", () => {
  for (const m of COMPARISON_METRICS) {
    for (const r of MICROGREEN_RECIPES) {
      const v = m.getValue(r);
      assert.ok(typeof v === "string" && v.length > 0, `${m.key} → ${r.id} boş değer döndü`);
    }
  }
});
