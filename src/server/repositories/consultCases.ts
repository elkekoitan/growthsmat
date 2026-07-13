// SmartGrowth OS — Uzman danışma vakası repository katmanı (gerçek Postgres, platform-geneli).
// DÜRÜSTLÜK NOTU: workspaceId YOK (bkz. schema.prisma yorumu) — burası yalnız veri erişimi;
// tüm iş kuralları (kim atayabilir/yanıtlayabilir/kapatabilir) src/lib/expertConsult.ts'in
// saf fonksiyonlarında kalır, bu dosya yalnız DB satırı ⇄ ConsultationCase şekli çevirir.
import "server-only";

import { getDb } from "../db";
import type { ConsultationCase, CaseOutcome } from "@/lib/expertConsult";
import { openCase, assignCase, answerCase, closeCase, type OpenCaseInput, type ExpertProfile } from "@/lib/expertConsult";
import type { Role } from "@/lib/roles";
import type { EvidenceGrade } from "@/data/crops";

export type CaseActionResult = { applied: true; consultCase: ConsultationCase } | { applied: false; reason: string };

function toDomainCase(row: {
  id: string;
  askedBy: string;
  cropId: string | null;
  specialty: string;
  question: string;
  urgency: string;
  status: string;
  escalationSource: string;
  escalationReason: string | null;
  assignedExpertId: string | null;
  assignedAt: Date | null;
  answer: string | null;
  answerEvidence: string | null;
  answeredAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
}): ConsultationCase {
  return {
    id: row.id,
    askedBy: row.askedBy,
    cropId: row.cropId ?? undefined,
    specialty: row.specialty as ConsultationCase["specialty"],
    question: row.question,
    urgency: row.urgency as ConsultationCase["urgency"],
    status: row.status as ConsultationCase["status"],
    escalationSource: row.escalationSource as ConsultationCase["escalationSource"],
    escalationReason: row.escalationReason ?? undefined,
    assignedExpertId: row.assignedExpertId ?? undefined,
    assignedAtISO: row.assignedAt?.toISOString(),
    answer: row.answer ?? undefined,
    answerEvidence: row.answerEvidence as ConsultationCase["answerEvidence"],
    answeredAtISO: row.answeredAt?.toISOString(),
    closedAtISO: row.closedAt?.toISOString(),
    createdAtISO: row.createdAt.toISOString(),
  };
}

export async function listCases(): Promise<ConsultationCase[]> {
  const db = getDb();
  const rows = await db.consultationCase.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toDomainCase);
}

/** Sabit örnek vakaları (eski buildSeedCases()'teki senaryo) tek seferde tohumlar. */
export async function seedDemoCasesIfEmpty(): Promise<void> {
  const db = getDb();
  const count = await db.consultationCase.count();
  if (count > 0) return;

  const PESTICIDE_DOSE_REASON =
    "Pestisit/girdi dozu ülke ve ürüne göre resmi olarak doğrulanmadan önerilemez. Etikette veya yetkili kaynakta olmayan doz/karışım AI tarafından üretilmez.";

  let seed: ConsultationCase[] = [];
  const push = (c: ConsultationCase) => { seed = [...seed, c]; };

  const c1 = openCase({ askedBy: "uretici@ornek.com", cropId: "feslegen", specialty: "bitki-korumasi", question: "Fesleğende yaprak lekesi var, ne yapmalıyım?", urgency: "orta", escalationSource: "dogrudan-talep" }, "2026-07-01T09:00:00Z", seed);
  push(c1);

  const c2Open = openCase({ askedBy: "baska-uretici@ornek.com", specialty: "toprak-bilimi", question: "Toprak pH'ı çok düşük çıktı, ne yapmalıyım?", urgency: "dusuk", escalationSource: "dogrudan-talep" }, "2026-07-02T09:00:00Z", seed);
  push(c2Open);
  const naz: ExpertProfile = { id: "exp-naz", name: "", credentials: "", specialties: [], verification: "dogrulanmis", avgResponseHours: 0, caseCount: 0 };
  const mert: ExpertProfile = { ...naz, id: "exp-mert" };
  const selin: ExpertProfile = { ...naz, id: "exp-selin" };
  const c2 = assignCase(c2Open, mert, "kalite", "2026-07-02T10:00:00Z").consultCase;

  const c3Open = openCase({ askedBy: "uretici@ornek.com", cropId: "cherry-domates-kompakt", specialty: "bitki-korumasi", question: "Domateste beyazsinek var, nasıl mücadele ederim?", urgency: "yuksek", escalationSource: "dogrudan-talep" }, "2026-07-03T09:00:00Z", seed);
  push(c3Open);
  const c3Assigned = assignCase(c3Open, naz, "kalite", "2026-07-03T10:00:00Z").consultCase;
  const c3 = answerCase(c3Assigned, "uzman", "exp-naz", "Sarı yapışkan tuzakla izleme + Beauveria bassiana bazlı biyolojik mücadele önerilir; kimyasal ilaç son çare.", "B", "2026-07-04T09:00:00Z").consultCase;

  const c4Open = openCase({ askedBy: "uretici@ornek.com", specialty: "organik-sertifikasyon", question: "Sertifikam geçiş sürecinde, ürünümü organik olarak satabilir miyim?", urgency: "orta", escalationSource: "dogrudan-talep" }, "2026-07-04T09:00:00Z", seed);
  push(c4Open);
  const c4Assigned = assignCase(c4Open, selin, "kalite", "2026-07-04T12:00:00Z").consultCase;
  const c4Answered = answerCase(c4Assigned, "uzman", "exp-selin", "Geçiş sürecindeki ürün yalnız açık 'geçiş sürecinde' etiketiyle satılabilir; 'organik' etiketi kullanılamaz.", "A", "2026-07-05T09:00:00Z").consultCase;
  const c4 = closeCase(c4Answered, "uretici@ornek.com", "saha-calisani", "2026-07-05T10:00:00Z").consultCase;

  const c5 = openCase({ askedBy: "uretici@ornek.com", specialty: "bitki-korumasi", question: "Domateste mildiyö için kaç ml ilaçlama yapmalıyım?", urgency: "yuksek", escalationSource: "asistan-guvenlik-blok", escalationReason: PESTICIDE_DOSE_REASON }, "2026-07-06T09:00:00Z", seed);

  const finalSeed = [c1, c2, c3, c4, c5];
  await db.consultationCase.createMany({
    data: finalSeed.map((c) => ({
      // eski openCase()'in "CASE-N" iş kodu burada atlanır — hiçbir yerde bu koda
      // referans verilmez, Prisma'nın kendi cuid'i yeterli.
      askedBy: c.askedBy,
      cropId: c.cropId,
      specialty: c.specialty,
      question: c.question,
      urgency: c.urgency,
      status: c.status,
      escalationSource: c.escalationSource,
      escalationReason: c.escalationReason,
      assignedExpertId: c.assignedExpertId,
      assignedAt: c.assignedAtISO ? new Date(c.assignedAtISO) : undefined,
      answer: c.answer,
      answerEvidence: c.answerEvidence,
      answeredAt: c.answeredAtISO ? new Date(c.answeredAtISO) : undefined,
      closedAt: c.closedAtISO ? new Date(c.closedAtISO) : undefined,
      createdAt: new Date(c.createdAtISO),
    })),
  });
}

export async function createCase(input: OpenCaseInput, nowISO: string): Promise<ConsultationCase> {
  const db = getDb();
  const row = await db.consultationCase.create({
    data: {
      askedBy: input.askedBy,
      cropId: input.cropId,
      specialty: input.specialty,
      question: input.question,
      urgency: input.urgency,
      escalationSource: input.escalationSource,
      escalationReason: input.escalationReason,
      status: "acik",
      createdAt: new Date(nowISO),
    },
  });
  return toDomainCase(row);
}

async function loadCase(id: string): Promise<ConsultationCase | undefined> {
  const db = getDb();
  const row = await db.consultationCase.findUnique({ where: { id } });
  return row ? toDomainCase(row) : undefined;
}

async function persistOutcome(outcome: CaseOutcome): Promise<CaseActionResult> {
  if (!outcome.applied) return { applied: false, reason: outcome.reason ?? "İşlem uygulanamadı" };
  const db = getDb();
  const c = outcome.consultCase;
  const row = await db.consultationCase.update({
    where: { id: c.id },
    data: {
      status: c.status,
      assignedExpertId: c.assignedExpertId,
      assignedAt: c.assignedAtISO ? new Date(c.assignedAtISO) : undefined,
      answer: c.answer,
      answerEvidence: c.answerEvidence,
      answeredAt: c.answeredAtISO ? new Date(c.answeredAtISO) : undefined,
      closedAt: c.closedAtISO ? new Date(c.closedAtISO) : undefined,
    },
  });
  return { applied: true, consultCase: toDomainCase(row) };
}

export async function assignCaseById(id: string, expert: ExpertProfile, assignerRole: Role, nowISO: string): Promise<CaseActionResult> {
  const existing = await loadCase(id);
  if (!existing) return { applied: false, reason: "Vaka bulunamadı" };
  return persistOutcome(assignCase(existing, expert, assignerRole, nowISO));
}

export async function answerCaseById(id: string, responderRole: Role, responderExpertId: string, answerText: string, evidence: EvidenceGrade, nowISO: string): Promise<CaseActionResult> {
  const existing = await loadCase(id);
  if (!existing) return { applied: false, reason: "Vaka bulunamadı" };
  return persistOutcome(answerCase(existing, responderRole, responderExpertId, answerText, evidence, nowISO));
}

export async function closeCaseById(id: string, actorUserId: string, actorRole: Role, nowISO: string): Promise<CaseActionResult> {
  const existing = await loadCase(id);
  if (!existing) return { applied: false, reason: "Vaka bulunamadı" };
  return persistOutcome(closeCase(existing, actorUserId, actorRole, nowISO));
}
