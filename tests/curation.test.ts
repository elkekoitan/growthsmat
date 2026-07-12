import { test } from "node:test";
import assert from "node:assert/strict";
import {
  submitCorrection,
  reviewCorrection,
  withdrawSubmission,
  canReview,
  currentApprovedValue,
  type SubmissionInput,
} from "../src/lib/curation.ts";

const NOW = "2026-07-11T09:00:00Z";

function input(over: Partial<SubmissionInput> = {}): SubmissionInput {
  return {
    subjectType: "crop",
    subjectId: "domates",
    field: "sunOptHours",
    currentValue: "6-8",
    proposedValue: "7-9",
    submittedBy: "kullanici@ornek.com",
    ...over,
  };
}

test("submitCorrection yeni öneriyi 'incelemede' + versiyon 1 olarak oluşturur", () => {
  const s = submitCorrection(input(), NOW, []);
  assert.equal(s.status, "incelemede");
  assert.equal(s.version, 1);
  assert.equal(s.id, "SUB-1");
});

test("canReview: yalnız compliance.review izinli roller true döner", () => {
  assert.equal(canReview("uzman"), true);
  assert.equal(canReview("kalite"), true);
  assert.equal(canReview("sahip"), true);
  assert.equal(canReview("satis"), false);
  assert.equal(canReview("goruntuleyici"), false);
});

test("reviewCorrection: yetkisiz rol reddedilir, durum değişmez", () => {
  const s = submitCorrection(input(), NOW, []);
  const r = reviewCorrection(s, "satis", "onayla", "satis@x.com", NOW);
  assert.equal(r.applied, false);
  assert.equal(r.submission.status, "incelemede");
  assert.match(r.reason ?? "", /Yetkisiz/);
});

test("reviewCorrection: uzman onaylayınca 'onaylandi' + reviewer/at bilgisi set edilir", () => {
  const s = submitCorrection(input(), NOW, []);
  const r = reviewCorrection(s, "uzman", "onayla", "uzman@x.com", "2026-07-11T10:00:00Z", "kaynak doğrulandı");
  assert.equal(r.applied, true);
  assert.equal(r.submission.status, "onaylandi");
  assert.equal(r.submission.reviewerId, "uzman@x.com");
  assert.equal(r.submission.reviewedAtISO, "2026-07-11T10:00:00Z");
  assert.equal(r.submission.reviewNote, "kaynak doğrulandı");
});

test("reviewCorrection: kalite reddedince 'reddedildi' olur", () => {
  const s = submitCorrection(input(), NOW, []);
  const r = reviewCorrection(s, "kalite", "reddet", "kalite@x.com", NOW);
  assert.equal(r.submission.status, "reddedildi");
});

test("reviewCorrection: zaten karar verilmiş öneri İKİNCİ KEZ değerlendirilemez (idempotent koruma)", () => {
  const s = submitCorrection(input(), NOW, []);
  const first = reviewCorrection(s, "uzman", "onayla", "u1", NOW);
  const second = reviewCorrection(first.submission, "kalite", "reddet", "u2", NOW);
  assert.equal(second.applied, false);
  assert.equal(second.submission.status, "onaylandi"); // ilk karar korunur
});

test("withdrawSubmission: yalnız gönderen geri çekebilir", () => {
  const s = submitCorrection(input(), NOW, []);
  const r = withdrawSubmission(s, "baskasi@x.com");
  assert.equal(r.applied, false);
  assert.equal(r.submission.status, "incelemede");
});

test("withdrawSubmission: gönderen 'incelemede' iken geri çekebilir", () => {
  const s = submitCorrection(input(), NOW, []);
  const r = withdrawSubmission(s, "kullanici@ornek.com");
  assert.equal(r.applied, true);
  assert.equal(r.submission.status, "geri-cekildi");
});

test("withdrawSubmission: onaylanmış/reddedilmiş öneri artık geri çekilemez", () => {
  const s = submitCorrection(input(), NOW, []);
  const approved = reviewCorrection(s, "uzman", "onayla", "u1", NOW).submission;
  const r = withdrawSubmission(approved, "kullanici@ornek.com");
  assert.equal(r.applied, false);
});

test("versiyon numarası: aynı alan için önceki ONAYLI düzeltme sayısına göre artar", () => {
  const s1 = submitCorrection(input(), NOW, []);
  const approved1 = reviewCorrection(s1, "uzman", "onayla", "u1", NOW).submission;
  const s2 = submitCorrection(input({ proposedValue: "8-10" }), NOW, [approved1]);
  assert.equal(s2.version, 2);
});

test("versiyon numarası: reddedilen/geri çekilen düzeltmeler versiyon sayacını ARTIRMAZ", () => {
  const s1 = submitCorrection(input(), NOW, []);
  const rejected = reviewCorrection(s1, "kalite", "reddet", "u1", NOW).submission;
  const s2 = submitCorrection(input(), NOW, [rejected]);
  assert.equal(s2.version, 1); // reddedilen sayılmadı
});

test("currentApprovedValue: onaylı düzeltme yoksa undefined (sahte kesinlik yok)", () => {
  const s = submitCorrection(input(), NOW, []);
  assert.equal(currentApprovedValue("domates", "sunOptHours", [s]), undefined);
});

test("currentApprovedValue: en yüksek versiyonlu ONAYLI değeri döner", () => {
  const s1 = submitCorrection(input(), NOW, []);
  const approved1 = reviewCorrection(s1, "uzman", "onayla", "u1", NOW).submission;
  const s2 = submitCorrection(input({ proposedValue: "8-10" }), NOW, [approved1]);
  const approved2 = reviewCorrection(s2, "uzman", "onayla", "u1", "2026-07-12T00:00:00Z").submission;
  const current = currentApprovedValue("domates", "sunOptHours", [approved1, approved2]);
  assert.equal(current?.value, "8-10");
  assert.equal(current?.version, 2);
});

test("geri çekilen bir düzeltme sonradan ONAYLI SAYILMAZ ama eski onaylı kayıt etkilenmez (köken korunur)", () => {
  const s1 = submitCorrection(input(), NOW, []);
  const approved1 = reviewCorrection(s1, "uzman", "onayla", "u1", NOW).submission;
  const s2 = submitCorrection(input({ proposedValue: "yanlis-deger" }), NOW, [approved1]);
  const withdrawn = withdrawSubmission(s2, "kullanici@ornek.com").submission;
  const current = currentApprovedValue("domates", "sunOptHours", [approved1, withdrawn]);
  assert.equal(current?.value, "7-9"); // hâlâ ilk onaylı değer
  assert.equal(current?.version, 1);
});

test("giriş submission objesi mutate edilmez", () => {
  const s = submitCorrection(input(), NOW, []);
  const snapshot = JSON.stringify(s);
  reviewCorrection(s, "uzman", "onayla", "u1", NOW);
  assert.equal(JSON.stringify(s), snapshot);
});
