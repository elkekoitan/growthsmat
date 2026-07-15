// SmartGrowth OS — Parsel sezon geçmişi repository katmanı (/rotasyon kalıcılığı).
// DÜRÜSTLÜK NOTU: /rotasyon'un çözücüsü (src/lib/rotation.ts) SAF kalır — bu katman yalnız
// kullanıcının GİRDİĞİ ham geçmişi (parsel, göreli sezon yuvası, ürün) okur/yazar; hesaplanan
// rotasyon sonucu hiçbir zaman kalıcılaştırılmaz (Plan/AssessmentResult ile aynı ilke).
// yearSlot = PlotHistoryEntry.seasonsAgo ile birebir aynı anlam (1 = bir sezon önce...).
import "server-only";

import { getDb } from "../db";
import { CROP_BY_ID } from "@/data/crops";

export interface PlotSeasonEntry {
  plotName: string;
  yearSlot: number;
  cropId: string;
}

export type PlotSeasonWriteResult = { applied: true } | { applied: false; reason: string };

/** Bir workspace'in kayıtlı parsel geçmişini döner (parsel + sezon yuvası sırasıyla). */
export async function listPlotSeasons(workspaceId: string): Promise<PlotSeasonEntry[]> {
  const db = getDb();
  const rows = await db.plotSeason.findMany({
    where: { workspaceId },
    orderBy: [{ plotName: "asc" }, { yearSlot: "asc" }],
  });
  return rows.map((r) => ({ plotName: r.plotName, yearSlot: r.yearSlot, cropId: r.cropId }));
}

/**
 * Bir parselin bir sezon yuvasına ekilen ürünü yazar (varsa günceller — compound unique
 * üzerinde upsert). cropId src/data/crops.ts kataloğunda doğrulanır: bilinmeyen bir id
 * ASLA yazılmaz — DB FK olmayan düz string referansın (Task.cropId deseni) doğrulama
 * yükümlülüğü bu katmandadır.
 */
export async function upsertPlotSeason(
  workspaceId: string,
  plotName: string,
  yearSlot: number,
  cropId: string
): Promise<PlotSeasonWriteResult> {
  if (!CROP_BY_ID[cropId]) return { applied: false, reason: "Bilinmeyen ürün — katalogda yok." };
  if (!Number.isInteger(yearSlot) || yearSlot < 1) {
    return { applied: false, reason: "Geçersiz sezon yuvası." };
  }
  const db = getDb();
  await db.plotSeason.upsert({
    where: { workspaceId_plotName_yearSlot: { workspaceId, plotName, yearSlot } },
    create: { workspaceId, plotName, yearSlot, cropId },
    update: { cropId },
  });
  return { applied: true };
}

/** Bir parselin bir sezon yuvasındaki kaydı siler ("Ekim yok / bilinmiyor" seçimi). */
export async function removePlotSeason(
  workspaceId: string,
  plotName: string,
  yearSlot: number
): Promise<void> {
  const db = getDb();
  await db.plotSeason.deleteMany({ where: { workspaceId, plotName, yearSlot } });
}
