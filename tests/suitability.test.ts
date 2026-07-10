import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runAssessment,
  assessCrop,
  CITIES,
  CLIMATE_ZONES,
  type SiteProfile,
} from "../src/lib/suitability.ts";
import { CROP_BY_ID } from "../src/data/crops.ts";

function baseProfile(over: Partial<SiteProfile> = {}): SiteProfile {
  return {
    city: "İstanbul",
    method: "saksi",
    areaM2: 6,
    sunHours: 6,
    containerL: 20,
    waterAccess: 3,
    weeklyMinutes: 120,
    experience: 1,
    goal: "oz-tuketim",
    hasKidsOrPets: false,
    season: "ilkbahar",
    ...over,
  };
}

test("her şehir bir iklim bölgesine eşlenir", () => {
  assert.ok(CITIES.length >= 20);
  for (const city of CITIES) {
    const res = runAssessment(baseProfile({ city }));
    assert.ok(res.zone, `${city} bölge döndürmeli`);
    assert.ok(Object.values(CLIMATE_ZONES).includes(res.zone));
  }
});

test("runAssessment uygun adaylar + senaryolar üretir", () => {
  const res = runAssessment(baseProfile());
  assert.ok(res.candidates.length >= 3, "en az 3 aday");
  assert.ok(res.scenarios.length >= 1, "en az 1 senaryo");
  // adaylar skora göre azalan sırada
  for (let i = 1; i < res.candidates.length; i++) {
    assert.ok(res.candidates[i - 1].totalScore >= res.candidates[i].totalScore);
  }
});

test("skor ve güven 0-100 / 0-1 sınırlarında ve AYRI", () => {
  const res = runAssessment(baseProfile());
  for (const c of res.candidates) {
    assert.ok(c.totalScore >= 0 && c.totalScore <= 100);
    assert.ok(c.confidence > 0 && c.confidence <= 1);
    assert.ok(["dusuk", "orta", "yuksek"].includes(c.confidenceLevel));
    // güven skorun bir fonksiyonu DEĞİL — ayrı alanlar
    assert.notEqual(c.totalScore / 100, c.confidence);
  }
});

test("SERT KISIT: kompakt domates 20L'nin altında saksıda elenir (kök hacmi)", () => {
  const res = assessCrop(CROP_BY_ID["cherry-domates-kompakt"], baseProfile({ containerL: 8 }));
  assert.equal(res.eligible, false);
  assert.ok(res.hardFails.some((h) => /kök hacmi/i.test(h.rule)));
  // her sert kısıtta giderme yolu (remedy) olmalı
  for (const h of res.hardFails) assert.ok(h.remedy.length > 0);
});

test("SERT KISIT: yetersiz güneşte meyveli sebze elenir", () => {
  const res = assessCrop(CROP_BY_ID["sirik-domates-beefsteak"], baseProfile({ sunHours: 2, method: "acik-alan", containerL: undefined }));
  assert.equal(res.eligible, false);
  assert.ok(res.hardFails.some((h) => /güneş/i.test(h.rule)));
});

test("SERT KISIT: don toleranssız tür soğuk sezonda korumasız elenir", () => {
  const res = assessCrop(
    CROP_BY_ID["feslegen"],
    baseProfile({ city: "Erzurum", season: "kis", method: "acik-alan", containerL: undefined })
  );
  assert.equal(res.eligible, false);
});

test("sera yöntemi sezon/don kısıtını gevşetir", () => {
  const acik = assessCrop(CROP_BY_ID["cherry-domates-kompakt"], baseProfile({ season: "kis", method: "acik-alan", containerL: undefined }));
  const sera = assessCrop(CROP_BY_ID["cherry-domates-kompakt"], baseProfile({ season: "kis", method: "sera", containerL: undefined }));
  assert.equal(acik.eligible, false);
  assert.equal(sera.eligible, true);
});

test("pH ölçülmediğinde ölçüm kalitesi düşer ve veri boşluğu bildirilir", () => {
  const olculen = assessCrop(CROP_BY_ID["marul"], baseProfile({ soilPh: 6.5 }));
  const olculmeyen = assessCrop(CROP_BY_ID["marul"], baseProfile({ soilPh: undefined }));
  assert.ok(olculen.confidence > olculmeyen.confidence, "ölçüm güveni artırmalı");
  assert.ok(olculmeyen.dataGaps.some((g) => /pH/i.test(g)));
});

test("verim aralığı temkinli <= beklenen <= iyimser", () => {
  const res = assessCrop(CROP_BY_ID["marul"], baseProfile());
  const y = res.yieldRange;
  assert.ok(y.pessimist <= y.expected, "temkinli <= beklenen");
  assert.ok(y.expected <= y.optimist, "beklenen <= iyimser");
});

test("gelir hedefi pazar skorunu etkiler, öz-tüketim nötr bırakır", () => {
  const gelir = assessCrop(CROP_BY_ID["feslegen"], baseProfile({ goal: "gelir" }));
  const oz = assessCrop(CROP_BY_ID["feslegen"], baseProfile({ goal: "oz-tuketim" }));
  const mGelir = gelir.factors.find((f) => f.key === "market")!.score;
  const mOz = oz.factors.find((f) => f.key === "market")!.score;
  assert.equal(mOz, 60, "öz-tüketimde pazar nötr (60)");
  assert.notEqual(mGelir, mOz);
});

test("elenen aday yüksek skor bile olsa önerilmez", () => {
  const res = runAssessment(baseProfile({ containerL: 5 }));
  // 5L saksıda domates elenmiş olmalı, candidates içinde olmamalı
  assert.ok(!res.candidates.some((c) => c.crop.id === "cherry-domates-kompakt"));
  assert.ok(res.excluded.some((c) => c.crop.id === "cherry-domates-kompakt"));
});
