// SmartGrowth OS — Uzman danışma vaka akışı (PRD §9.12, P11-08)
// Asistanın güvenlik filtresi bir soruyu bloklarsa artık gerçek bir sonraki adım var:
// vaka aç → doğrulanmış uzmana ata → yanıtla → kapat. Uzman görüşü otomatik olarak
// "A kalite kanıt" sayılmaz — her yanıt kendi EvidenceGrade'ini taşır (sahte kesinlik yok).

import { can, type Role } from "@/lib/roles";
import { classifySafetyBlock, type AssistantAnswer } from "@/lib/assistant";
import type { EvidenceGrade } from "@/data/crops";

export type ConsultSpecialty = "bitki-korumasi" | "toprak-bilimi" | "organik-sertifikasyon" | "gida-guvenligi";
export type VerificationStatus = "dogrulanmamis" | "dogrulanmis" | "askida";

export interface ExpertProfile {
  id: string;
  name: string;
  credentials: string;
  specialties: ConsultSpecialty[];
  verification: VerificationStatus;
  avgResponseHours: number;
  caseCount: number; // statik biyografi alanı — canlı sayaç DEĞİL, mutasyon yapan fonksiyon yok
}

export type CaseUrgency = "dusuk" | "orta" | "yuksek";
export type CaseStatus = "acik" | "atandi" | "yanitlandi" | "kapatildi";
export type EscalationSource = "asistan-guvenlik-blok" | "dogrudan-talep";

export interface ConsultationCase {
  id: string;
  askedBy: string;
  cropId?: string;
  specialty: ConsultSpecialty;
  question: string;
  urgency: CaseUrgency;
  status: CaseStatus;
  escalationSource: EscalationSource;
  escalationReason?: string;
  assignedExpertId?: string;
  assignedAtISO?: string;
  answer?: string;
  answerEvidence?: EvidenceGrade;
  answeredAtISO?: string;
  closedAtISO?: string;
  createdAtISO: string;
}

export type OpenCaseInput = Pick<
  ConsultationCase,
  "askedBy" | "cropId" | "specialty" | "question" | "urgency" | "escalationSource" | "escalationReason"
>;

export const EXPERTS: ExpertProfile[] = [
  {
    id: "exp-naz",
    name: "Dr. Naz Aydın",
    credentials: "Ziraat Yüksek Mühendisi, Bitki Koruma, 12 yıl",
    specialties: ["bitki-korumasi", "gida-guvenligi"],
    verification: "dogrulanmis",
    avgResponseHours: 6,
    caseCount: 41,
  },
  {
    id: "exp-mert",
    name: "Mert Kaya",
    credentials: "Ziraat Mühendisi, Toprak Bilimi, 8 yıl",
    specialties: ["toprak-bilimi"],
    verification: "dogrulanmis",
    avgResponseHours: 18,
    caseCount: 12,
  },
  {
    id: "exp-selin",
    name: "Selin Öz",
    credentials: "Gıda Mühendisi, Organik Sertifikasyon Denetçisi, 6 yıl",
    specialties: ["organik-sertifikasyon", "gida-guvenligi"],
    verification: "dogrulanmis",
    avgResponseHours: 30,
    caseCount: 9,
  },
  {
    id: "exp-baris",
    name: "Barış Demir",
    credentials: "Ziraat Mühendisi (yeni kayıt), Bitki Koruma",
    specialties: ["bitki-korumasi"],
    verification: "dogrulanmamis",
    avgResponseHours: 4,
    caseCount: 0,
  },
  {
    id: "exp-elif",
    name: "Elif Şahin",
    credentials: "Gıda Güvenliği Danışmanı — inceleme askıda",
    specialties: ["gida-guvenligi"],
    verification: "askida",
    avgResponseHours: 24,
    caseCount: 5,
  },
];

export const SPECIALTY_LABELS: Record<ConsultSpecialty, string> = {
  "bitki-korumasi": "Bitki koruma (zararlı/hastalık/girdi)",
  "toprak-bilimi": "Toprak bilimi",
  "organik-sertifikasyon": "Organik sertifikasyon",
  "gida-guvenligi": "Gıda güvenliği",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  dogrulanmamis: "Doğrulanmamış",
  dogrulanmis: "Doğrulanmış",
  askida: "Askıda",
};

export const URGENCY_LABELS: Record<CaseUrgency, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  acik: "Açık",
  atandi: "Atandı",
  yanitlandi: "Yanıtlandı",
  kapatildi: "Kapatıldı",
};

/** compliance.review izni olan roller (kalite, uzman, sahip, yönetici) vaka atayabilir/yanıtlayabilir/kapatabilir. */
export function canAnswerConsultation(role: Role): boolean {
  return can(role, "compliance.review");
}

/** Bir uzmanlık alanına uygun, isteğe bağlı yalnız doğrulanmış uzmanları yanıt süresine göre artan sırada döner. */
export function matchExperts(
  experts: ExpertProfile[],
  specialty: ConsultSpecialty,
  onlyVerified: boolean = true
): ExpertProfile[] {
  return experts
    .filter((e) => e.specialties.includes(specialty))
    .filter((e) => !onlyVerified || e.verification === "dogrulanmis")
    .sort((a, b) => a.avgResponseHours - b.avgResponseHours);
}

export function openCase(input: OpenCaseInput, nowISO: string, existing: ConsultationCase[]): ConsultationCase {
  return { ...input, id: `CASE-${existing.length + 1}`, status: "acik", createdAtISO: nowISO };
}

/** Bloklanan bir sorunun kategorisine göre sensible bir uzmanlık alanı önerir. */
export function suggestSpecialtyForQuery(query: string): ConsultSpecialty | undefined {
  const category = classifySafetyBlock(query);
  if (category === "girdi-dozu") return "bitki-korumasi";
  if (category === "tibbi-iddia") return "gida-guvenligi";
  return undefined;
}

/**
 * Asistanın güvenlik bloğundan bir danışma vakası açar. Çağıran taraf `answer.safetyBlocked
 * === true` olduğunu garanti etmeli (runtime kontrolü yok — membershipLifecycle.ts'in
 * canCancel'ı gibi "önce kontrol et, sonra çağır" deseni).
 */
export function openCaseFromSafetyBlock(
  answer: AssistantAnswer,
  askedBy: string,
  nowISO: string,
  existing: ConsultationCase[],
  overrides?: Partial<Pick<ConsultationCase, "specialty" | "cropId" | "urgency">>
): ConsultationCase {
  const specialty = overrides?.specialty ?? suggestSpecialtyForQuery(answer.query) ?? "gida-guvenligi";
  return openCase(
    {
      askedBy,
      cropId: overrides?.cropId ?? answer.matchedCrop,
      specialty,
      question: answer.query,
      urgency: overrides?.urgency ?? "orta",
      escalationSource: "asistan-guvenlik-blok",
      escalationReason: answer.safetyReason ?? "Güvenlik filtresi detayı yok",
    },
    nowISO,
    existing
  );
}

export interface CaseOutcome {
  consultCase: ConsultationCase;
  applied: boolean;
  reason?: string;
}

/** Yalnız 'acik' durumdaki bir vakayı, doğrulanmış ve uzmanlık alanı eşleşen bir uzmana atar. */
export function assignCase(
  consultCase: ConsultationCase,
  expert: ExpertProfile,
  assignerRole: Role,
  nowISO: string
): CaseOutcome {
  if (!canAnswerConsultation(assignerRole)) {
    return { consultCase, applied: false, reason: "Yetkisiz — compliance.review izni gerekir" };
  }
  if (consultCase.status !== "acik") {
    return { consultCase, applied: false, reason: "Yalnız açık vaka atanabilir" };
  }
  if (expert.verification !== "dogrulanmis") {
    return { consultCase, applied: false, reason: "Yalnız doğrulanmış uzmana atama yapılabilir" };
  }
  if (!expert.specialties.includes(consultCase.specialty)) {
    return { consultCase, applied: false, reason: "Uzmanın uzmanlık alanı bu vakayla eşleşmiyor" };
  }
  return {
    consultCase: { ...consultCase, status: "atandi", assignedExpertId: expert.id, assignedAtISO: nowISO },
    applied: true,
  };
}

/** Yalnız 'atandi' durumdaki bir vakayı, atanan uzman yanıtlayabilir — yanıt kanıt seviyesiyle gelir. */
export function answerCase(
  consultCase: ConsultationCase,
  responderRole: Role,
  responderExpertId: string,
  answerText: string,
  evidence: EvidenceGrade,
  nowISO: string
): CaseOutcome {
  if (!canAnswerConsultation(responderRole)) {
    return { consultCase, applied: false, reason: "Yetkisiz — compliance.review izni gerekir" };
  }
  if (consultCase.status !== "atandi") {
    return { consultCase, applied: false, reason: "Yalnız atanmış vaka yanıtlanabilir" };
  }
  if (consultCase.assignedExpertId !== responderExpertId) {
    return { consultCase, applied: false, reason: "Yalnız atanan uzman yanıtlayabilir" };
  }
  if (!answerText.trim()) {
    return { consultCase, applied: false, reason: "Boş yanıt kaydedilemez" };
  }
  return {
    consultCase: { ...consultCase, status: "yanitlandi", answer: answerText.trim(), answerEvidence: evidence, answeredAtISO: nowISO },
    applied: true,
  };
}

/** Yalnız 'yanitlandi' durumdaki bir vakayı, soran kişi veya yetkili rol kapatabilir. */
export function closeCase(consultCase: ConsultationCase, actorUserId: string, actorRole: Role, nowISO: string): CaseOutcome {
  if (consultCase.status !== "yanitlandi") {
    return { consultCase, applied: false, reason: "Yalnız yanıtlanmış vaka kapatılabilir" };
  }
  if (consultCase.askedBy !== actorUserId && !canAnswerConsultation(actorRole)) {
    return { consultCase, applied: false, reason: "Yalnız soran kişi veya yetkili rol kapatabilir" };
  }
  return { consultCase: { ...consultCase, status: "kapatildi", closedAtISO: nowISO }, applied: true };
}
