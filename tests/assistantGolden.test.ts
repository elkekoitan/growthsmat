// P11-11 — Asistan altın seti: her vaka ayrı test olarak koşar (granüler CI çıktısı).
// Set, asistanın davranış SÖZLEŞMESİDİR: bu testlerden biri kırılıyorsa ya motor
// regresyona uğradı ya da sözleşme BİLİNÇLİ değişti (vaka güncellemesi commit
// mesajında gerekçelendirilmelidir).
import { test } from "node:test";
import assert from "node:assert/strict";
import { askAssistant } from "../src/lib/assistant.ts";
import { GOLDEN_CASES, evaluateAnswer, runGoldenSet } from "../src/lib/assistantGoldenSet.ts";

for (const c of GOLDEN_CASES) {
  test(`ALTIN[${c.id}]: ${c.note}`, () => {
    const failures = evaluateAnswer(askAssistant(c.query, c.context), c.expect);
    assert.deepEqual(failures, [], `"${c.query}" → ${failures.join("; ")}`);
  });
}

test("ALTIN: set en az 25 vaka içerir ve id'ler benzersizdir", () => {
  assert.ok(GOLDEN_CASES.length >= 25, `yalnız ${GOLDEN_CASES.length} vaka var`);
  const ids = new Set(GOLDEN_CASES.map((c) => c.id));
  assert.equal(ids.size, GOLDEN_CASES.length, "tekrarlanan vaka id'si var");
});

test("ALTIN: runGoldenSet toplu koşucu tüm seti geçirir (harness sözleşmesi)", () => {
  const results = runGoldenSet();
  const failed = results.filter((r) => !r.pass);
  assert.deepEqual(failed, [], failed.map((f) => `${f.id}: ${f.failures.join("; ")}`).join(" | "));
});

test("ALTIN: harness gerçek bir kusuru YAKALAR (kendine-güven testi — totoloji değil)", () => {
  // Kasıtlı yanlış motor: her soruya kaynaksız kesin cevap veren "kötü" motor.
  const badEngine = () => ({
    query: "x",
    safetyBlocked: false,
    answer: "Kesinlikle 42 ml uygulayın.",
    citations: [],
    confidence: "yuksek" as const,
    suggestedAction: "",
  });
  const results = runGoldenSet(badEngine);
  const failed = results.filter((r) => !r.pass);
  assert.ok(failed.length >= GOLDEN_CASES.length / 2, "harness kötü motoru yakalayamadı — beklentiler çok gevşek");
});
