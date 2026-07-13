// SmartGrowth OS — Sertifika repository katmanı (gerçek Postgres CRUD).
// Bu dosya, dokümantasyon incelemesinde bulunan gerçek bir boşluğu kapatır: FR-126'nın
// "sertifika yoksa organik iddiası yayınlanamaz" kapısı src/lib/rulePacks.ts'te GERÇEKTEN
// implemente edilmişti (evaluateClaim, test edilmiş) ama hiçbir UI/repository onu
// çağırmıyordu — /pazar'daki "sertifikali" iddiası hiçbir zaman doğrulanmadan kabul
// ediliyordu (yalnız formda alan olmadığı için kazara "yontem-kayitli"ye düşüyordu).
// Bu dosya + pazar/actions.ts'teki yeni kontrol, evaluateClaim()'i gerçek workspace
// sertifikalarına bağlar.
import "server-only";

import { getDb } from "../db";
import { evaluateClaim, type Certificate, type Jurisdiction, type ClaimResult } from "@/lib/rulePacks";
import {
  reviewCertificate,
  type CertificateVerificationStatus,
  type CertificateReviewOutcome,
} from "@/lib/certificateReview";
import type { Role } from "@/lib/roles";

export interface CertificateInput {
  holder: string;
  jurisdiction: Jurisdiction;
  scopeCropIds: string[];
  validFrom: string; // yyyy-mm-dd
  validTo: string; // yyyy-mm-dd
  issuer: string;
  inTransition: boolean;
  documentUrl?: string;
}

export interface RealCertificate extends CertificateInput {
  id: string;
  workspaceId: string;
  createdAt: string;
  verificationStatus: CertificateVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNote?: string;
}

function toDomainCertificate(row: {
  id: string;
  workspaceId: string;
  holder: string;
  jurisdiction: string;
  scopeCropIds: string[];
  validFrom: Date;
  validTo: Date;
  issuer: string;
  inTransition: boolean;
  documentUrl: string | null;
  createdAt: Date;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  verificationNote: string | null;
}): RealCertificate {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    holder: row.holder,
    jurisdiction: row.jurisdiction as Jurisdiction,
    scopeCropIds: row.scopeCropIds,
    validFrom: row.validFrom.toISOString().slice(0, 10),
    validTo: row.validTo.toISOString().slice(0, 10),
    issuer: row.issuer,
    inTransition: row.inTransition,
    documentUrl: row.documentUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
    verificationStatus: row.verificationStatus as CertificateVerificationStatus,
    verifiedBy: row.verifiedBy ?? undefined,
    verifiedAt: row.verifiedAt?.toISOString(),
    verificationNote: row.verificationNote ?? undefined,
  };
}

function toLibCertificate(row: RealCertificate): Certificate {
  return {
    id: row.id,
    holder: row.holder,
    jurisdiction: row.jurisdiction,
    scopeCropIds: row.scopeCropIds,
    validFrom: row.validFrom,
    validTo: row.validTo,
    issuer: row.issuer,
    inTransition: row.inTransition,
  };
}

export async function listCertificates(workspaceId: string): Promise<RealCertificate[]> {
  const db = getDb();
  const rows = await db.certificate.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  return rows.map(toDomainCertificate);
}

export async function createCertificate(workspaceId: string, input: CertificateInput): Promise<RealCertificate> {
  const db = getDb();
  const row = await db.certificate.create({
    data: {
      workspaceId,
      holder: input.holder,
      jurisdiction: input.jurisdiction,
      scopeCropIds: input.scopeCropIds,
      validFrom: new Date(input.validFrom),
      validTo: new Date(input.validTo),
      issuer: input.issuer,
      inTransition: input.inTransition,
      documentUrl: input.documentUrl,
    },
  });
  return toDomainCertificate(row);
}

/**
 * Bir workspace'in belirli bir ürün+yargı alanı için organik iddia gösterip
 * gösteremeyeceğini gerçek sertifika verisine karşı değerlendirir (rulePacks.ts'in
 * evaluateClaim'i — hiçbir yeni kural icat edilmez, yalnız gerçek satıra bağlanır).
 * Yalnız compliance.review izinli bir rol tarafından "onaylandi" durumuna taşınmış
 * sertifikalar dikkate alınır — "beklemede" (henüz doğrulanmamış, self-declared) veya
 * "reddedildi" bir sertifika hiçbir organik iddiayı asla açamaz (bkz. src/lib/
 * certificateReview.ts). Kapsamda birden fazla uygun sertifika varsa en olumlu sonucu
 * (sertifikali > gecis-sureci) veren ilki döner.
 */
export async function evaluateWorkspaceClaim(
  workspaceId: string,
  cropId: string,
  jurisdiction: Jurisdiction,
  nowISO: string
): Promise<ClaimResult> {
  const db = getDb();
  const rows = await db.certificate.findMany({ where: { workspaceId, jurisdiction, verificationStatus: "onaylandi" } });
  if (rows.length === 0) {
    return evaluateClaim(undefined, cropId, jurisdiction, nowISO);
  }
  const certs = rows.map(toDomainCertificate).map(toLibCertificate);
  const results = certs.map((c) => evaluateClaim(c, cropId, jurisdiction, nowISO));
  return (
    results.find((r) => r.status === "sertifikali") ??
    results.find((r) => r.status === "gecis-sureci") ??
    results[0]
  );
}

/**
 * Doğrulama bekleyen sertifikaları döner, VİEWER'IN KENDİ workspace'i HARİÇ tutularak
 * (curation.ts'teki CorrectionSubmission'ın aksine — Certificate workspaceId taşıdığı
 * için, kendi workspace'inin kaydını göstermek "sahip"e kendi sertifikasını onaylama
 * seçeneğini sunardı; bu yalnız bir UI kolaylığı değil, reviewCertificateById'deki
 * gerçek workspace-eşleşme kontrolüyle AYNI kuralın kuyrukta da yansımasıdır).
 */
export async function listPendingCertificates(viewerWorkspaceId: string): Promise<RealCertificate[]> {
  const db = getDb();
  const rows = await db.certificate.findMany({
    where: { verificationStatus: "beklemede", workspaceId: { not: viewerWorkspaceId } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDomainCertificate);
}

export type CertificateReviewResult = { applied: true; certificate: RealCertificate } | { applied: false; reason: string };

export async function reviewCertificateById(
  id: string,
  reviewerRole: Role,
  reviewerWorkspaceId: string,
  decision: "onayla" | "reddet",
  reviewerId: string,
  nowISO: string,
  note?: string
): Promise<CertificateReviewResult> {
  const db = getDb();
  const row = await db.certificate.findUnique({ where: { id } });
  if (!row) return { applied: false, reason: "Sertifika bulunamadı" };
  const existing = toDomainCertificate(row);
  const outcome: CertificateReviewOutcome = reviewCertificate(existing, reviewerRole, reviewerWorkspaceId, decision, reviewerId, nowISO, note);
  if (!outcome.applied) return { applied: false, reason: outcome.reason ?? "İşlem uygulanamadı" };
  const updated = { ...existing, ...outcome.certificate };
  const saved = await db.certificate.update({
    where: { id },
    data: {
      verificationStatus: updated.verificationStatus,
      verifiedBy: updated.verifiedBy,
      verifiedAt: updated.verifiedAt ? new Date(updated.verifiedAt) : undefined,
      verificationNote: updated.verificationNote,
    },
  });
  return { applied: true, certificate: toDomainCertificate(saved) };
}
