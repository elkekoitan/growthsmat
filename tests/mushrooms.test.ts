import { test } from "node:test";
import assert from "node:assert/strict";
import { MUSHROOM_CATALOG, mushroomById, dataGapCount, DIFFICULTY_LABELS, type MushroomProfile } from "../src/data/mushrooms.ts";

test("katalog 4 gerçek, kaynaklı tür içerir", () => {
  assert.equal(MUSHROOM_CATALOG.length, 4);
  for (const m of MUSHROOM_CATALOG) {
    assert.ok(m.sourceFiles.length > 0, `${m.id} sourceFiles boş`);
    assert.ok(m.sourceOrg.length > 0, `${m.id} sourceOrg boş`);
  }
});

test("mushroomById var olan bir türü bulur", () => {
  const shiitake = mushroomById("shiitake");
  assert.equal(shiitake?.scientificName, "Lentinula edodes");
});

test("mushroomById olmayan id için undefined döner", () => {
  assert.equal(mushroomById("olmayan-tur"), undefined);
});

test("agaricus-bisporus: kaynakta olmayan meyvelenme parametreleri UYDURULMAMIŞ (undefined)", () => {
  const agaricus = mushroomById("agaricus-bisporus");
  assert.equal(agaricus?.fruitingTempC, undefined);
  assert.equal(agaricus?.fruitingHumidityPct, undefined);
  assert.equal(agaricus?.daysToFirstHarvest, undefined);
});

test("agaricus-bisporus: eksik veri dataGaps'te AÇIKÇA belirtilir (sessizce atlanmaz)", () => {
  const agaricus = mushroomById("agaricus-bisporus");
  assert.ok(agaricus?.dataGaps && agaricus.dataGaps.length >= 2);
  assert.ok(agaricus!.dataGaps!.some((g) => /meyvelenme/i.test(g)));
});

test("shiitake ve istiridye mantarı: sourced sayısal parametreler dolu (asıl veri var)", () => {
  const shiitake = mushroomById("shiitake");
  const oyster = mushroomById("istiridye-mantari");
  assert.ok(shiitake?.fruitingTempC);
  assert.ok(shiitake?.daysToFirstHarvest);
  assert.ok(oyster?.fruitingHumidityPct);
  assert.ok(oyster?.daysToFirstHarvest);
});

test("istiridye mantarı: belirsiz kaynak değeri (baskı hatası) fruitingTempC olarak UYDURULMAMIŞ", () => {
  const oyster = mushroomById("istiridye-mantari");
  assert.equal(oyster?.fruitingTempC, undefined);
  assert.ok(oyster?.dataGaps?.some((g) => /baskı hatası/.test(g)));
});

test("dataGapCount: veri boşluğu olmayan bir profil 0 döner (varsayımsal tam profil)", () => {
  const complete: MushroomProfile = {
    id: "test",
    name: "Test",
    scientificName: "Testus testus",
    substrates: ["test"],
    yieldNote: "test",
    foodSafetyNotes: "test",
    difficultyLevel: 1,
    sourceOrg: "test",
    sourceFiles: ["test.pdf"],
  };
  assert.equal(dataGapCount(complete), 0);
});

test("dataGapCount: gerçek profillerin gap sayısı doğru sayılır", () => {
  const agaricus = mushroomById("agaricus-bisporus")!;
  assert.equal(dataGapCount(agaricus), agaricus.dataGaps!.length);
});

test("difficultyLevel 1-3 arası ve her seviye için etiket tanımlı", () => {
  for (const m of MUSHROOM_CATALOG) {
    assert.ok(m.difficultyLevel >= 1 && m.difficultyLevel <= 3);
    assert.ok(DIFFICULTY_LABELS[m.difficultyLevel]);
  }
});

test("en zor tür (araştırma ölçeği) doğru işaretli: aslan yelesi mantarı", () => {
  const hericium = mushroomById("aslan-yelesi-mantari");
  assert.equal(hericium?.difficultyLevel, 3);
});

test("en erişilebilir tür (ev ölçeği) doğru işaretli: shiitake", () => {
  const shiitake = mushroomById("shiitake");
  assert.equal(shiitake?.difficultyLevel, 1);
});
