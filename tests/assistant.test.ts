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

test("GÜVENLİK: 'ne kadar ilaç atmalıyım' gibi doz-niyetli soru da bloklanır (2026-07-17 genişletme)", () => {
  assert.equal(askAssistant("Domatese ne kadar ilaç atmalıyım?").safetyBlocked, true);
  assert.equal(askAssistant("Fesleğene ilaç atayım mı?").safetyBlocked, true);
  assert.equal(askAssistant("Kaç gram uygulamalıyım bu üründen?").safetyBlocked, true);
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

// ---------- Kişisel bağlam (AssistantContext) testleri ----------

const CTX = {
  crops: [
    { cropId: "cherry-domates-kompakt", status: "buyuyor", zone: "Balkon — Güney" },
    { cropId: "feslegen", status: "ekildi", zone: "Mutfak pervazı" },
  ],
  tasksToday: [
    { title: "Sabah sulaması", cropId: "feslegen", type: "sulama" },
    { title: "Koltuk alma", cropId: "cherry-domates-kompakt", type: "budama" },
  ],
  tasksOverdue: 2,
};

test("KİŞİSEL: context'li 'bahçemde ne var' gerçek listeden cevap verir (uydurma yok)", () => {
  const r = askAssistant("Bahçemde ne var?", CTX);
  assert.equal(r.safetyBlocked, false);
  assert.match(r.answer, /2 ürün/);
  assert.match(r.answer, /Cherry Domates/);
  assert.match(r.answer, /Fesleğen/);
  assert.match(r.answer, /Balkon — Güney/);
  assert.ok(r.citations.some((c) => c.title === "Bahçem kaydın"));
  assert.equal(r.confidence, "yuksek");
});

test("KİŞİSEL: context'li 'bugün ne yapmalıyım' gerçek görev başlıkları + gecikmiş sayısı döner", () => {
  const r = askAssistant("Bugün ne yapmalıyım?", CTX);
  assert.match(r.answer, /Sabah sulaması/);
  assert.match(r.answer, /Koltuk alma/);
  assert.match(r.answer, /2 gecikmiş/);
  assert.ok(r.citations.some((c) => c.title === "Görev takvimin"));
});

test("KİŞİSEL: bahçedeki ürün sorulunca genel cevaba gerçek 'senin bahçende' satırı eklenir", () => {
  const r = askAssistant("Cherry domates için sıcaklık ne kadar olmalı?", CTX);
  assert.equal(r.matchedCrop, "cherry-domates-kompakt");
  assert.match(r.answer, /Senin bahçende Cherry Domates/);
  assert.match(r.answer, /bölge: Balkon — Güney/);
  assert.ok(r.citations.some((c) => c.title === "Bahçem kaydın"));
});

test("GERİYE UYUM: context'siz çağrı eski davranışla birebir aynı (kişisel satır yok)", () => {
  const oldStyle = askAssistant("Cherry domates için sıcaklık ne kadar olmalı?");
  const withNull = askAssistant("Cherry domates için sıcaklık ne kadar olmalı?", null);
  assert.deepEqual(oldStyle, withNull);
  assert.equal(oldStyle.matchedCrop, "cherry-domates-kompakt");
  assert.doesNotMatch(oldStyle.answer, /Senin bahçende/);
  assert.ok(!oldStyle.citations.some((c) => c.title === "Bahçem kaydın"));
});

test("GERİYE UYUM: context'siz 'bahçem' sorusu veri boşluğu + dürüst giriş notu döner", () => {
  const r = askAssistant("Bahçemde ne var?");
  assert.equal(r.confidence, "dusuk");
  assert.match(r.answer, /Giriş yaparsan/);
  assert.equal(r.citations.length, 0);
});

test("GÜVENLİK: kişisel bağlam güvenlik filtresini BYPASS EDEMEZ", () => {
  const r = askAssistant("Bahçemdeki domateslere kaç ml ilaçlama yapmalıyım?", CTX);
  assert.equal(r.safetyBlocked, true);
  assert.equal(r.citations.length, 0);
  assert.doesNotMatch(r.answer, /Senin bahçende/);
});

test("KİŞİSEL: boş bahçe dürüstçe 'kayıt yok' der, sahte liste üretmez", () => {
  const r = askAssistant("Bahçemde neler var?", { crops: [], tasksToday: [], tasksOverdue: 0 });
  assert.match(r.answer, /boş|kayıt yok/i);
  assert.doesNotMatch(r.answer, /takip ediyorsun:/);
});

test("KİŞİSEL: bugüne görev yoksa dürüstçe 'planlanmış işin yok' der", () => {
  const r = askAssistant("Bugünkü işler neler?", { crops: [], tasksToday: [], tasksOverdue: 0 });
  assert.match(r.answer, /Bugüne planlanmış işin yok/);
});
