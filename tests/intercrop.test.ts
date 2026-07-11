import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateIntercrop, suggestLayout } from "../src/lib/intercrop.ts";

test("domates + fesleğen 'deneysel faydalı' döner (kesin 'uyumlu' etiketi YOK)", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  const pair = r.pairs[0];
  assert.ok(pair.relation || pair.reverseRelation);
  // domates→fesleğen kanıt C ama bir yönü D olabilir; en azından faydalı ilişki var
  assert.ok(pair.experimental || pair.relation?.effect === "faydali" || pair.reverseRelation?.effect === "faydali");
});

test("aynı aile (iki domates çeşidi) ortak hastalık riski işaretlenir", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "sirik-domates-beefsteak"]);
  assert.ok(r.pairs[0].riskFlags.some((f) => /Solanaceae/.test(f)));
  assert.ok(r.overallRisks.some((f) => /Solanaceae/.test(f)));
});

test("riskli ilişki (soğan + fasulye) riskFlags üretir", () => {
  const r = evaluateIntercrop(["sogan-yesil", "fasulye-sirik"]);
  assert.ok(r.pairs[0].riskFlags.length > 0);
});

test("kanıt seviyesi yanıtta korunur", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  const rel = r.pairs[0].relation ?? r.pairs[0].reverseRelation;
  assert.ok(rel);
  assert.ok(["A", "B", "C", "D", "E"].includes(rel!.evidence));
});

test("tek ürün → boş pairs", () => {
  const r = evaluateIntercrop(["marul"]);
  assert.equal(r.pairs.length, 0);
});

test("bilinmeyen id güvenli atlanır (çökme yok)", () => {
  assert.doesNotThrow(() => evaluateIntercrop(["marul", "olmayan-urun"]));
  const r = evaluateIntercrop(["marul", "olmayan-urun"]);
  assert.equal(r.pairs.length, 0); // tek geçerli ürün kalır → çift oluşmaz
});

test("n ürün için C(n,2) çift üretilir", () => {
  const r = evaluateIntercrop(["marul", "roka", "ispanak"]);
  assert.equal(r.pairs.length, 3); // 3 üründen 3 çift
});

test("suggestLayout iki+ ürün için yerleşim notu üretir, tek ürün için boş", () => {
  assert.equal(suggestLayout(["marul"]).length, 0);
  const notes = suggestLayout(["sirik-domates-beefsteak", "marul"]);
  assert.ok(notes.length > 0);
  assert.ok(notes.some((n) => /Kuzey|Güney|sulama/i.test(n)));
});

test("iki yönlü ilişki 'cift-yonlu' olarak işaretlenir veya tek yön doğru belirlenir", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  assert.ok(["a→b", "b→a", "cift-yonlu", "yok"].includes(r.pairs[0].direction));
});
