// "Canlıya çıkış" hazırlık listesi — durum mantığı testleri (SAF katman).
// Dürüstlük sözleşmesi: bir madde ancak GERÇEKTEN hazırsa "hazir" gösterilir;
// bayrak değişince durum/adım/statusNote doğru döner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveGoLiveItems, summarizeGoLive, type GoLiveFlags } from "../src/lib/goLive.ts";

const ALL_READY: GoLiveFlags = { llmEnabled: true, paymentKeySet: true, isHttps: true, dbReady: true };
const NONE: GoLiveFlags = { llmEnabled: false, paymentKeySet: false, isHttps: false, dbReady: false };

function byId(flags: GoLiveFlags) {
  return Object.fromEntries(deriveGoLiveItems(flags).map((i) => [i.id, i]));
}

test("CANLIYA ÇIKIŞ: LLM anahtarı yoksa madde 'bekleniyor' ve adım/link içerir", () => {
  const items = byId(NONE);
  assert.equal(items["ai-asistan"].status, "bekleniyor");
  assert.ok(items["ai-asistan"].steps.length > 0, "eksikse adım gösterilmeli");
  assert.ok(items["ai-asistan"].links.some((l) => l.url.includes("console.anthropic.com")));
});

test("CANLIYA ÇIKIŞ: LLM anahtarı varsa 'hazir' ve adım YOK", () => {
  const items = byId({ ...NONE, llmEnabled: true });
  assert.equal(items["ai-asistan"].status, "hazir");
  assert.equal(items["ai-asistan"].steps.length, 0, "hazırsa adım gösterilmez");
});

test("CANLIYA ÇIKIŞ: veritabanı hazırsa 'hazir', değilse 'bekleniyor'", () => {
  assert.equal(byId(ALL_READY)["veritabani"].status, "hazir");
  assert.equal(byId(NONE)["veritabani"].status, "bekleniyor");
});

test("CANLIYA ÇIKIŞ: ödeme HER ZAMAN 'bekleniyor' (entegrasyon kullanıcı sağlayıcısına bağlı)", () => {
  // Anahtar görülse bile entegrasyon kodu sağlayıcı seçimine bağlı olduğundan dürüstçe bekleniyor.
  assert.equal(byId(ALL_READY)["odeme"].status, "bekleniyor");
  assert.equal(byId(NONE)["odeme"].status, "bekleniyor");
  const withKey = byId({ ...NONE, paymentKeySet: true })["odeme"];
  assert.ok(withKey.statusNote.includes("entegrasyon"), "anahtar görülünce not değişir");
});

test("CANLIYA ÇIKIŞ: HTTPS varsa alan adı 'hazir', yoksa 'opsiyonel' (HTTP'de çalışmaya devam eder)", () => {
  assert.equal(byId(ALL_READY)["alan-adi-tls"].status, "hazir");
  assert.equal(byId(NONE)["alan-adi-tls"].status, "opsiyonel");
});

test("CANLIYA ÇIKIŞ: otomatik deploy her zaman opsiyonel", () => {
  assert.equal(byId(ALL_READY)["otomatik-deploy"].status, "opsiyonel");
  assert.equal(byId(NONE)["otomatik-deploy"].status, "opsiyonel");
});

test("CANLIYA ÇIKIŞ: tüm linkler https ve mutlak URL", () => {
  for (const item of deriveGoLiveItems(NONE)) {
    for (const l of item.links) {
      assert.match(l.url, /^https:\/\//, `${item.id} linki https değil: ${l.url}`);
      assert.ok(l.label.length > 0);
    }
  }
});

test("CANLIYA ÇIKIŞ: özet sayaçları toplamı madde sayısına eşit", () => {
  const items = deriveGoLiveItems(ALL_READY);
  const s = summarizeGoLive(items);
  assert.equal(s.hazir + s.bekleniyor + s.opsiyonel, s.toplam);
  assert.equal(s.toplam, items.length);
  // Hepsi hazır bayrağında bile ödeme bekleniyor + otomatik-deploy opsiyonel kalır (dürüstlük).
  assert.ok(s.bekleniyor >= 1, "ödeme her zaman bekleniyor");
  assert.ok(s.opsiyonel >= 1, "otomatik deploy opsiyonel");
});

test("CANLIYA ÇIKIŞ: id'ler benzersiz, başlık/why dolu", () => {
  const items = deriveGoLiveItems(NONE);
  const ids = new Set(items.map((i) => i.id));
  assert.equal(ids.size, items.length);
  for (const i of items) {
    assert.ok(i.title.length > 0 && i.why.length > 0 && i.statusNote.length > 0);
  }
});
