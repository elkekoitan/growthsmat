import { test } from "node:test";
import assert from "node:assert/strict";
import { askAssistant, classifySafetyBlock, EXAMPLE_QUESTIONS } from "../src/lib/assistant.ts";

test("GÜVENLİK: pestisit dozu sorusu bloklanır, cevap üretilmez", () => {
  const r = askAssistant("Domateste mildiyö için kaç ml ilaçlama yapmalıyım?");
  assert.equal(r.safetyBlocked, true);
  assert.ok(r.safetyReason && r.safetyReason.length > 0);
  assert.equal(r.citations.length, 0);
});

test("GÜVENLİK: tıbbi iddia sorusu bloklanır", () => {
  const r = askAssistant("Bu mikro filiz kanseri tedavi eder mi?");
  assert.equal(r.safetyBlocked, true);
});

test("GÜVENLİK: sıradan agronomik soru bloklanmaz", () => {
  const r = askAssistant("Balkonda cherry domates yetişir mi?");
  assert.equal(r.safetyBlocked, false);
});

test("Bilinen ürün eşleşince gerçek kaynak (citation) döner — uydurma yok", () => {
  const r = askAssistant("Cherry domates için sıcaklık ne kadar olmalı?");
  assert.equal(r.matchedCrop, "cherry-domates-kompakt");
  assert.ok(r.citations.length > 0);
  assert.ok(r.citations[0].title.length > 0 && r.citations[0].org.length > 0);
  assert.ok(["yuksek", "orta"].includes(r.confidence));
});

test("Bilinen mikro filiz eşleşince hasat günü ve verim gerçek veriden gelir", () => {
  const r = askAssistant("Bezelye filizi kaç günde hasat olur?");
  assert.equal(r.matchedMicrogreen, "bezelye");
  assert.match(r.answer, /\d+-\d+ günde hasada gelir/);
  assert.ok(r.citations.length >= 1);
});

test("SERT KISIT: mikro filizde bloklu tür (domates) sorulunca blok gerekçesiyle cevap verir, tarif üretmez", () => {
  const r = askAssistant("Domatesi mikro filiz olarak yetiştirebilir miyim?");
  assert.equal(r.safetyBlocked, false);
  assert.match(r.answer, /uygun değil/i);
  assert.match(r.answer, /Solanaceae/);
});

test("Satış/kanal sorusu CHANNELS verisinden gerçek kanal isimlerini kullanır", () => {
  const r = askAssistant("Etsy'de satış yaparken hangi ücretler kesilir?");
  assert.match(r.answer, /Etsy/);
  assert.ok(r.citations.length > 0);
});

test("DÜRÜSTLÜK: eşleşmeyen soru düşük güvenle veri boşluğunu açıkça bildirir, uydurmaz", () => {
  const r = askAssistant("Marsta hangi bitkiler yetişir?");
  assert.equal(r.confidence, "dusuk");
  assert.equal(r.citations.length, 0);
  assert.match(r.answer, /veri boşluğu|eşleştiremedim/i);
});

test("Boş sorguda net bir yönlendirme döner, hata fırlatmaz", () => {
  const r = askAssistant("   ");
  assert.equal(r.safetyBlocked, false);
  assert.ok(r.answer.length > 0);
});

test("Her cevapta suggestedAction dolu (asistan her zaman bir sonraki adımı gösterir)", () => {
  const queries = ["cherry domates", "bezelye filizi", "etsy satış", "bilinmeyen konu xyz"];
  for (const q of queries) {
    const r = askAssistant(q);
    assert.ok(r.suggestedAction.length > 0, `'${q}' için suggestedAction boş olamaz`);
  }
});

test("EXAMPLE_QUESTIONS her biri gerçek bir yanıt üretir (kırık örnek yok)", () => {
  assert.ok(EXAMPLE_QUESTIONS.length >= 3);
  for (const q of EXAMPLE_QUESTIONS) {
    const r = askAssistant(q);
    assert.ok(r.answer.length > 0);
  }
});

test("classifySafetyBlock: pestisit dozu deseniyle eşleşince 'girdi-dozu' döner", () => {
  assert.equal(classifySafetyBlock("Domateste mildiyö için kaç ml ilaçlama yapmalıyım?"), "girdi-dozu");
});

test("classifySafetyBlock: tıbbi iddia deseniyle eşleşince 'tibbi-iddia' döner", () => {
  assert.equal(classifySafetyBlock("Bu mikro filiz kanseri tedavi eder mi?"), "tibbi-iddia");
});

test("classifySafetyBlock: sıradan soruda undefined döner (yanlış pozitif yok)", () => {
  assert.equal(classifySafetyBlock("Balkonda cherry domates yetişir mi?"), undefined);
});
