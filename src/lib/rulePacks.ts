// SmartGrowth OS — Jurisdiction/RulePack motoru + sertifika kapsam kontrolü
// (06-MEVZUAT-GIDA-GUVENLIGI §2/§14, PRD FR-124/125). "Organik bir pazarlama etiketi
// değildir": sertifika yoksa hiçbir koşulda 'sertifikali' iddiası döndürülmez.
// Karar, o tarihteki kural sürümünü korur (eski karar kökeni değişmez).

export type Jurisdiction = "TR" | "EU" | "US";

export interface RulePack {
  jurisdiction: Jurisdiction;
  domain: "organic_claims";
  version: string; // örn. "2026.07"
  effectiveFrom: string; // ISO
  effectiveTo?: string; // ISO (yoksa hâlâ yürürlükte)
  legalSources: string[];
}

export const RULE_PACKS: RulePack[] = [
  {
    jurisdiction: "TR",
    domain: "organic_claims",
    version: "2026.07",
    effectiveFrom: "2026-01-01",
    legalSources: ["5262 sayılı Organik Tarım Kanunu", "Organik Tarımın Esasları Yönetmeliği (27676)"],
  },
  {
    jurisdiction: "TR",
    domain: "organic_claims",
    version: "2024.01",
    effectiveFrom: "2024-01-01",
    effectiveTo: "2025-12-31",
    legalSources: ["5262 sayılı Organik Tarım Kanunu (2024 sürümü)"],
  },
  {
    jurisdiction: "EU",
    domain: "organic_claims",
    version: "2026.03",
    effectiveFrom: "2026-01-01",
    legalSources: ["Regulation (EU) 2018/848", "Uygulama/delege düzenlemeleri"],
  },
  {
    jurisdiction: "US",
    domain: "organic_claims",
    version: "2026.06",
    effectiveFrom: "2026-01-01",
    legalSources: ["USDA National Organic Program, 7 CFR Part 205", "Strengthening Organic Enforcement"],
  },
];

export interface Certificate {
  id: string;
  holder: string;
  jurisdiction: Jurisdiction;
  scopeCropIds: string[]; // sertifika kapsamındaki ürünler
  validFrom: string; // ISO
  validTo: string; // ISO
  issuer: string;
  inTransition?: boolean; // geçiş süreci
}

export type ClaimStatus =
  | "sertifikali"
  | "gecis-sureci"
  | "suresi-dolmus"
  | "kapsam-disi"
  | "belge-yok";

export interface ClaimResult {
  allowed: boolean;
  status: ClaimStatus;
  reason: string;
  packVersion: string | null;
}

/** Yürürlük tarihine göre bir yargı alanı için doğru kural paketi sürümünü seçer. */
export function selectActivePack(
  jurisdiction: Jurisdiction,
  nowISO: string,
  packs: RulePack[] = RULE_PACKS
): RulePack | undefined {
  return packs
    .filter((p) => p.jurisdiction === jurisdiction)
    .filter((p) => p.effectiveFrom <= nowISO && (!p.effectiveTo || p.effectiveTo >= nowISO))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

/**
 * Bir organik iddianın yayınlanabilir olup olmadığını değerlendirir. Sertifika yoksa
 * ASLA 'sertifikali' dönmez (allowed=false). Karar, seçilen paketin sürümünü taşır.
 */
export function evaluateClaim(
  cert: Certificate | undefined,
  cropId: string,
  jurisdiction: Jurisdiction,
  nowISO: string,
  packs: RulePack[] = RULE_PACKS
): ClaimResult {
  const pack = selectActivePack(jurisdiction, nowISO, packs);
  const packVersion = pack?.version ?? null;

  if (!pack) {
    return { allowed: false, status: "belge-yok", reason: `${jurisdiction} için yürürlükte kural paketi yok`, packVersion: null };
  }

  if (!cert) {
    return { allowed: false, status: "belge-yok", reason: "Sertifika belgesi yok — organik iddia yayınlanamaz", packVersion };
  }

  if (cert.jurisdiction !== jurisdiction) {
    return { allowed: false, status: "kapsam-disi", reason: "Sertifika farklı yargı alanına ait", packVersion };
  }

  if (nowISO < cert.validFrom || nowISO > cert.validTo) {
    return { allowed: false, status: "suresi-dolmus", reason: `Sertifika geçerlilik dışı (${cert.validFrom}–${cert.validTo})`, packVersion };
  }

  if (!cert.scopeCropIds.includes(cropId)) {
    return { allowed: false, status: "kapsam-disi", reason: "Ürün sertifika kapsamında değil", packVersion };
  }

  if (cert.inTransition) {
    return { allowed: true, status: "gecis-sureci", reason: "Geçiş süreci — açık etiketle sunulur", packVersion };
  }

  return { allowed: true, status: "sertifikali", reason: `${cert.issuer} sertifikası kapsamında geçerli`, packVersion };
}

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  TR: "Türkiye",
  EU: "Avrupa Birliği",
  US: "ABD",
};
