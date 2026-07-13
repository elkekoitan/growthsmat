// SmartGrowth OS — Uzman rosteri repository katmanı (gerçek Postgres, platform-geneli).
// DÜRÜSTLÜK NOTU: workspaceId YOK — roster tüm platform için tek, sabit/küçük bir listedir
// (eski src/lib/expertConsult.ts EXPERTS sabitiyle birebir aynı), tek seferde tohumlanır.
import "server-only";

import { getDb } from "../db";
import type { ExpertProfile, ConsultSpecialty, VerificationStatus } from "@/lib/expertConsult";

function toDomainExpert(row: {
  id: string;
  name: string;
  credentials: string;
  specialties: string[];
  verification: string;
  avgResponseHours: number;
  caseCount: number;
}): ExpertProfile {
  return {
    id: row.id,
    name: row.name,
    credentials: row.credentials,
    specialties: row.specialties as ConsultSpecialty[],
    verification: row.verification as VerificationStatus,
    avgResponseHours: row.avgResponseHours,
    caseCount: row.caseCount,
  };
}

const SEED_EXPERTS: ExpertProfile[] = [
  { id: "exp-naz", name: "Dr. Naz Aydın", credentials: "Ziraat Yüksek Mühendisi, Bitki Koruma, 12 yıl", specialties: ["bitki-korumasi", "gida-guvenligi"], verification: "dogrulanmis", avgResponseHours: 6, caseCount: 41 },
  { id: "exp-mert", name: "Mert Kaya", credentials: "Ziraat Mühendisi, Toprak Bilimi, 8 yıl", specialties: ["toprak-bilimi"], verification: "dogrulanmis", avgResponseHours: 18, caseCount: 12 },
  { id: "exp-selin", name: "Selin Öz", credentials: "Gıda Mühendisi, Organik Sertifikasyon Denetçisi, 6 yıl", specialties: ["organik-sertifikasyon", "gida-guvenligi"], verification: "dogrulanmis", avgResponseHours: 30, caseCount: 9 },
  { id: "exp-baris", name: "Barış Demir", credentials: "Ziraat Mühendisi (yeni kayıt), Bitki Koruma", specialties: ["bitki-korumasi"], verification: "dogrulanmamis", avgResponseHours: 4, caseCount: 0 },
  { id: "exp-elif", name: "Elif Şahin", credentials: "Gıda Güvenliği Danışmanı — inceleme askıda", specialties: ["gida-guvenligi"], verification: "askida", avgResponseHours: 24, caseCount: 5 },
];

export async function listOrSeedExperts(): Promise<ExpertProfile[]> {
  const db = getDb();
  const count = await db.expert.count();
  if (count === 0) {
    await db.expert.createMany({ data: SEED_EXPERTS });
  }
  const rows = await db.expert.findMany({ orderBy: { avgResponseHours: "asc" } });
  return rows.map(toDomainExpert);
}
