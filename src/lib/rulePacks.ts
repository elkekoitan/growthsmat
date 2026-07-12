// SmartGrowth OS — Jurisdiction/RulePack motoru + sertifika kapsam kontrolü
// (06-MEVZUAT-GIDA-GUVENLIGI §2/§14, PRD FR-124/125). "Organik bir pazarlama etiketi
// değildir": sertifika yoksa hiçbir koşulda 'sertifikali' iddiası döndürülmez.
// Karar, o tarihteki kural sürümünü korur (eski karar kökeni değişmez).

export type Jurisdiction = "TR" | "EU" | "US" | "CA" | "AU" | "JP" | "CODEX" | "SA" | "UK";

export interface RulePack {
  jurisdiction: Jurisdiction;
  domain: "organic_claims";
  version: string; // örn. "2026.07"
  effectiveFrom: string; // ISO
  effectiveTo?: string; // ISO (yoksa hâlâ yürürlükte)
  legalSources: string[];
  // TR/EU/US'tan en belirgin farklılaşan kural — yalnız gerçek araştırmayla doğrulanmış
  // jurisdiction'larda dolu (research/organic-certification-food-safety, 2026-07-12 mining).
  keyPrinciple?: string;
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
  {
    jurisdiction: "CA",
    domain: "organic_claims",
    version: "32.310-2026",
    effectiveFrom: "2026-03-01",
    legalSources: [
      "CAN/CGSB-32.310-2026, Organic Production Systems — General Principles and Management Standards",
      "CAN/CGSB-32.311, Permitted Substances Lists",
      "Safe Food for Canadians Regulations, Part 13 (Organic Products)",
    ],
    keyPrinciple:
      "İki katmanlı etiketleme: ≥%95 organik içerik 'organik' olarak satılabilir (kalan ≤%5 yalnız ticari organik alternatifi yoksa); %70–95 arası yalnız yüzde beyanı yapılabilir ('organik' denemez); %70 altı yalnız içindekiler listesinde tek tek belirtilebilir. Geçiş süresi 36 ay + ilk hasattan önce 12 ay tam standart uygulaması.",
  },
  {
    jurisdiction: "AU",
    domain: "organic_claims",
    version: "Edition 3.8",
    effectiveFrom: "2023-01-01",
    legalSources: ["National Standard for Organic and Bio-Dynamic Produce, Edition 3.8 (2022)", "DAFF ihracat sertifikasyon çerçevesi"],
    keyPrinciple:
      "Yalnız İHRACAT amaçlı teknik standart — DAFF tarafından ithalatçı ülkelerle hükümetler arası eşdeğerlik anlaşmaları için kullanılır; Avustralya iç pazarı için zorunlu bir organik standart YOKTUR (iç etiketleme gönüllü/sektör bazlı).",
  },
  {
    jurisdiction: "JP",
    domain: "organic_claims",
    version: "JAS 1605",
    effectiveFrom: "2024-07-31",
    legalSources: ["JAS 1605, Organic Products of Plant Origin", "MAFF JAS sertifikasyon sistemi"],
    keyPrinciple:
      "Filiz ve mantarlar 'organik bitkisel ürün' kapsamına özel teknik kurallarla dahildir (ör. filizler yalnız su ile, yapay aydınlatma olmadan; mantar substratı 3+ yıl yasaklı madde kullanılmamış odun/bambu ile sınırlı). Geçiş süresi 3 yıl (çok yıllık)/2 yıl (diğer); geçiş dönemi ürünleri sayısal eşik yerine 'geçiş dönemi' etiketiyle satılır.",
  },
  {
    jurisdiction: "CODEX",
    domain: "organic_claims",
    version: "CAC/GL 32-1999 Rev.1",
    effectiveFrom: "2004-01-01",
    legalSources: ["Codex Alimentarius CAC/GL 32-1999, Rev.1-2001 (2003/2004 değişiklikleriyle)", "FAO/WHO Gıda Standartları Programı"],
    keyPrinciple:
      "Tek bir sertifikasyon otoritesi yok — her üye ülkenin yetkili otoritesi ulusal düzeyde uygular; sınır ötesi ticaret ülkeler arası vaka-bazlı eşdeğerlik değerlendirmesine dayanır. Etiketleme eşiği: ≥%95 organik + %70–95 arası kademeli beyan + GDO'ya kesin yasak (madde 1.5).",
  },
  {
    jurisdiction: "SA",
    domain: "organic_claims",
    version: "2024",
    effectiveFrom: "2024-01-01",
    legalSources: [
      "SFDA Organic Food Clearance Conditions (Operations Sector), 2024",
      "GSO 9 (Ambalajlı Gıda Etiketleme)",
      "GSO 2374/2014 (Organik Gıda Üretim/Etiketleme Kılavuzu)",
    ],
    keyPrinciple:
      "Eşdeğerlik tanıma yerine ÜÇLÜ kaynak-ülke belgesi zorunluluğu (Organik Gıda Ürünü + Organik Üretim Birimi + Organik Gıda İhracat sertifikaları) ARTI Suudi ithalatçının MEWA-tanınan bir kuruluşça denetlenmiş olması şartı. Sertifika eşlik etmiyorsa ürün reddedilmez, konvansiyonel olarak yeniden etiketlenip satılır.",
  },
  {
    jurisdiction: "UK",
    domain: "organic_claims",
    version: "2025-08-20 güncellemesi",
    effectiveFrom: "2025-08-20",
    legalSources: ["GOV.UK: Organic food labelling and advertising rules (Defra rehberi)", "AB Organik Tüzüğü'nün İngiltere'de yürürlükte tutulan (retained) versiyonu"],
    keyPrinciple:
      "Brexit sonrası ikili GB/NI rejimi: AB organik logosu GB'de gönüllü ama Kuzey İrlanda'da paketli organik gıdada zorunlu; kontrol kuruluşu kodları ülkeye göre değişir (GB-ORG-XX / XI-ORG-XX / XX-BIO-XXX). AB tarzı %95 eşik geçerli ama ABD'deki ~%70 'Made with Organic' orta-kademe iddiasının eşdeğeri YOKTUR.",
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
  CA: "Kanada",
  AU: "Avustralya",
  JP: "Japonya",
  CODEX: "Codex Alimentarius (uluslararası)",
  SA: "Suudi Arabistan",
  UK: "Birleşik Krallık",
};
