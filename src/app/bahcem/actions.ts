"use server";
// SmartGrowth OS — /bahcem: keşif (/urunler, /plan) ile yetiştirme (/gorevler) ve satış
// (/pazar) arasındaki eksik halka. Kullanıcı bir ürün seçtiğinde artık bir yere yazılır,
// oradan tek bir sonraki adıma bağlanır.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import {
  addTrackedCrop,
  commitGeneratedTasks,
  getTrackedCrop,
  removeTrackedCrop,
  setTrackedCropStatus,
  type TrackedCropStatus,
} from "@/server/repositories/trackedCrops";
import { generateTaskSchedule, addDaysISO } from "@/lib/taskTemplates";
import { CROP_BY_ID } from "@/data/crops";

const STATUSES: TrackedCropStatus[] = ["planlaniyor", "ekildi", "buyuyor", "hasat", "arsiv"];

/** Bir ürünü oturum sahibinin bahçesine ekler (Ürün Kâşifi / plan sihirbazı çıkışı). */
export async function addToGardenAction(
  cropId: string,
  zone: string
): Promise<{ applied: boolean; reason?: string }> {
  const { membership } = await requireMembership();
  const res = await addTrackedCrop(membership.workspaceId, cropId, zone);
  if (!res.applied) return { applied: false, reason: res.reason };
  revalidatePath("/bahcem");
  return { applied: true };
}

/**
 * Bahçedeki bir ürün için görev takvimini GERÇEK görevlere yazar.
 * GÜVENLİK: takvim istemciden ALINMAZ; kaydın cropId'sinden sunucuda yeniden üretilir
 * (src/app/gorev-sablonu/actions.ts ile aynı desen). Takip kaydı workspace kapsamında
 * aranır — başka işletmenin id'si asla iş görmez.
 */
export async function generateTasksForCropAction(
  trackedCropId: string
): Promise<{ created: number; error?: string }> {
  const { membership } = await requireMembership();

  const tracked = await getTrackedCrop(membership.workspaceId, trackedCropId);
  if (!tracked) return { created: 0, error: "Ürün bahçende bulunamadı." };
  if (tracked.tasksGenerated) return { created: 0, error: "Bu ürün için görev takvimi zaten oluşturuldu." };

  const crop = CROP_BY_ID[tracked.cropId];
  if (!crop) return { created: 0, error: "Ürün bulunamadı." };

  const schedule = generateTaskSchedule(crop);
  const startDate = tracked.plantedAt ?? new Date().toISOString().slice(0, 10);

  // Görev yazma + "üretildi" işaretleme + durum geçişi TEK transaction'da (bkz. commitGeneratedTasks):
  // tek tek yazılırsa yarıda kesilen bir deneme görevleri çiftliyordu.
  const created = await commitGeneratedTasks(
    membership.workspaceId,
    tracked.id,
    schedule.map((t) => ({
      type: t.kind,
      title: t.title,
      cropId: tracked.cropId,
      zone: tracked.zone,
      date: addDaysISO(startDate, t.dayOffset),
    }))
  );
  if (created === 0) return { created: 0, error: "Bu ürün için görev takvimi zaten oluşturuldu." };

  revalidatePath("/bahcem");
  revalidatePath("/gorevler");
  return { created };
}

export async function setStatusAction(
  id: string,
  status: string
): Promise<{ applied: boolean; reason?: string }> {
  const { membership } = await requireMembership();
  if (!STATUSES.includes(status as TrackedCropStatus)) return { applied: false, reason: "Geçersiz durum." };

  const row = await setTrackedCropStatus(membership.workspaceId, id, status as TrackedCropStatus);
  if (!row) return { applied: false, reason: "Ürün bahçende bulunamadı." };
  revalidatePath("/bahcem");
  return { applied: true };
}

export async function removeFromGardenAction(id: string): Promise<{ applied: boolean; reason?: string }> {
  const { membership } = await requireMembership();
  const ok = await removeTrackedCrop(membership.workspaceId, id);
  if (!ok) return { applied: false, reason: "Ürün bahçende bulunamadı." };
  revalidatePath("/bahcem");
  return { applied: true };
}
