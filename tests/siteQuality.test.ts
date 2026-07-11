import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDataQuality, type SiteProfile } from "../src/lib/siteQuality.ts";

const NOW = "2026-07-10";

function baseProfile(over: Partial<SiteProfile> = {}): SiteProfile {
  return {
    id: "site-1",
    name: "Test Alan",
    areaM2: 20,
    sunHoursObserved: 6,
    soilTest: { ph: 6.5, ec: 1.2, organicMatterPct: 3, sampledAt: "2026-05-01" },
    waterTest: { qualityOk: true, testedAt: "2026-05-01" },
    exactLocationKnown: true,
    ...over,
  };
}

test("tam ve güncel profil yüksek skor alır, sorun listesi boştur", () => {
  const r = computeDataQuality(baseProfile(), NOW);
  assert.equal(r.grade, "yuksek");
  assert.equal(r.issues.length, 0);
  assert.equal(r.score, 100);
});

test("toprak testi eksikse skor düşer ve 'eksik' olarak işaretlenir", () => {
  const r = computeDataQuality(baseProfile({ soilTest: undefined }), NOW);
  assert.ok(r.score < 100);
  const issue = r.issues.find((i) => i.field === "soilTest");
  assert.ok(issue);
  assert.equal(issue!.kind, "eksik");
});

test("BAYAT VERİ: 13 ay önceki toprak testi eksik değil ama bayat olarak işaretlenir", () => {
  const r = computeDataQuality(baseProfile({ soilTest: { ph: 6.5, ec: 1.2, organicMatterPct: 3, sampledAt: "2025-06-01" } }), NOW);
  const issue = r.issues.find((i) => i.field === "soilTest");
  assert.ok(issue, "13 aylık test bayat işaretlenmeli");
  assert.equal(issue!.kind, "bayat");
});

test("12 ay veya daha yeni test bayat SAYILMAZ", () => {
  const r = computeDataQuality(baseProfile({ soilTest: { ph: 6.5, ec: 1.2, organicMatterPct: 3, sampledAt: "2025-07-15" } }), NOW);
  assert.ok(!r.issues.some((i) => i.field === "soilTest"));
});

test("su testi eksikse ayrı bir sorun olarak listelenir", () => {
  const r = computeDataQuality(baseProfile({ waterTest: undefined }), NOW);
  const issue = r.issues.find((i) => i.field === "waterTest");
  assert.ok(issue);
  assert.equal(issue!.kind, "eksik");
});

test("birden fazla eksik alan skoru kümülatif düşürür", () => {
  const oneMissing = computeDataQuality(baseProfile({ soilTest: undefined }), NOW);
  const allMissing = computeDataQuality(
    baseProfile({ soilTest: undefined, waterTest: undefined, sunHoursObserved: undefined, exactLocationKnown: false }),
    NOW
  );
  assert.ok(allMissing.score < oneMissing.score);
  assert.equal(allMissing.grade, "dusuk");
});

test("skor her zaman 0-100 aralığında kalır (negatife düşmez)", () => {
  const r = computeDataQuality(
    baseProfile({ soilTest: undefined, waterTest: undefined, sunHoursObserved: undefined, exactLocationKnown: false }),
    NOW
  );
  assert.ok(r.score >= 0 && r.score <= 100);
});

test("grade eşikleri tutarlı: yuksek>=80, orta 50-79, dusuk<50", () => {
  const high = computeDataQuality(baseProfile(), NOW);
  assert.ok(high.score >= 80 && high.grade === "yuksek");

  const mid = computeDataQuality(baseProfile({ soilTest: undefined }), NOW); // -25 => 75
  assert.ok(mid.score >= 50 && mid.score < 80 && mid.grade === "orta");
});
