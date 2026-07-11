import { test } from "node:test";
import assert from "node:assert/strict";
import { runWhatIf } from "../src/lib/whatIf.ts";
import type { SiteProfile } from "../src/lib/suitability.ts";

function profile(over: Partial<SiteProfile> = {}): SiteProfile {
  return {
    city: "İstanbul",
    method: "acik-alan",
    areaM2: 20,
    sunHours: 4,
    waterAccess: 3,
    weeklyMinutes: 180,
    experience: 2,
    goal: "oz-tuketim",
    hasKidsOrPets: false,
    season: "ilkbahar",
    ...over,
  };
}

test("güneşi artırmak düşük güneşli meyveli sebzenin sert kısıtını çözer", () => {
  // 4 saat güneşte sırık domates (min 7) elenir; 9 saate çıkınca çözülmeli
  const r = runWhatIf(profile({ sunHours: 4 }), [{ field: "sunHours", value: 9 }], "sirik-domates-beefsteak");
  assert.equal(r.before.eligible, false);
  assert.equal(r.after.eligible, true);
  assert.ok(r.unlockedHardFails.some((h) => /güneş/i.test(h)));
  assert.equal(r.verdict, "iyilesti");
});

test("skor ve güven AYRI raporlanır (scoreDelta ve confidenceDelta ayrı alanlar)", () => {
  const r = runWhatIf(profile(), [{ field: "soilPh", value: 6.5 }], "marul");
  assert.ok(typeof r.scoreDelta === "number");
  assert.ok(typeof r.confidenceDelta === "number");
});

test("pH ölçümü eklemek güveni artırır", () => {
  const r = runWhatIf(profile({ soilPh: undefined }), [{ field: "soilPh", value: 6.5 }], "marul");
  assert.ok(r.confidenceDelta > 0, "pH ölçümü güveni artırmalı");
});

test("sera yöntemine geçiş kış senaryosunda kısıtı çözer", () => {
  const r = runWhatIf(
    profile({ season: "kis", method: "acik-alan" }),
    [{ field: "method", value: "sera" }],
    "cherry-domates-kompakt"
  );
  assert.ok(r.after.eligible || r.unlockedHardFails.length > 0);
});

test("factorDeltas before/after skorlarıyla tutarlı", () => {
  const r = runWhatIf(profile(), [{ field: "waterAccess", value: 1 }], "salatalik");
  for (const d of r.factorDeltas) {
    assert.equal(d.delta, d.afterScore - d.beforeScore);
  }
});

test("hiçbir değişiklik yoksa verdict degismedi", () => {
  const r = runWhatIf(profile(), [], "marul");
  assert.equal(r.scoreDelta, 0);
  assert.equal(r.verdict, "degismedi");
});

test("bilinmeyen ürün hata fırlatır", () => {
  assert.throws(() => runWhatIf(profile(), [], "olmayan-urun"));
});

test("su erişimini düşürmek yüksek su ihtiyaçlı üründe skoru düşürür", () => {
  const r = runWhatIf(profile({ waterAccess: 3 }), [{ field: "waterAccess", value: 1 }], "salatalik");
  const waterDelta = r.factorDeltas.find((d) => d.factorKey === "water");
  assert.ok(waterDelta && waterDelta.delta < 0);
});
