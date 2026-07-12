import { test } from "node:test";
import assert from "node:assert/strict";
import { PHOTO_CREDITS, primaryCredit, cropPhotoPath } from "../src/data/photoCredits.ts";
import { CROPS } from "../src/data/crops.ts";

test("her crops.ts ürününün BİRİNCİL fotoğraf kredisi vardır (sahte kesinlik yok — eksik olsaydı açıkça görünürdü)", () => {
  for (const crop of CROPS) {
    const credit = primaryCredit(crop.id);
    assert.ok(credit, `${crop.id} için birincil fotoğraf kredisi eksik`);
  }
});

test("cropPhotoPath: kredisi olan ürün için /photos/crops/<id>.jpg döner", () => {
  const crop = CROPS[0];
  assert.equal(cropPhotoPath(crop.id), `/photos/crops/${crop.id}.jpg`);
});

test("cropPhotoPath: bilinmeyen id için undefined döner (var olmayan görsele link verilmez)", () => {
  assert.equal(cropPhotoPath("olmayan-urun"), undefined);
});

test("her kredi kaydında lisans ve atıf metni dolu (CC BY-SA/CC BY yasal atıf zorunluluğu)", () => {
  for (const c of PHOTO_CREDITS) {
    assert.ok(c.license.length > 0, `${c.cropId}/${c.filename} lisans boş`);
    assert.ok(c.attributionText.length > 0, `${c.cropId}/${c.filename} atıf metni boş`);
    assert.ok(c.sourceUrl.startsWith("http"), `${c.cropId}/${c.filename} kaynak URL geçersiz`);
  }
});

test("bilinen 2 yaklaşık/analog görsel (biber-carliston, kabak-sakiz) isApproximation=true işaretli", () => {
  const carliston = primaryCredit("biber-carliston");
  const sakizKabagi = primaryCredit("kabak-sakiz");
  assert.equal(carliston?.isApproximation, true);
  assert.equal(sakizKabagi?.isApproximation, true);
});

test("yaklaşık İŞARETLENMEMİŞ ürünlerde isApproximation=false (sessizce true yapılmamış)", () => {
  const domates = primaryCredit("cherry-domates-kompakt");
  assert.equal(domates?.isApproximation, false);
});

test("role='primary' olan kayıt sayısı crops.ts ürün sayısına eşittir (birebir eşleşme)", () => {
  const primaryCount = PHOTO_CREDITS.filter((c) => c.role === "primary").length;
  assert.equal(primaryCount, CROPS.length);
});

test("her primary kayıt tam olarak bir crop_id'ye aittir (yinelenen birincil yok)", () => {
  const primaryIds = PHOTO_CREDITS.filter((c) => c.role === "primary").map((c) => c.cropId);
  assert.equal(new Set(primaryIds).size, primaryIds.length);
});
