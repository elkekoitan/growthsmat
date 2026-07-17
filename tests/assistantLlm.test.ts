// P11-01 Model Gateway'in SAF katmanı testleri (src/lib/assistantLlm.ts).
// Ağ/DB/SDK yok — yalnız karar mantığı (shouldCallLlm) ve prompt inşası test edilir.
// Gerçek API çağrısı src/server/llm.ts'te env-gated'dir ve canlıda doğrulanır.
import { test } from "node:test";
import assert from "node:assert/strict";
import { askAssistant, type AssistantContext } from "../src/lib/assistant.ts";
import { buildLlmSystemPrompt, shouldCallLlm, DEFAULT_LLM_MODEL, type AssistantReply } from "../src/lib/assistantLlm.ts";

const CONTEXT: AssistantContext = {
  crops: [
    { cropId: "cherry-domates-kompakt", status: "hasat", zone: "balkon" },
    { cropId: "feslegen", status: "buyuyor", zone: "mutfak" },
  ],
  tasksToday: [{ title: "Rizom saksısını kontrol et", cropId: "nane", type: "gozlem" }],
  tasksOverdue: 3,
};

// ---------- shouldCallLlm: güvenlik filtresi kararı NİHAİ ----------

test("LLM-GATE: güvenlik filtresinin blokladığı soru LLM'e GİTMEZ", () => {
  const blocked = askAssistant("Domateste mildiyö için kaç ml ilaçlama yapmalıyım?");
  assert.equal(blocked.safetyBlocked, true);
  assert.equal(shouldCallLlm(blocked), false);
});

test("LLM-GATE: tıbbi iddia sorusu da LLM'e gitmez", () => {
  const blocked = askAssistant("Bu mikro filiz kanseri tedavi eder mi?");
  assert.equal(shouldCallLlm(blocked), false);
});

test("LLM-GATE: boş sorgu LLM'e gitmez (API'ye boş user mesajı gönderilmez)", () => {
  const empty = askAssistant("   ");
  assert.equal(shouldCallLlm(empty), false);
});

test("LLM-GATE: sıradan agronomik soru LLM'e gidebilir", () => {
  const ok = askAssistant("Balkonda cherry domates yetişir mi?");
  assert.equal(ok.safetyBlocked, false);
  assert.equal(shouldCallLlm(ok), true);
});

// ---------- buildLlmSystemPrompt: gerçek kayıtlar + dürüstlük kuralları ----------

test("PROMPT: kullanıcının GERÇEK bahçe satırları prompt'a girer (ürün adı + durum + bölge)", () => {
  const rule = askAssistant("Bahçemde ne var?", CONTEXT);
  const prompt = buildLlmSystemPrompt(CONTEXT, rule);
  assert.ok(prompt.includes("Cherry Domates"));
  assert.ok(prompt.includes("hasada hazır"));
  assert.ok(prompt.includes("balkon"));
  assert.ok(prompt.includes("Fesleğen"));
});

test("PROMPT: bugünkü görevler ve gecikmiş görev sayısı gerçek satırlardan gelir", () => {
  const rule = askAssistant("Bugün ne yapmalıyım?", CONTEXT);
  const prompt = buildLlmSystemPrompt(CONTEXT, rule);
  assert.ok(prompt.includes("Rizom saksısını kontrol et"));
  assert.ok(prompt.includes("Gecikmiş açık görev sayısı: 3"));
});

test("PROMPT: dürüstlük/güvenlik kuralları her prompt'ta sabit", () => {
  const rule = askAssistant("Balkonda cherry domates yetişir mi?", CONTEXT);
  const prompt = buildLlmSystemPrompt(CONTEXT, rule);
  assert.ok(prompt.includes("ASLA önerme"), "pestisit dozu yasağı olmalı");
  assert.ok(/tıbbi\/sağlık iddiası/i.test(prompt), "tıbbi iddia yasağı olmalı");
  assert.ok(prompt.includes("Sahte kesinlik yasak"));
});

test("PROMPT: kural motorunun referans cevabı ve gerçek kaynakları prompt'a gömülür", () => {
  const rule = askAssistant("Cherry domates için sıcaklık ne kadar olmalı?", CONTEXT);
  const prompt = buildLlmSystemPrompt(CONTEXT, rule);
  assert.ok(prompt.includes(rule.answer), "kural motoru cevabı referans olarak girer");
  assert.ok(rule.citations.length > 0);
  assert.ok(prompt.includes(rule.citations[0].title), "gerçek kaynak başlığı prompt'ta");
});

test("PROMPT: oturum yoksa kişisel veri OLMADIĞI açıkça yazılır", () => {
  const rule = askAssistant("Bahçemde ne var?", null);
  const prompt = buildLlmSystemPrompt(null, rule);
  assert.ok(prompt.includes("giriş yapmamış"));
  assert.ok(prompt.includes("kişisel bahçe/görev verisi YOK"));
});

test("PROMPT: boş bahçe dürüstçe 'boş' yazılır — uydurma satır yok", () => {
  const emptyCtx: AssistantContext = { crops: [], tasksToday: [], tasksOverdue: 0 };
  const rule = askAssistant("Bahçemde ne var?", emptyCtx);
  const prompt = buildLlmSystemPrompt(emptyCtx, rule);
  assert.ok(prompt.includes("Bahçe kaydı: boş"));
  assert.ok(prompt.includes("Bugünkü açık görev: yok"));
});

test("PROMPT: bilgi grafiğinde eşleşme yoksa 'kaynak yok' dürüstçe belirtilir", () => {
  const rule = askAssistant("Ay tozunda kinoa yetişir mi?", CONTEXT);
  assert.equal(rule.citations.length, 0);
  const prompt = buildLlmSystemPrompt(CONTEXT, rule);
  assert.ok(prompt.includes("Kaynak: yok"));
});

// ---------- Tip/sabit sözleşmeleri ----------

test("SÖZLEŞME: varsayılan model claude-opus-4-8", () => {
  assert.equal(DEFAULT_LLM_MODEL, "claude-opus-4-8");
  // AssistantReply'ın AssistantAnswer'ı source alanıyla genişlettiği derleme
  // zamanında doğrulanır (aşağıdaki atama tsc'de tip hatası verirse sözleşme bozuldu):
  const _typeCheck: AssistantReply = { ...askAssistant("Balkonda cherry domates yetişir mi?"), source: "llm" };
  assert.ok(_typeCheck.answer.length > 0);
});
