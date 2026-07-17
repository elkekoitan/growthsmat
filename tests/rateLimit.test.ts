// P11-01 hız sınırlayıcı testleri — pencere/temizlik mantığı saf katmanda doğrulanır
// (review bulgusu: bu mantık daha önce sıfır testliydi).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter, clientIpFromForwarded } from "../src/lib/rateLimit.ts";

test("HIZ SINIRI: pencere içinde tam olarak maxPerWindow çağrıya izin verir", () => {
  const rl = createRateLimiter(60_000, 3);
  const t0 = 1_000_000;
  assert.equal(rl.allow("a", t0), true);
  assert.equal(rl.allow("a", t0 + 1), true);
  assert.equal(rl.allow("a", t0 + 2), true);
  assert.equal(rl.allow("a", t0 + 3), false, "4. çağrı reddedilmeli");
  assert.equal(rl.countFor("a", t0 + 3), 3);
});

test("HIZ SINIRI: pencere kayınca eski çağrılar düşer, izin geri gelir", () => {
  const rl = createRateLimiter(60_000, 2);
  const t0 = 1_000_000;
  assert.equal(rl.allow("a", t0), true);
  assert.equal(rl.allow("a", t0 + 1_000), true);
  assert.equal(rl.allow("a", t0 + 2_000), false);
  // İlk çağrının üzerinden 60 sn geçti → pencerede tek çağrı kaldı → izin var.
  assert.equal(rl.allow("a", t0 + 60_001), true);
});

test("HIZ SINIRI: anahtarlar birbirinden bağımsız sayılır", () => {
  const rl = createRateLimiter(60_000, 1);
  const t0 = 1_000_000;
  assert.equal(rl.allow("u:1", t0), true);
  assert.equal(rl.allow("u:1", t0 + 1), false);
  assert.equal(rl.allow("ip:9.9.9.9", t0 + 2), true, "farklı anahtar etkilenmez");
});

test("HIZ SINIRI: reddedilen çağrı sayaca EKLENMEZ (ceza penceresi uzamaz)", () => {
  const rl = createRateLimiter(60_000, 1);
  const t0 = 1_000_000;
  assert.equal(rl.allow("a", t0), true);
  assert.equal(rl.allow("a", t0 + 10), false);
  assert.equal(rl.allow("a", t0 + 20), false);
  // İlk (tek sayılan) çağrı penceresi dolunca izin dönmeli — redler pencereyi uzatmamalı.
  assert.equal(rl.allow("a", t0 + 60_001), true);
});

test("HIZ SINIRI: temizlik aktif anahtarları DÜŞÜRMEZ, boşalmışları atar", () => {
  const rl = createRateLimiter(60_000, 5);
  const t0 = 1_000_000;
  // 1001 bayat anahtar üret (pencereleri t0+120sn'de tamamen boş olacak).
  for (let i = 0; i < 1001; i++) rl.allow(`bayat:${i}`, t0);
  // Aktif anahtar: pencere içinde 2 çağrı.
  rl.allow("aktif", t0 + 100_000);
  rl.allow("aktif", t0 + 110_000);
  // Yeni çağrı temizliği tetikler (size > 1000); aktif anahtarın sayacı korunmalı.
  rl.allow("tetik", t0 + 120_000);
  assert.equal(rl.countFor("aktif", t0 + 120_000), 2, "aktif anahtar temizlikte silinmemeli");
  assert.equal(rl.countFor("bayat:0", t0 + 120_000), 0);
});

// ---------- clientIpFromForwarded (brute-force anahtarının güvenliği) ----------

test("XFF-IP: en SAĞDAKİ girdi alınır (güvenilir proxy'nin eklediği), sol spoof'lanmaz", () => {
  // Saldırgan soldaki girdiyi uydurabilir; biz en sağı (proxy'nin gerçek IP'si) almalıyız.
  assert.equal(clientIpFromForwarded("1.1.1.1, 2.2.2.2, 9.9.9.9"), "9.9.9.9");
  assert.equal(clientIpFromForwarded("203.0.113.7"), "203.0.113.7");
});

test("XFF-IP: boşluklar kırpılır, boş girdiler atlanır", () => {
  assert.equal(clientIpFromForwarded("  1.1.1.1 ,  2.2.2.2  "), "2.2.2.2");
  assert.equal(clientIpFromForwarded("1.1.1.1, , "), "1.1.1.1");
});

test("XFF-IP: başlık yok/boş → 'yerel' (dev/edge)", () => {
  assert.equal(clientIpFromForwarded(null), "yerel");
  assert.equal(clientIpFromForwarded(undefined), "yerel");
  assert.equal(clientIpFromForwarded(""), "yerel");
  assert.equal(clientIpFromForwarded("  ,  "), "yerel");
});

test("BRUTE-FORCE senaryosu: bir IP'nin 30 başarısız denemesinden sonra o IP kısıtlanır", () => {
  // auth.ts login kapısı per-IP throttle kullanır (per-HESAP kilidi YOK — targeted
  // lockout DoS önlemek için, bkz. auth.ts tasarım notu). Modelle:
  const byIp = createRateLimiter(15 * 60_000, 30);
  const t0 = 5_000_000;
  const key = "login:203.0.113.9";
  for (let i = 0; i < 30; i++) {
    assert.ok(byIp.countFor(key, t0 + i) < 30, `deneme ${i} henüz kısıtlı olmamalı`);
    byIp.allow(key, t0 + i);
  }
  // 31. denemede o IP için kapı kapanır.
  assert.ok(byIp.countFor(key, t0 + 30) >= 30, "30 başarısızdan sonra IP kısıtı devrede");
  // FARKLI IP etkilenmez — belirli bir kurban hesabı küresel kilitlenemez (DoS yok).
  assert.equal(byIp.countFor("login:198.51.100.2", t0 + 30), 0);
});
