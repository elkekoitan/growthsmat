import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reviewCertificate,
  canReviewCertificate,
  type VerifiableCertificate,
} from "../src/lib/certificateReview.ts";

const NOW = "2026-07-13T09:00:00Z";

function cert(over: Partial<VerifiableCertificate> = {}): VerifiableCertificate {
  return {
    workspaceId: "ws-uretici",
    verificationStatus: "beklemede",
    ...over,
  };
}

test("canReviewCertificate: yalnız compliance.review izinli roller true döner", () => {
  assert.equal(canReviewCertificate("uzman"), true);
  assert.equal(canReviewCertificate("kalite"), true);
  assert.equal(canReviewCertificate("sahip"), true);
  assert.equal(canReviewCertificate("satis"), false);
  assert.equal(canReviewCertificate("goruntuleyici"), false);
});

test("reviewCertificate: KENDİ workspace'inin sertifikasını inceleme reddedilir (kendi-kendini-doğrulama koruması)", () => {
  const c = cert();
  const r = reviewCertificate(c, "sahip", "ws-uretici", "onayla", "sahip@x.com", NOW);
  assert.equal(r.applied, false);
  assert.equal(r.certificate.verificationStatus, "beklemede");
  assert.match(r.reason ?? "", /Kendi işletmen/);
});

test("reviewCertificate: BAŞKA workspace'ten compliance.review izinli rol onaylayabilir", () => {
  const c = cert();
  const r = reviewCertificate(c, "uzman", "ws-baska", "onayla", "uzman@x.com", NOW);
  assert.equal(r.applied, true);
  assert.equal(r.certificate.verificationStatus, "onaylandi");
  assert.equal(r.certificate.verifiedBy, "uzman@x.com");
  assert.equal(r.certificate.verifiedAt, NOW);
});

test("reviewCertificate: yetkisiz rol (başka workspace'ten de olsa) reddedilir", () => {
  const c = cert();
  const r = reviewCertificate(c, "satis", "ws-baska", "onayla", "satis@x.com", NOW);
  assert.equal(r.applied, false);
  assert.equal(r.certificate.verificationStatus, "beklemede");
  assert.match(r.reason ?? "", /Yetkisiz/);
});

test("reviewCertificate: reddet kararı 'reddedildi' + not set eder", () => {
  const c = cert();
  const r = reviewCertificate(c, "kalite", "ws-baska", "reddet", "kalite@x.com", NOW, "belge geçersiz");
  assert.equal(r.applied, true);
  assert.equal(r.certificate.verificationStatus, "reddedildi");
  assert.equal(r.certificate.verificationNote, "belge geçersiz");
});

test("reviewCertificate: zaten karar verilmiş sertifika İKİNCİ KEZ değerlendirilemez (idempotent koruma)", () => {
  const c = cert();
  const first = reviewCertificate(c, "uzman", "ws-baska", "onayla", "u1", NOW);
  const second = reviewCertificate(first.certificate, "kalite", "ws-baska2", "reddet", "u2", NOW);
  assert.equal(second.applied, false);
  assert.equal(second.certificate.verificationStatus, "onaylandi"); // ilk karar korunur
});

test("reviewCertificate: giriş sertifika objesi mutate edilmez", () => {
  const c = cert();
  const snapshot = JSON.stringify(c);
  reviewCertificate(c, "uzman", "ws-baska", "onayla", "u1", NOW);
  assert.equal(JSON.stringify(c), snapshot);
});

test("reviewCertificate: kendi-workspace kontrolü, yetki kontrolünden ÖNCE gelir (goruntuleyici bile kendi workspace'inde reddedilir, ama sebep hâlâ 'kendi işletmen')", () => {
  const c = cert();
  const r = reviewCertificate(c, "goruntuleyici", "ws-uretici", "onayla", "g@x.com", NOW);
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /Kendi işletmen/);
});
