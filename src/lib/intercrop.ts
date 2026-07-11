// SmartGrowth OS — Birlikte ekim ilişki/yerleşim motoru (03-TEKNIK-MIMARI §8, 05 §6)
// Kanıtı zayıf (D/E) "faydalı" ilişki 'deneysel' etiketi alır — kesin tavsiye DEĞİL
// (FR-062). Aynı aile çiftleri "ortak hastalık baskısı" riski taşır.

import { CROP_BY_ID, type Crop, type CompanionRelation } from "@/data/crops";

export type PairDirection = "a→b" | "b→a" | "cift-yonlu" | "yok";

export interface IntercropPair {
  a: string;
  b: string;
  relation?: CompanionRelation;
  reverseRelation?: CompanionRelation;
  direction: PairDirection;
  experimental: boolean; // kanıt D/E ve faydalı → kesin sayılmaz
  riskFlags: string[];
}

export interface IntercropResult {
  pairs: IntercropPair[];
  overallRisks: string[];
  plantingNotes: string[];
}

function relationBetween(a: Crop, b: Crop): CompanionRelation | undefined {
  return a.companions.find((c) => c.cropId === b.id);
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
