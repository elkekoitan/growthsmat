"use server";
// SmartGrowth OS — /rotasyon: parsel geçmişini gerçek kayda yazar.
// Çözücü (evaluateRotation) istemcide SAF kalır — burada yalnız kullanıcının girdiği ham
// geçmiş (parsel, göreli sezon yuvası, ürün) kalıcılaştırılır; hesaplanan sonuç yazılmaz.
// GÜVENLİK: workspaceId istemciden ALINMAZ — her zaman oturumun aktif üyeliğinden gelir.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import {
  upsertPlotSeason,
  removePlotSeason,
  type PlotSeasonWriteResult,
} from "@/server/repositories/plotSeasons";

/** Bir sezon yuvasına ekilen ürünü kaydeder/günceller. */
export async function savePlotSeasonAction(
  plotName: string,
  yearSlot: number,
  cropId: string
): Promise<PlotSeasonWriteResult> {
  const { membership } = await requireMembership();
  const safePlot = plotName.trim() || "Ana parsel";
  const result = await upsertPlotSeason(membership.workspaceId, safePlot, yearSlot, cropId);
  revalidatePath("/rotasyon");
  return result;
}

/** Bir sezon yuvasının kaydını kaldırır ("Ekim yok / bilinmiyor" seçimi). */
export async function removePlotSeasonAction(
  plotName: string,
  yearSlot: number
): Promise<PlotSeasonWriteResult> {
  const { membership } = await requireMembership();
  const safePlot = plotName.trim() || "Ana parsel";
  await removePlotSeason(membership.workspaceId, safePlot, yearSlot);
  revalidatePath("/rotasyon");
  return { applied: true };
}
