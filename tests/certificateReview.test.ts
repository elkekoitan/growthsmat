import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reviewCertificate,
  revokeCertificate,
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

// ---- FR-183: revokeCertificate (daha önce onaylanmış sertifikanın geriye dönük iptali) ----

test("revokeCertificate: yalnız 'onaylandi' durumundaki sertifika iptal edilebilir, 'beklemede' reddedilir", () => {
  const c = cert(); // beklemede
  const r = revokeCertificate(c, "uzman", "ws-baska", "u1", NOW, "sahte belge tespit edildi");
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /daha önce onaylanmış/);
});

test("revokeCertificate: onaylı sertifika BAŞKA workspace'ten iptal edilebilir, revokedBy/At/Note set edilir, verifiedBy/At KORUNUR", () => {
  const approved = reviewCertificate(cert(), "uzman", "ws-baska", "onayla", "onaylayan@x.com", NOW).certificate;
  const r = revokeCertificate(approved, "kalite", "ws-baska2", "iptal-eden@x.com", "2026-07-14T09:00:00Z", "sahte belge tespit edildi");
  assert.equal(r.applied, true);
  assert.equal(r.certificate.verificationStatus, "iptal-edildi");
  assert.equal(r.certificate.revokedBy, "iptal-eden@x.com");
  assert.equal(r.certificate.revokedAt, "2026-07-14T09:00:00Z");
  assert.equal(r.certificate.revocationNote, "sahte belge tespit edildi");
  // Orijinal onay denetim izi kaybolmaz — kim/ne zaman onayladığı ayrı bir kayıttır.
  assert.equal(r.certificate.verifiedBy, "onaylayan@x.com");
  assert.equal(r.certificate.verifiedAt, NOW);
});

test("revokeCertificate: KENDİ workspace'inin onaylı sertifikasını iptal etmek reddedilir", () => {
  const approved = reviewCertificate(cert(), "uzman", "ws-baska", "onayla", "u1", NOW).certificate;
  const r = revokeCertificate(approved, "sahip", "ws-uretici", "sahip@x.com", NOW, "gerekçe");
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /Kendi işletmen/);
  assert.equal(r.certificate.verificationStatus, "onaylandi");
});

test("revokeCertificate: yetkisiz rol iptal edemez", () => {
  const approved = reviewCertificate(cert(), "uzman", "ws-baska", "onayla", "u1", NOW).certificate;
  const r = revokeCertificate(approved, "satis", "ws-baska2", "u2", NOW, "gerekçe");
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /Yetkisiz/);
});

test("revokeCertificate: boş/whitespace gerekçe reddedilir (gerekçesiz iptal yok)", () => {
  const approved = reviewCertificate(cert(), "uzman", "ws-baska", "onayla", "u1", NOW).certificate;
  const r = revokeCertificate(approved, "kalite", "ws-baska2", "u2", NOW, "   ");
  assert.equal(r.applied, false);
  assert.match(r.reason ?? "", /gerekçesi zorunludur/);
});

test("revokeCertificate: reddedilmiş bir sertifika iptal edilemez (yalnız onaylı olan)", () => {
  const rejected = reviewCertificate(cert(), "uzman", "ws-baska", "reddet", "u1", NOW).certificate;
  const r = revokeCertificate(rejected, "kalite", "ws-baska2", "u2", NOW, "gerekçe");
  assert.equal(r.applied, false);
  assert.equal(r.certificate.verificationStatus, "reddedildi");
});
