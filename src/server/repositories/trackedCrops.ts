// SmartGrowth OS — Bahçem (TrackedCrop) repository katmanı (gerçek Postgres CRUD).
// DÜRÜSTLÜK NOTU: bu katmandan önce "kullanıcının takip ettiği ürün" diye bir kavram yoktu —
// /urunler kâşifi ve /plan sihirbazı ürün öneriyor, kullanıcı seçiyor, seçim hiçbir yere
// yazılmıyordu (keşif → yetiştirme arası kopuktu). Buradaki kayıtlar kullanıcının GERÇEKTEN
// girdiği seçimlerdir; hiçbir tohum/örnek veri üretilmez (listOrSeedTasks'in aksine —
// boş bahçe GERÇEKTEN boştur ve UI'da öyle gösterilir).
import "server-only";

import { getDb } from "../db";
import type { TaskInput } from "./tasks";
import { CROP_BY_ID } from "@/data/crops";

export type TrackedCropStatus = "planlaniyor" | "ekildi" | "buyuyor" | "hasat" | "arsiv";

export interface TrackedCrop {
  id: string;
  workspaceId: string;
  cropId: string;
  zone: string;
  status: TrackedCropStatus;
  plantedAt?: string; // yyyy-mm-dd
  tasksGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

function toTrackedCrop(row: {
  id: string;
  workspaceId: string;
  cropId: string;
  zone: string;
  status: string;
  plantedAt: Date | null;
  tasksGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TrackedCrop {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    cropId: row.cropId,
    zone: row.zone,
    status: row.status as TrackedCropStatus,
    plantedAt: row.plantedAt ? row.plantedAt.toISOString().slice(0, 10) : undefined,
    tasksGenerated: row.tasksGenerated,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Bir workspace'in bahçesindeki ürünler (eklenme sırasıyla). Tohum verisi YOK. */
export async function listTrackedCrops(workspaceId: string): Promise<TrackedCrop[]> {
  const db = getDb();
  const rows = await db.trackedCrop.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toTrackedCrop);
}

export type AddTrackedCropResult =
  | { applied: true; trackedCrop: TrackedCrop }
  | { applied: false; reason: string };

/**
 * Bir ürünü bahçeye ekler. Aynı ürün+bölge ikinci kez eklenirse HATA DEĞİL — mevcut kayıt
 * döner (kullanıcı "Bahçeme ekle"ye iki kez basınca çuvallamasın, compound unique üstünde
 * upsert). cropId statik katalogda (src/data/crops.ts) yoksa reddedilir — DB FK olmadığı
 * için doğrulama bu katmanın işi.
 */
export async function addTrackedCrop(
  workspaceId: string,
  cropId: string,
  zone: string
): Promise<AddTrackedCropResult> {
  if (!CROP_BY_ID[cropId]) return { applied: false, reason: "Ürün bulunamadı." };
  const safeZone = zone.trim() || "Belirtilmedi";

  const db = getDb();
  const row = await db.trackedCrop.upsert({
    where: { workspaceId_cropId_zone: { workspaceId, cropId, zone: safeZone } },
    create: { workspaceId, cropId, zone: safeZone },
    update: {},
  });
  return { applied: true, trackedCrop: toTrackedCrop(row) };
}

/** Tek bir takip kaydını workspace kapsamında getirir (başka işletmenin kaydı asla dönmez). */
export async function getTrackedCrop(workspaceId: string, id: string): Promise<TrackedCrop | undefined> {
  const db = getDb();
  const row = await db.trackedCrop.findFirst({ where: { id, workspaceId } });
  return row ? toTrackedCrop(row) : undefined;
}

/**
 * Durum değiştirir. "ekildi"ye geçerken ekim tarihi henüz yoksa bugüne yazılır — kullanıcı
 * durumu değiştirdiğinde gerçekten olmuş bir olayı işaretliyor; tarih uydurma değil, o anın
 * kaydı. updateMany + workspaceId: id tek başına ASLA yeterli değil (tenant izolasyonu).
 */
export async function setTrackedCropStatus(
  workspaceId: string,
  id: string,
  status: TrackedCropStatus
): Promise<TrackedCrop | undefined> {
  const db = getDb();
  const existing = await db.trackedCrop.findFirst({ where: { id, workspaceId } });
  if (!existing) return undefined;

  const plantedAt =
    status !== "planlaniyor" && !existing.plantedAt ? new Date(new Date().toISOString().slice(0, 10)) : undefined;

  await db.trackedCrop.updateMany({
    where: { id, workspaceId },
    data: { status, ...(plantedAt ? { plantedAt } : {}) },
  });
  const row = await db.trackedCrop.findFirst({ where: { id, workspaceId } });
  return row ? toTrackedCrop(row) : undefined;
}

/**
 * Üretilen görev takvimini yazar VE takip kaydını "üretildi" olarak işaretler — tek transaction
 * içinde, ya hepsi ya hiçbiri.
 * NEDEN TRANSACTION: görevler tek tek yazılıp sonra işaretlenirse, yazma yarıda kesildiğinde
 * tasksGenerated=false kalıyor ve ikinci deneme görevleri ÇİFTLİYORDU (Task'ta bunu engelleyecek
 * unique kısıt yok — takvim tekilliği bu bayrağa bağlı). İşaretleme ÖNCE yapılır ve
 * `tasksGenerated: false` koşuluyla kayıt "kapılır": eşzamanlı ikinci çağrı 0 satır güncelleyip
 * hiç görev yazmadan döner. createMany patlarsa kapma da geri alınır → tekrar denenebilir.
 * status "planlaniyor" ise aynı transaction'da "ekildi"ye geçer (takvim = ekim yapıldı demek).
 * @returns yazılan görev sayısı; 0 ise takvim zaten üretilmişti (kayıt kapılamadı).
 */
export async function commitGeneratedTasks(
  workspaceId: string,
  id: string,
  tasks: TaskInput[]
): Promise<number> {
  const db = getDb();
  const today = new Date(new Date().toISOString().slice(0, 10));

  return db.$transaction(async (tx) => {
    const existing = await tx.trackedCrop.findFirst({ where: { id, workspaceId } });
    if (!existing || existing.tasksGenerated) return 0;

    const claimed = await tx.trackedCrop.updateMany({
      where: { id, workspaceId, tasksGenerated: false },
      data: {
        tasksGenerated: true,
        ...(existing.status === "planlaniyor"
          ? { status: "ekildi", plantedAt: existing.plantedAt ?? today }
          : {}),
      },
    });
    if (claimed.count === 0) return 0;

    await tx.task.createMany({
      data: tasks.map((t) => ({
        workspaceId,
        type: t.type,
        title: t.title,
        cropId: t.cropId,
        zone: t.zone,
        date: new Date(t.date),
        critical: t.critical ?? false,
      })),
    });
    return tasks.length;
  });
}

/** Bahçeden kaldırır. Bu ürün için ÜRETİLMİŞ görevler SİLİNMEZ — olmuş iş kaydı kalır. */
export async function removeTrackedCrop(workspaceId: string, id: string): Promise<boolean> {
  const db = getDb();
  const res = await db.trackedCrop.deleteMany({ where: { id, workspaceId } });
  return res.count > 0;
}
