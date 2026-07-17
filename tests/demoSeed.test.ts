// Örnek-kayıt tespiti testleri: tohum kimliği sözleşmesi (@ornek.com) UI etiketinin
// tek dayanağıdır — sözleşme bozulursa bu testler kırılmalı.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isSeedIdentity, SEED_IDENTITY_SUFFIX } from "../src/lib/demoSeed.ts";

test("ÖRNEK KAYIT: tohum kimlikleri tespit edilir", () => {
  assert.equal(isSeedIdentity("uretici@ornek.com"), true);
  assert.equal(isSeedIdentity("baska-uretici@ornek.com"), true);
  assert.equal(isSeedIdentity("  URETICI@ORNEK.COM  "), true, "büyük harf + boşluk toleransı");
});

test("ÖRNEK KAYIT: gerçek kullanıcı kimlikleri etiketlenmez", () => {
  assert.equal(isSeedIdentity("wee6134@gmail.com"), false);
  assert.equal(isSeedIdentity("ornek.com@gmail.com"), false, "sonek ORTADA değil SONDA aranır");
  assert.equal(isSeedIdentity("uretici@ornek.com.tr"), false, "farklı TLD tohum sayılmaz");
  assert.equal(isSeedIdentity(""), false);
});

test("ÖRNEK KAYIT: sözleşme soneki sabit", () => {
  assert.equal(SEED_IDENTITY_SUFFIX, "@ornek.com");
});
