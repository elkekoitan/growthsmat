import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXPERTS,
  canAnswerConsultation,
  matchExperts,
  openCase,
  openCaseFromSafetyBlock,
  suggestSpecialtyForQuery,
  assignCase,
  answerCase,
  closeCase,
  type ConsultationCase,
  type OpenCaseInput,
} from "../src/lib/expertConsult.ts";
import type { AssistantAnswer } from "../src/lib/assistant.ts";

const NOW = "2026-07-10T10:00:00Z";

function caseInput(over: Partial<OpenCaseInput> = {}): OpenCaseInput {
  return {
    askedBy: "uretici@ornek.com",
    specialty: "bitki-korumasi",
    question: "Domateste mildiyö için kaç ml ilaçlama yapmalıyım?",
    urgency: "orta",
    escalationSource: "dogrudan-talep",
    ...over,
  };
}

test("openCase yeni vakayı 'acik' durumunda ve CASE-1 kimliğiyle oluşturur", () => {
  const c = openCase(caseInput(), NOW, []);
  assert.equal(c.status, "acik");
  assert.equal(c.id, "CASE-1");
  assert.equal(c.createdAtISO, NOW);
});

test("canAnswerConsultation: yalnız compliance.review izinli roller true döner", () => {
  assert.equal(canAnswerConsultation("uzman"), true);
  assert.equal(canAnswerConsultation("kalite"), true);
  assert.equal(canAnswerConsultation("sahip"), true);
  assert.equal(canAnswerConsultation("satis"), false);
  assert.equal(canAnswerConsultation("goruntuleyici"), false);
});

test("matchExperts: yalnız uzmanlık alanı eşleşen VE doğrulanmış uzmanları döner", () => {
  const result = matchExperts(EXPERTS, "bitki-korumasi");
  const ids = result.map((e) => e.id);
  assert.ok(ids.includes("exp-naz"));
  assert.ok(!ids.includes("exp-baris")); // doğrulanmamış
  assert.ok(!ids.includes("exp-mert")); // farklı uzmanlık
});

test("matchExperts: onlyVerified=false ile doğrulanmamış/askıda uzmanlar da dahil olur", () => {
  const result = matchExperts(EXPERTS, "bitki-korumasi", false);
  assert.ok(result.some((e) => e.id === "exp-baris"));
});

test("matchExperts: sonuç ortalama yanıt süresine göre artan sırada döner", () => {
  const result = matchExperts(EXPERTS, "gida-guvenligi");
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i - 1].avgResponseHours <= result[i].avgResponseHours);
  }
});

test("assignCase: yetkisiz rol reddedilir, durum değişmez", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const r = assignCase(c, naz, "satis", NOW);
  assert.equal(r.applied, false);
  assert.equal(r.consultCase.status, "acik");
});

test("assignCase: doğrulanmamış uzmana atama reddedilir", () => {
  const c = openCase(caseInput(), NOW, []);
  const baris = EXPERTS.find((e) => e.id === "exp-baris")!;
  const r = assignCase(c, baris, "kalite", NOW);
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /doğrulanmış/);
});

test("assignCase: uzmanlık alanı eşleşmeyen uzmana atama reddedilir", () => {
  const c = openCase(caseInput({ specialty: "toprak-bilimi" }), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!; // bitki-korumasi/gida-guvenligi, toprak-bilimi değil
  const r = assignCase(c, naz, "kalite", NOW);
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /eşleşmiyor/);
});

test("assignCase: uygun doğrulanmış uzmana atama başarılı olur", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const r = assignCase(c, naz, "kalite", "2026-07-10T12:00:00Z");
  assert.equal(r.applied, true);
  assert.equal(r.consultCase.status, "atandi");
  assert.equal(r.consultCase.assignedExpertId, "exp-naz");
  assert.equal(r.consultCase.assignedAtISO, "2026-07-10T12:00:00Z");
});

test("assignCase: zaten atanmış vaka İKİNCİ KEZ atanamaz (idempotent koruma)", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const first = assignCase(c, naz, "kalite", NOW);
  const second = assignCase(first.consultCase, naz, "kalite", NOW);
  assert.equal(second.applied, false);
});

test("answerCase: 'acik' (atanmamış) vaka doğrudan yanıtlanamaz", () => {
  const c = openCase(caseInput(), NOW, []);
  const r = answerCase(c, "uzman", "exp-naz", "Bir yanıt", "C", NOW);
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /atanmış/);
});

test("answerCase: yalnız atanan uzman yanıtlayabilir — başka uzman reddedilir", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const r = answerCase(assigned, "uzman", "exp-selin", "Bir yanıt", "C", NOW);
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /atanan uzman/);
});

test("answerCase: başarılı yanıt evidence grade + answeredAtISO ile kaydedilir", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const r = answerCase(assigned, "uzman", "exp-naz", "Etikette belirtilen doza uy.", "C", "2026-07-11T09:00:00Z");
  assert.equal(r.applied, true);
  assert.equal(r.consultCase.status, "yanitlandi");
  assert.equal(r.consultCase.answerEvidence, "C");
  assert.equal(r.consultCase.answeredAtISO, "2026-07-11T09:00:00Z");
});

test("answerCase: boş yanıt kaydedilemez", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const r = answerCase(assigned, "uzman", "exp-naz", "   ", "C", NOW);
  assert.equal(r.applied, false);
});

test("DÜRÜSTLÜK: yeni/atanmış vakada answerEvidence tanımsızdır (sahte kesinlik yok)", () => {
  const c = openCase(caseInput(), NOW, []);
  assert.equal(c.answerEvidence, undefined);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  assert.equal(assigned.answerEvidence, undefined);
});

test("DÜRÜSTLÜK: yanıtlanmış vaka İKİNCİ KEZ yanıtlanamaz — kanıt seviyesi sessizce yükseltilemez", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const first = answerCase(assigned, "uzman", "exp-naz", "İlk yanıt", "D", NOW);
  const second = answerCase(first.consultCase, "uzman", "exp-naz", "Daha iddialı yanıt", "A", NOW);
  assert.equal(second.applied, false);
  assert.equal(first.consultCase.answerEvidence, "D");
});

test("closeCase: yalnız yanıtlanmış vaka kapatılabilir", () => {
  const c = openCase(caseInput(), NOW, []);
  const r = closeCase(c, "uretici@ornek.com", "saha-calisani", NOW);
  assert.equal(r.applied, false);
});

test("closeCase: soran kişi kendi yanıtlanmış vakasını kapatabilir", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const answered = answerCase(assigned, "uzman", "exp-naz", "Yanıt", "C", NOW).consultCase;
  const r = closeCase(answered, "uretici@ornek.com", "saha-calisani", NOW);
  assert.equal(r.applied, true);
  assert.equal(r.consultCase.status, "kapatildi");
});

test("closeCase: yetkisiz üçüncü kişi kapatamaz", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const answered = answerCase(assigned, "uzman", "exp-naz", "Yanıt", "C", NOW).consultCase;
  const r = closeCase(answered, "baskasi@ornek.com", "satis", NOW);
  assert.equal(r.applied, false);
});

test("closeCase: compliance.review izinli rol başkasının vakasını da kapatabilir", () => {
  const c = openCase(caseInput(), NOW, []);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  const assigned = assignCase(c, naz, "kalite", NOW).consultCase;
  const answered = answerCase(assigned, "uzman", "exp-naz", "Yanıt", "C", NOW).consultCase;
  const r = closeCase(answered, "kalite-yetkilisi@ornek.com", "kalite", NOW);
  assert.equal(r.applied, true);
});

test("suggestSpecialtyForQuery: pestisit/tıbbi iddia sorularına doğru uzmanlık alanı önerir, sıradan soruda undefined", () => {
  assert.equal(suggestSpecialtyForQuery("Kaç ml ilaçlama yapmalıyım?"), "bitki-korumasi");
  assert.equal(suggestSpecialtyForQuery("Bu bitki kanseri tedavi eder mi?"), "gida-guvenligi");
  assert.equal(suggestSpecialtyForQuery("Balkonda domates yetişir mi?"), undefined);
});

test("openCaseFromSafetyBlock: güvenlik blok cevabından vaka oluşturur, escalationSource ve escalationReason set edilir", () => {
  const answer: AssistantAnswer = {
    query: "Kaç ml ilaçlama yapmalıyım?",
    safetyBlocked: true,
    safetyReason: "Pestisit/girdi dozu resmi olarak doğrulanmadan önerilemez.",
    answer: "Pestisit/girdi dozu resmi olarak doğrulanmadan önerilemez.",
    citations: [],
    confidence: "dusuk",
    suggestedAction: "Uzman danışmanlığı talep et.",
  };
  const c = openCaseFromSafetyBlock(answer, "uretici@ornek.com", NOW, []);
  assert.equal(c.escalationSource, "asistan-guvenlik-blok");
  assert.equal(c.escalationReason, answer.safetyReason);
  assert.equal(c.specialty, "bitki-korumasi");
  assert.equal(c.question, answer.query);
});

test("giriş consultCase objesi mutate edilmez (immutability)", () => {
  const c = openCase(caseInput(), NOW, []);
  const snapshot = JSON.stringify(c);
  const naz = EXPERTS.find((e) => e.id === "exp-naz")!;
  assignCase(c, naz, "kalite", NOW);
  assert.equal(JSON.stringify(c), snapshot);
});

test("versiyon numarası: id sırası mevcut dizinin uzunluğuna göre artar", () => {
  const first = openCase(caseInput(), NOW, []);
  const second = openCase(caseInput({ question: "Başka soru" }), NOW, [first] as ConsultationCase[]);
  assert.equal(second.id, "CASE-2");
});
