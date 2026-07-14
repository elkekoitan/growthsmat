"use server";
// SmartGrowth OS — /gorev-sablonu: üretilen görev takvimini gerçek görevlere yazar.
// Demo hesap makinesini gerçek bir iş akışı adımına çevirir: şablon → /gorevler'e gerçek kayıt.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createTask, type TaskInput } from "@/server/repositories/tasks";
import { generateTaskSchedule, addDaysISO } from "@/lib/taskTemplates";
import { CROP_BY_ID } from "@/data/crops";

/**
 * Üretilen görev şablonunu oturum sahibinin gerçek görevlerine ekler.
 * requireMembership() anonim ziyaretçiyi /giris'e yönlendirir — istenen kapı budur.
 * GÜVENLİK: takvim istemciden ALINMAZ; cropId'den sunucu tarafında yeniden üretilir
 * (kurcalanamaz).
 */
export async function applyScheduleToTasksAction(
  cropId: string,
  zone: string,
  startDateISO: string
): Promise<{ created: number; error?: string }> {
  const { membership } = await requireMembership();

  const crop = CROP_BY_ID[cropId];
  if (!crop) return { created: 0, error: "Ürün bulunamadı." };

  // Takvimi sunucuda yeniden üret — istemciden gelen listeye güvenme.
  const schedule = generateTaskSchedule(crop);

  // Başlangıç tarihini doğrula; geçersizse bugüne (UTC) düş.
  let startDate = startDateISO;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(startDateISO) && !Number.isNaN(new Date(startDateISO + "T00:00:00Z").getTime());
  if (!valid) startDate = new Date().toISOString().slice(0, 10);

  const safeZone = zone.trim() || "Belirtilmedi";

  for (const t of schedule) {
    const input: TaskInput = {
      type: t.kind,
      title: t.title,
      cropId,
      zone: safeZone,
      date: addDaysISO(startDate, t.dayOffset),
    };
    await createTask(membership.workspaceId, input);
  }

  revalidatePath("/gorevler");
  return { created: schedule.length };
}
