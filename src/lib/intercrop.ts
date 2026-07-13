// SmartGrowth OS — Birlikte ekim ilişki/yerleşim motoru (03-TEKNIK-MIMARI §8, 05 §6)
// Kanıtı zayıf (D/E) "faydalı" ilişki 'deneysel' etiketi alır — kesin tavsiye DEĞİL
// (FR-062). Aynı aile çiftleri "ortak hastalık baskısı" riski taşır.
//
// 2026-07-13 (P05-12 dokümantasyon denetimi): 03-TEKNIK-MIMARI.md §8'in istediği ÇOK
// BOYUTLU CropRelation (relation_type/controlled mechanism enum/confidence) src/data/
// crops.ts'teki CompanionRelation'da yoktu — yalnız effect/serbest-metin mechanism/evidence
// vardı. Bu SAF, deterministik kategorileştirme katmanı o boşluğun GERÇEKTEN kapatılabilir
// kısmını kapatır: her ilişkinin zaten var olan, kaynaklı `mechanism` metninden (40 gerçek
// ilişki, research/companion-planting-rotation/) anahtar-kelime eşlemesiyle bir kontrollü
// kategori + relation type türetilir, `evidence`den confidence türetilir — SERBEST METİN
// KAYBOLMAZ/DEĞİŞMEZ, yalnız üstüne sorgulanabilir bir kategori eklenir. DÜRÜSTLÜK NOTU:
// spatial_pattern/temporal_pattern/climate_scope/sources gibi alanlar buraya EKLENMEDİ —
// bunlar her ilişki çifti için gerçek, ayrı bir araştırma kaynağı gerektirir; var olmayan
// bir kaynağı uydurmak "sahte kesinlik" olurdu (bkz. roadmap.ts P05-12 notu).

import { CROP_BY_ID, type Crop, type CompanionRelation, type EvidenceGrade } from "@/data/crops";

export type PairDirection = "a→b" | "b→a" | "cift-yonlu" | "yok";

/** 03-TEKNIK-MIMARI §8'in "mechanism: light|root_depth|nitrogen|pest|disease|pollinator|timing"
 * enum'una en yakın kontrollü kategori — "rekabet"/"diger" spesifikasyonun kapsamadığı ama
 * gerçek verinin ihtiyaç duyduğu iki ek kategoridir. */
export type MechanismCategory =
  | "isik" // light
  | "kok" // root_depth
  | "azot" // nitrogen
  | "zararli" // pest
  | "hastalik" // disease
  | "polinator" // pollinator
  | "zamanlama" // timing
  | "rekabet"
  | "diger";

export type RelationType = "birlikte-ekim" | "tuzak-bitki" | "kenar-serit"; // intercrop | trap_crop | border
// (rotation/succession ayrı motorlarda modellenir: rotation.ts / taskTemplates.ts successionCrop)

export type ConfidenceLevel = "yuksek" | "orta" | "dusuk";

/** Mevcut, kaynaklı serbest-metin mechanism'ı DEĞİŞTİRMEDEN kontrollü kategoriye eşler. */
export function categorizeMechanism(mechanism: string): MechanismCategory {
  const m = mechanism.toLocaleLowerCase("tr");
  if (m.includes("tuzak bitki")) return "zararli"; // tuzak bitki de temelde bir zararlı-yönetim mekanizmasıdır
  if (m.includes("azot")) return "azot";
  if (m.includes("polinat")) return "polinator";
  if (m.includes("hastalık") || m.includes("mildiyö") || m.includes("uyuz") || m.includes("scab")) return "hastalik";
  if (
    m.includes("zararlı") ||
    m.includes("böcek") ||
    m.includes("tırtıl") ||
    m.includes("kurdu") ||
    m.includes("güve") ||
    m.includes("thrips") ||
    m.includes("kelebek") ||
    m.includes("sinek") ||
    m.includes("voc")
  )
    return "zararli";
  if (m.includes("zaman") || m.includes("erken") || m.includes("hasat uyum")) return "zamanlama";
  if (m.includes("kök")) return "kok";
  if (m.includes("gölge") || m.includes("ışık") || m.includes("alan katman") || m.includes("alan verim")) return "isik";
  if (m.includes("rekabet") || m.includes("uyumsuz")) return "rekabet";
  return "diger";
}

/** Serbest-metin mechanism'ından relation type türetir — açık anahtar kelime yoksa "birlikte-ekim". */
export function relationTypeOf(mechanism: string): RelationType {
  const m = mechanism.toLocaleLowerCase("tr");
  if (m.includes("tuzak bitki")) return "tuzak-bitki";
  if (m.includes("şerit ekim")) return "kenar-serit";
  return "birlikte-ekim";
}

/** evidence (A-E) → confidence — sahte hassasiyet eklemeden 3 kovaya sadeleştirir. */
export function confidenceFromEvidence(grade: EvidenceGrade): ConfidenceLevel {
  if (grade === "A" || grade === "B") return "yuksek";
  if (grade === "C") return "orta";
  return "dusuk"; // D, E
}

export interface EnrichedCompanionRelation extends CompanionRelation {
  mechanismCategory: MechanismCategory;
  relationType: RelationType;
  confidence: ConfidenceLevel;
}

/** Ham CompanionRelation'ı türetilmiş kategori alanlarıyla zenginleştirir — girdi mutate edilmez. */
export function enrichRelation(rel: CompanionRelation): EnrichedCompanionRelation {
  return {
    ...rel,
    mechanismCategory: categorizeMechanism(rel.mechanism),
    relationType: relationTypeOf(rel.mechanism),
    confidence: confidenceFromEvidence(rel.evidence),
  };
}

export interface IntercropPair {
  a: string;
  b: string;
  relation?: EnrichedCompanionRelation;
  reverseRelation?: EnrichedCompanionRelation;
  direction: PairDirection;
  experimental: boolean; // kanıt D/E ve faydalı → kesin sayılmaz
  riskFlags: string[];
}

export interface IntercropResult {
  pairs: IntercropPair[];
  overallRisks: string[];
  plantingNotes: string[];
}

function relationBetween(a: Crop, b: Crop): EnrichedCompanionRelation | undefined {
  const rel = a.companions.find((c) => c.cropId === b.id);
  return rel ? enrichRelation(rel) : undefined;
}

/** Bir ürün grubunun birlikte ekim ilişkilerini ve risklerini değerlendirir. */
export function evaluateIntercrop(cropIds: string[]): IntercropResult {
  const crops = cropIds.map((id) => CROP_BY_ID[id]).filter((c): c is Crop => Boolean(c));
  const pairs: IntercropPair[] = [];
  const overallRisks = new Set<string>();

  for (let i = 0; i < crops.length; i++) {
    for (let j = i + 1; j < crops.length; j++) {
      const a = crops[i];
      const b = crops[j];
      const relAB = relationBetween(a, b);
      const relBA = relationBetween(b, a);

      let direction: PairDirection = "yok";
      if (relAB && relBA) direction = "cift-yonlu";
      else if (relAB) direction = "a→b";
      else if (relBA) direction = "b→a";

      const riskFlags: string[] = [];

      // Aynı aile → ortak hastalık/zararlı baskısı (aynı yatakta yan yana riski)
      if (a.family === b.family) {
        const flag = `Aynı aile (${a.family}) — ortak hastalık/zararlı baskısı riski`;
        riskFlags.push(flag);
        overallRisks.add(flag);
      }

      // Riskli ilişki → mekanizmayla işaretle
      for (const rel of [relAB, relBA]) {
        if (rel?.effect === "riskli") {
          const flag = `${a.name}/${b.name}: ${rel.mechanism}`;
          riskFlags.push(flag);
          overallRisks.add(flag);
        }
      }

      // Deneysel: kanıt D/E ve faydalı → kesin tavsiye değil
      const experimental = [relAB, relBA].some(
        (r) => r?.effect === "faydali" && (r.evidence === "D" || r.evidence === "E")
      );

      pairs.push({ a: a.id, b: b.id, relation: relAB, reverseRelation: relBA, direction, experimental, riskFlags });
    }
  }

  return {
    pairs,
    overallRisks: Array.from(overallRisks),
    plantingNotes: suggestLayout(cropIds),
  };
}

/**
 * Basit deterministik yerleşim önerisi: yüksek/destekli ürünler (careLoad 3 veya
 * büyük kök hacmi) kuzeye, kısa/yapraklı güneye — gölgeleme çakışmasını azaltır.
 */
export function suggestLayout(cropIds: string[]): string[] {
  const crops = cropIds.map((id) => CROP_BY_ID[id]).filter((c): c is Crop => Boolean(c));
  if (crops.length < 2) return [];

  const tall = crops
    .filter((c) => c.careLoad === 3 || (c.minContainerL ?? 0) >= 40)
    .map((c) => c.name);
  const short = crops.filter((c) => c.category === "yaprakli").map((c) => c.name);

  const notes: string[] = [];
  if (tall.length) notes.push(`Kuzey sıraya: ${tall.join(", ")} (yüksek/destekli — gölge yapmaması için).`);
  if (short.length) notes.push(`Güney sıraya: ${short.join(", ")} (kısa/yapraklı — ışığı üstteki katman engellemesin).`);
  notes.push("Sulama ihtiyacı farklı ürünleri ayrı damla hattına al.");
  return notes;
}
