// SmartGrowth OS — Sertifika doğrulama akışı (FR-126/ADR-008 kapanışı, 2. tur).
// Bir sertifikanın KAYDEDİLMESİ bir İDDİADIR, kanıt değil — kayıt anında hiçbir alan
// (belge URL'i dahil) doğrulanmaz. compliance.review izinli bir rol (curation.ts'teki
// AYNI desen) bu iddiayı "beklemede" durumundan "onaylandi"/"reddedildi"ya taşımadan,
// evaluateWorkspaceClaim() bu sertifikayı asla dikkate almaz (bkz. repositories/
// certificates.ts). Sertifika workspaceId taşıdığı için (CorrectionSubmission'ın aksine)
// inceleme YİNE DE platform-geneli tutulur — aynı workspace'in "sahip" rolü kendi
// sertifikasını onaylayabilirdi ki bu, tam olarak önlenmek istenen sorunu (kendi kendini
// doğrulama) yeniden açardı. Gerçek, üçüncü-taraf kimlik doğrulaması bu MVP'nin kapsamı
// dışında — bu, dürüst bir sınırlama olarak burada ve roadmap.ts'te açıkça belirtilir.
import { can, type Role } from "@/lib/roles";

export type CertificateVerificationStatus = "beklemede" | "onaylandi" | "reddedildi";

export const CERTIFICATE_VERIFICATION_LABELS: Record<CertificateVerificationStatus, string> = {
  beklemede: "Beklemede (doğrulanmadı)",
  onaylandi: "Doğrulandı",
  reddedildi: "Reddedildi",
};

export interface VerifiableCertificate {
  workspaceId: string;
  verificationStatus: CertificateVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNote?: string;
}

/** compliance.review izni olan roller sertifika inceleyebilir (curation.ts'teki canReview ile aynı). */
export function canReviewCertificate(role: Role): boolean {
  return can(role, "compliance.review");
}

export interface CertificateReviewOutcome {
  certificate: VerifiableCertificate;
  applied: boolean;
  reason?: string;
}

/**
 * Yalnız 'beklemede' durumundaki sertifika değerlendirilebilir; sonuç değişmez şekilde
 * döner. `reviewerWorkspaceId`, sertifikanın KENDİ workspaceId'siyle eşleşirse işlem
 * reddedilir — aksi halde bir "sahip"/"yönetici" (ki her ikisi de compliance.review'a
 * sahiptir, bkz. roles.ts ALL_PERMISSIONS) kendi kaydettiği sertifikayı kendi kendine
 * onaylayabilirdi, ki bu tam olarak bu modülün kapatmak için var olduğu açıktır.
 */
export function reviewCertificate(
  certificate: VerifiableCertificate,
  reviewerRole: Role,
  reviewerWorkspaceId: string,
  decision: "onayla" | "reddet",
  reviewerId: string,
  nowISO: string,
  note?: string
): CertificateReviewOutcome {
  if (certificate.workspaceId === reviewerWorkspaceId) {
    return { certificate, applied: false, reason: "Kendi işletmenin sertifikasını inceleyemezsin — bağımsız bir compliance.review rolü gerekir" };
  }
  if (!canReviewCertificate(reviewerRole)) {
    return { certificate, applied: false, reason: "Yetkisiz — compliance.review izni gerekir" };
  }
  if (certificate.verificationStatus !== "beklemede") {
    return { certificate, applied: false, reason: "Yalnız beklemedeki sertifika değerlendirilebilir" };
  }
  const verificationStatus: CertificateVerificationStatus = decision === "onayla" ? "onaylandi" : "reddedildi";
  return {
    certificate: { ...certificate, verificationStatus, verifiedBy: reviewerId, verifiedAt: nowISO, verificationNote: note },
    applied: true,
  };
}
