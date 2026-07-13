// SmartGrowth OS — İçerik kürasyon (düzeltme önerisi) repository katmanı (gerçek Postgres,
// platform-geneli — bkz. schema.prisma'daki DÜRÜSTLÜK NOTU: workspaceId yok, ürün bilgi
// grafiğinin kendisi hedeflenir).
import "server-only";

import { getDb } from "../db";
import type { CorrectionSubmission, ReviewOutcome, SubmissionInput } from "@/lib/curation";
import { submitCorrection, reviewCorrection, withdrawSubmission } from "@/lib/curation";
import type { Role } from "@/lib/roles";

export type ReviewActionResult = { applied: true; submission: CorrectionSubmission } | { applied: false; reason: string };

function toDomainSubmission(row: {
  id: string;
  subjectType: string;
  subjectId: string;
  field: string;
  currentValue: string;
  proposedValue: string;
  sourceUrl: string | null;
  submittedBy: string;
  status: string;
  version: number;
  reviewerId: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
}): CorrectionSubmission {
  return {
    id: row.id,
    subjectType: row.subjectType as CorrectionSubmission["subjectType"],
    subjectId: row.subjectId,
    field: row.field,
    currentValue: row.currentValue,
    proposedValue: row.proposedValue,
    sourceUrl: row.sourceUrl ?? undefined,
    submittedBy: row.submittedBy,
    submittedAtISO: row.createdAt.toISOString(),
    status: row.status as CorrectionSubmission["status"],
    version: row.version,
    reviewerId: row.reviewerId ?? undefined,
    reviewedAtISO: row.reviewedAt?.toISOString(),
    reviewNote: row.reviewNote ?? undefined,
  };
}

export async function listSubmissions(): Promise<CorrectionSubmission[]> {
  const db = getDb();
  const rows = await db.correctionSubmission.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toDomainSubmission);
}

/** Sabit örnek önerileri (eski buildSeedSubmissions()'teki senaryo) tek seferde tohumlar. */
export async function seedDemoSubmissionsIfEmpty(): Promise<void> {
  const db = getDb();
  const count = await db.correctionSubmission.count();
  if (count > 0) return;

  const s1 = submitCorrection({ subjectType: "crop", subjectId: "domates", field: "sunOptHours", currentValue: "6", proposedValue: "7", submittedBy: "uretici@ornek.com" }, "2026-06-01T09:00:00Z", []);
  const approved1 = reviewCorrection(s1, "uzman", "onayla", "naz@ornek.com", "2026-06-02T09:00:00Z", "Saha verisiyle doğrulandı").submission;

  const s2 = submitCorrection({ subjectType: "crop", subjectId: "domates", field: "sunOptHours", currentValue: "7", proposedValue: "9", submittedBy: "uretici@ornek.com" }, "2026-06-10T09:00:00Z", [approved1]);
  const withdrawn2 = withdrawSubmission(s2, "uretici@ornek.com").submission;

  const s3 = submitCorrection({ subjectType: "crop", subjectId: "marul", field: "phRange", currentValue: "6-6.8", proposedValue: "6.2-7", sourceUrl: "https://extension.example/marul-ph", submittedBy: "baska-uretici@ornek.com" }, "2026-06-15T09:00:00Z", [approved1, withdrawn2]);

  const s4 = submitCorrection({ subjectType: "crop", subjectId: "biber", field: "daysToHarvest", currentValue: "60-75", proposedValue: "50-60", submittedBy: "baska-uretici@ornek.com" }, "2026-06-16T09:00:00Z", [approved1, withdrawn2, s3]);
  const rejected4 = reviewCorrection(s4, "kalite", "reddet", "mert@ornek.com", "2026-06-17T09:00:00Z", "Kaynak doğrulanamadı").submission;

  const finalSeed = [approved1, withdrawn2, s3, rejected4];
  await db.correctionSubmission.createMany({
    data: finalSeed.map((s) => ({
      subjectType: s.subjectType,
      subjectId: s.subjectId,
      field: s.field,
      currentValue: s.currentValue,
      proposedValue: s.proposedValue,
      sourceUrl: s.sourceUrl,
      submittedBy: s.submittedBy,
      status: s.status,
      version: s.version,
      reviewerId: s.reviewerId,
      reviewedAt: s.reviewedAtISO ? new Date(s.reviewedAtISO) : undefined,
      reviewNote: s.reviewNote,
      createdAt: new Date(s.submittedAtISO),
    })),
  });
}

export async function createSubmission(input: SubmissionInput, nowISO: string): Promise<CorrectionSubmission> {
  const db = getDb();
  const approvedCount = await db.correctionSubmission.count({
    where: { subjectId: input.subjectId, field: input.field, status: "onaylandi" },
  });
  const row = await db.correctionSubmission.create({
    data: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      field: input.field,
      currentValue: input.currentValue,
      proposedValue: input.proposedValue,
      sourceUrl: input.sourceUrl,
      submittedBy: input.submittedBy,
      status: "incelemede",
      version: approvedCount + 1,
      createdAt: new Date(nowISO),
    },
  });
  return toDomainSubmission(row);
}

async function loadSubmission(id: string): Promise<CorrectionSubmission | undefined> {
  const db = getDb();
  const row = await db.correctionSubmission.findUnique({ where: { id } });
  return row ? toDomainSubmission(row) : undefined;
}

async function persistOutcome(outcome: ReviewOutcome): Promise<ReviewActionResult> {
  if (!outcome.applied) return { applied: false, reason: outcome.reason ?? "İşlem uygulanamadı" };
  const db = getDb();
  const s = outcome.submission;
  const row = await db.correctionSubmission.update({
    where: { id: s.id },
    data: {
      status: s.status,
      reviewerId: s.reviewerId,
      reviewedAt: s.reviewedAtISO ? new Date(s.reviewedAtISO) : undefined,
      reviewNote: s.reviewNote,
    },
  });
  return { applied: true, submission: toDomainSubmission(row) };
}

export async function reviewSubmissionById(
  id: string,
  reviewerRole: Role,
  decision: "onayla" | "reddet",
  reviewerId: string,
  nowISO: string,
  note?: string
): Promise<ReviewActionResult> {
  const existing = await loadSubmission(id);
  if (!existing) return { applied: false, reason: "Öneri bulunamadı" };
  return persistOutcome(reviewCorrection(existing, reviewerRole, decision, reviewerId, nowISO, note));
}

export async function withdrawSubmissionById(id: string, byUserId: string): Promise<ReviewActionResult> {
  const existing = await loadSubmission(id);
  if (!existing) return { applied: false, reason: "Öneri bulunamadı" };
  return persistOutcome(withdrawSubmission(existing, byUserId));
}
