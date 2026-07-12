import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRotation, suggestNextCrops } from "../src/lib/rotation.ts";
import { CROP_BY_ID } from "../src/data/crops.ts";

test("boş geçmişte tüm adaylar uygun sayılır (aile çakışması yok)", () => {
  const results = evaluateRotation([]);
  assert.ok(results.every((r) => r.eligible));
});

test("SERT KISIT: geçen sezon aynı aile (Solanaceae) ekilmişse aynı aileden aday elenir", () => {
  const history = [{ cropId: "cherry-domates-kompakt", seasonsAgo: 1 }];
  const results = evaluateRotation(history);
  const sirikDomates = results.find((r) => r.crop.id === "sirik-domates-beefsteak");
  assert.ok(sirikDomates);
  assert.equal(sirikDomates!.eligible, false);
  assert.equal(sirikDomates!.conflict?.family, "Solanaceae");
  assert.equal(sirikDomates!.conflict?.historicalCropId, "cherry-domates-kompakt");
});

test("lookback penceresi dışındaki ekim çakışma SAYILMAZ", () => {
  const history = [{ cropId: "cherry-domates-kompakt", seasonsAgo: 5 }];
  const results = evaluateRotation(history, undefined, 3); // lookback=3, ekim 5 sezon önce
  const sirikDomates = results.find((r) => r.crop.id === "sirik-domates-beefsteak");
  assert.equal(sirikDomates!.eligible, true);
});

test("farklı aileden ürün her zaman uygun kalır", () => {
  const history = [{ cropId: "cherry-domates-kompakt", seasonsAgo: 1 }];
  const results = evaluateRotation(history);
  const marul = results.find((r) => r.crop.id === "marul"); // Asteraceae
  assert.equal(marul!.eligible, true);
  assert.equal(marul!.conflict, undefined);
});

test("bilinmeyen cropId geçmişte çökmeye neden olmaz, sessizce yok sayılır", () => {
  const history = [{ cropId: "olmayan-urun-xyz", seasonsAgo: 1 }];
  assert.doesNotThrow(() => evaluateRotation(history));
  const results = evaluateRotation(history);
  assert.ok(results.every((r) => r.eligible));
});

test("uygun adaylar skora göre azalan sırada; elenenler listenin sonunda", () => {
  const history = [{ cropId: "cherry-domates-kompakt", seasonsAgo: 1 }];
  const results = evaluateRotation(history);
  const eligibleIdx = results.map((r) => r.eligible);
  const firstIneligible = eligibleIdx.indexOf(false);
  if (firstIneligible !== -1) {
    assert.ok(eligibleIdx.slice(firstIneligible).every((e) => e === false));
  }
  const eligibleOnly = results.filter((r) => r.eligible);
  for (let i = 1; i < eligibleOnly.length; i++) {
    assert.ok(eligibleOnly[i - 1].score >= eligibleOnly[i].score);
  }
});

test("ardışık ekime uygun (successionCrop) ürünler doğru işaretlenir", () => {
  const results = evaluateRotation([]);
  const roka = results.find((r) => r.crop.id === "roka");
  assert.equal(roka!.successionFriendly, CROP_BY_ID["roka"].successionCrop);
  assert.equal(roka!.successionFriendly, true);
});

test("companionSuggestions yalnız 'faydalı' etkili gerçek ilişkileri içerir", () => {
  const results = evaluateRotation([]);
  const domates = results.find((r) => r.crop.id === "cherry-domates-kompakt");
  assert.ok(domates!.companionSuggestions.every((c) => c.effect === "faydali"));
  assert.ok(domates!.companionSuggestions.length > 0);
});

test("suggestNextCrops yalnız uygun adayları, limit kadar döner", () => {
  const history = [{ cropId: "cherry-domates-kompakt", seasonsAgo: 1 }];
  const top3 = suggestNextCrops(history, 3);
  assert.ok(top3.length <= 3);
  assert.ok(top3.every((r) => r.eligible));
});

test("HASTALIK-FARKINDA SERT KISIT: Brassicaceae (kökboğan/clubroot) varsayılan lookback'i aşan 7 yıl gerektirir", () => {
  const history = [{ cropId: "lahana", seasonsAgo: 4 }]; // Brassicaceae, 4 sezon önce
  const results = evaluateRotation(history); // varsayılan lookback=3 — eski modelde 4>3 olduğundan UYGUN sayılırdı
  const karnabahar = results.find((r) => r.crop.id === "karnabahar"); // Brassicaceae
  assert.equal(karnabahar!.eligible, false);
  assert.equal(karnabahar!.conflict?.family, "Brassicaceae");
  assert.equal(karnabahar!.conflict?.requiredYears, 7);
  assert.equal(karnabahar!.conflict?.diseaseDriven, true);
});

test("Brassicaceae'de kökboğan penceresinin (7 yıl) DIŞINDAKİ ekim artık çakışma sayılmaz", () => {
  const history = [{ cropId: "lahana", seasonsAgo: 8 }];
  const results = evaluateRotation(history);
  const karnabahar = results.find((r) => r.crop.id === "karnabahar");
  assert.equal(karnabahar!.eligible, true);
});

test("hastalık verisinde familyanın gerektirdiği yıl varsayılanı aşmıyorsa requiredYears varsayılanda kalır, diseaseDriven=false", () => {
  const history = [{ cropId: "cherry-domates-kompakt", seasonsAgo: 1 }]; // Solanaceae
  const results = evaluateRotation(history);
  const sirikDomates = results.find((r) => r.crop.id === "sirik-domates-beefsteak");
  assert.equal(sirikDomates!.conflict?.requiredYears, 3);
  assert.equal(sirikDomates!.conflict?.diseaseDriven, false);
});
