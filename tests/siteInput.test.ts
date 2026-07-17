import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSiteInput, validateSoilTestInput, validateWaterTestInput } from "../src/lib/siteInput.ts";

// Tarih kuralları todayISO PARAMETRESİYLE test edilir — sistem saatine bağımlılık yok,
// testler her gün aynı sonucu verir (siteQuality.test.ts ile aynı determinizm ilkesi).
const TODAY = "2026-07-17";

// ---------- validateSiteInput ----------

test("geçerli alan girdisi kabul edilir ve ad kırpılır", () => {
  const r = validateSiteInput({ name: "  Arka bahçe  ", areaM2: 24, sunHoursObserved: 6, exactLocationKnown: true });
  assert.ok(r.ok);
  assert.equal(r.value.name, "Arka bahçe");
  assert.equal(r.value.areaM2, 24);
});

test("boş (yalnız boşluk) alan adı reddedilir", () => {
  const r = validateSiteInput({ name: "   ", areaM2: 24, exactLocationKnown: false });
  assert.equal(r.ok, false);
});

test("81+ karakter alan adı reddedilir", () => {
  const r = validateSiteInput({ name: "a".repeat(81), areaM2: 24, exactLocationKnown: false });
  assert.equal(r.ok, false);
});

test("areaM2 <= 0 reddedilir", () => {
  const r = validateSiteInput({ name: "Alan", areaM2: 0, exactLocationKnown: false });
  assert.equal(r.ok, false);
  const neg = validateSiteInput({ name: "Alan", areaM2: -5, exactLocationKnown: false });
  assert.equal(neg.ok, false);
});

test("areaM2 NaN ve Infinity dürüstçe reddedilir (sessiz 0'a düşme yok)", () => {
  const nan = validateSiteInput({ name: "Alan", areaM2: NaN, exactLocationKnown: false });
  assert.equal(nan.ok, false);
  const inf = validateSiteInput({ name: "Alan", areaM2: Infinity, exactLocationKnown: false });
  assert.equal(inf.ok, false);
});

test("çok küçük ama pozitif areaM2 kabul edilir (sınır değer)", () => {
  const r = validateSiteInput({ name: "Saksı köşesi", areaM2: 0.5, exactLocationKnown: false });
  assert.ok(r.ok);
});

test("güneş saati -1 ve 25 reddedilir, 0 ve 24 kabul edilir", () => {
  assert.equal(validateSiteInput({ name: "Alan", areaM2: 10, sunHoursObserved: -1, exactLocationKnown: false }).ok, false);
  assert.equal(validateSiteInput({ name: "Alan", areaM2: 10, sunHoursObserved: 25, exactLocationKnown: false }).ok, false);
  assert.ok(validateSiteInput({ name: "Alan", areaM2: 10, sunHoursObserved: 0, exactLocationKnown: false }).ok);
  assert.ok(validateSiteInput({ name: "Alan", areaM2: 10, sunHoursObserved: 24, exactLocationKnown: false }).ok);
});

test("güneş saati verilmezse (undefined) geçerli sayılır — 'gözlem yok' meşru bir durum", () => {
  const r = validateSiteInput({ name: "Alan", areaM2: 10, exactLocationKnown: false });
  assert.ok(r.ok);
  assert.equal(r.value.sunHoursObserved, undefined);
});

// ---------- validateSoilTestInput ----------

test("geçerli toprak testi kabul edilir", () => {
  const r = validateSoilTestInput({ ph: 6.4, ec: 1.1, organicMatterPct: 3.2, sampledAt: "2026-05-15" }, TODAY);
  assert.ok(r.ok);
});

test("ph 15 reddedilir, sınır değerler ph=0 ve ph=14 kabul edilir", () => {
  assert.equal(validateSoilTestInput({ ph: 15, ec: 1, organicMatterPct: 3, sampledAt: "2026-05-15" }, TODAY).ok, false);
  assert.ok(validateSoilTestInput({ ph: 0, ec: 1, organicMatterPct: 3, sampledAt: "2026-05-15" }, TODAY).ok);
  assert.ok(validateSoilTestInput({ ph: 14, ec: 1, organicMatterPct: 3, sampledAt: "2026-05-15" }, TODAY).ok);
});

test("ec aralık dışı (21) ve NaN reddedilir", () => {
  assert.equal(validateSoilTestInput({ ph: 6.5, ec: 21, organicMatterPct: 3, sampledAt: "2026-05-15" }, TODAY).ok, false);
  assert.equal(validateSoilTestInput({ ph: 6.5, ec: NaN, organicMatterPct: 3, sampledAt: "2026-05-15" }, TODAY).ok, false);
});

test("organik madde %101 reddedilir", () => {
  const r = validateSoilTestInput({ ph: 6.5, ec: 1, organicMatterPct: 101, sampledAt: "2026-05-15" }, TODAY);
  assert.equal(r.ok, false);
});

test("GELECEK tarihli örnekleme reddedilir — yapılmamış test kaydedilemez", () => {
  const r = validateSoilTestInput({ ph: 6.5, ec: 1, organicMatterPct: 3, sampledAt: "2026-07-18" }, TODAY);
  assert.equal(r.ok, false);
});

test("bugünün tarihi (sınır) kabul edilir", () => {
  const r = validateSoilTestInput({ ph: 6.5, ec: 1, organicMatterPct: 3, sampledAt: TODAY }, TODAY);
  assert.ok(r.ok);
});

test("geçersiz tarih biçimleri reddedilir: '2026-13-45' ve 'dün'", () => {
  assert.equal(validateSoilTestInput({ ph: 6.5, ec: 1, organicMatterPct: 3, sampledAt: "2026-13-45" }, TODAY).ok, false);
  assert.equal(validateSoilTestInput({ ph: 6.5, ec: 1, organicMatterPct: 3, sampledAt: "dün" }, TODAY).ok, false);
});

test("biçime uyan ama takvimde olmayan '2026-02-31' reddedilir (Date kaydırması yakalanır)", () => {
  const r = validateSoilTestInput({ ph: 6.5, ec: 1, organicMatterPct: 3, sampledAt: "2026-02-31" }, TODAY);
  assert.equal(r.ok, false);
});

// ---------- validateWaterTestInput ----------

test("geçerli su testi kabul edilir", () => {
  const r = validateWaterTestInput({ qualityOk: true, testedAt: "2026-06-01" }, TODAY);
  assert.ok(r.ok);
});

test("su testinde gelecek tarih ve geçersiz biçim reddedilir", () => {
  assert.equal(validateWaterTestInput({ qualityOk: true, testedAt: "2027-01-01" }, TODAY).ok, false);
  assert.equal(validateWaterTestInput({ qualityOk: true, testedAt: "geçen hafta" }, TODAY).ok, false);
});

test("hata mesajları Türkçe ve kullanıcıya gösterilebilir", () => {
  const r = validateSiteInput({ name: "", areaM2: 10, exactLocationKnown: false });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /Alan adı/);
});
