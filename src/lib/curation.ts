// SmartGrowth OS — İçerik kürasyon konsolu (PRD FR-040/FR-041, P04-13)
// Ürün/çeşit verisine düzeltme önerisi akışı: gönder → incelemede → onayla/reddet/geri-çek.
// Yalnız compliance.review izinli rol (kalite, uzman, sahip, yonetici) inceleyebilir.
// Onaylanan her düzeltme yeni bir sürüm numarası alır; eski kararların kökeni KORUNUR —
// bir düzeltme sonradan geri çekilse bile, o düzeltmeye dayanan geçmiş kararlar geçersiz sayılmaz.

import { can, type Role } from "@/lib/roles";

export type SubjectType = "crop" | "claim" | "companion";

export type CurationStatus = "incelemede" | "onaylandi" | "reddedildi" | "geri-cekildi";

export interface CorrectionSubmission {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  field: string;
  currentValue: string;
  proposedValue: string;
  sourceUrl?: string;
  submittedBy: string;
  submittedAtISO: string;
  status: CurationStatus;
  version: number; // bu subjectId+field için onaylanmış düzeltme sırası (1'den başlar)
  reviewerId?: string;
  reviewedAtISO?: string;
  reviewNote?: string;
}

export type SubmissionInput = Pick<
  CorrectionSubmission,
  "subjectType" | "subjectId" | "field" | "currentValue" | "proposedValue" | "sourceUrl" | "submittedBy"
>;

/** compliance.review izni olan roller inceleme yapabilir. */
export function canReview(role: Role): boolean {
  return can(role, "compliance.review");
}

/**
 * Yeni düzeltme önerisi oluşturur. Sürüm numarası, aynı subjectId+field için önceki
 * ONAYLANMIŞ düzeltme sayısına göre belirlenir (reddedilen/geri çekilenler sayılmaz).
 */
export function submitCorrection(
  input: SubmissionInput,
  nowISO: string,
  existing: CorrectionSubmission[]
): CorrectionSubmission {
  const approvedCount = existing.filter(
    (s) => s.subjectId === input.subjectId && s.field === input.field && s.status === "onaylandi"
  ).length;

  return {
    ...input,
    id: `SUB-${existing.length + 1}`,
    submittedAtISO: nowISO,
    status: "incelemede",
    version: approvedCount + 1,
  };
}

export interface ReviewOutcome {
  submission: CorrectionSubmission;
  applied: boolean;
  reason?: string;
}

/** Yalnız 'incelemede' durumundaki öneri değerlendirilebilir; sonuç değişmez şekilde döner. */
export function reviewCorrection(
  submission: CorrectionSubmission,
  reviewerRole: Role,
  decision: "onayla" | "reddet",
  reviewerId: string,
  nowISO: string,
  note?: string
): ReviewOutcome {
  if (!canReview(reviewerRole)) {
    return { submission, applied: false, reason: "Yetkisiz — compliance.review izni gerekir" };
  }
  if (submission.status !== "incelemede") {
    return { submission, applied: false, reason: "Yalnız incelemedeki öneri değerlendirilebilir" };
  }

  const status: CurationStatus = decision === "onayla" ? "onaylandi" : "reddedildi";
  return {
    submission: { ...submission, status, reviewerId, reviewedAtISO: nowISO, reviewNote: note },
    applied: true,
  };
}

/** Yalnız öneriyi gönderen kişi, yalnız 'incelemede' iken geri çekebilir. */
export function withdrawSubmission(submission: CorrectionSubmission, byUserId: string): ReviewOutcome {
  if (submission.submittedBy !== byUserId) {
    return { submission, applied: false, reason: "Yalnız gönderen geri çekebilir" };
  }
  if (submission.status !== "incelemede") {
    return { submission, applied: false, reason: "Yalnız incelemedeki öneri geri çekilebilir" };
  }
  return { submission: { ...submission, status: "geri-cekildi" }, applied: true };
}

/**
 * Bir alanın en güncel ONAYLANMIŞ değerini döner (en yüksek versiyon). Onaylı düzeltme
 * yoksa undefined — çağıran taraf orijinal veri kaynağına düşer (fallback burada yapılmaz).
 */
export function currentApprovedValue(
  subjectId: string,
  field: string,
  submissions: CorrectionSubmission[]
): { value: string; version: number } | undefined {
  const approved = submissions.filter(
    (s) => s.subjectId === subjectId && s.field === field && s.status === "onaylandi"
  );
  if (approved.length === 0) return undefined;
  const latest = approved.reduce((a, b) => (b.version > a.version ? b : a));
  return { value: latest.proposedValue, version: latest.version };
}

export const CURATION_STATUS_LABELS: Record<CurationStatus, string> = {
  incelemede: "İncelemede",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  "geri-cekildi": "Geri çekildi",
};
