// SmartGrowth OS — Görev (saha günlüğü) repository katmanı (gerçek Postgres CRUD).
// NOT: eski Tasks.tsx'in yerel "TaskType" union'ı "gubreleme" yazıyordu, src/lib/taskTemplates.ts'in
// "TaskKind"'i ise "gubre" — iki dosya arasında gerçek bir yazım tutarsızlığıydı (bkz. schema.prisma
// TaskKind yorumu). Bu katman ve aşağıdaki tohum verisi tek kanonik değeri ("gubre") kullanır.
// DÜRÜSTLÜK NOTU: eski "offline" alanı (çevrimdışı kaydedildi/senkron bekliyor) KASITLI OLARAK
// buraya taşınmadı — o hep dekoratifti (hiçbir gerçek ağ/senkron mantığına bağlı değildi, bkz.
// önceki keşif); gerçek Postgres kalıcılığıyla "çevrimdışı, senkron bekliyor" öncülü zaten geçersiz.
import "server-only";

import { getDb } from "../db";
import { can, fromPrismaRole, type Role } from "@/lib/roles";

export type TaskKind = "ekim" | "sulama" | "gubre" | "budama" | "gozlem" | "hasat";

export interface TaskInput {
  type: TaskKind;
  title: string;
  cropId: string;
  zone: string;
  date: string; // yyyy-mm-dd
  critical?: boolean;
}

export interface RealTask extends TaskInput {
  id: string;
  workspaceId: string;
  done: boolean;
  note?: string;
  measurement?: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  createdAt: string;
  updatedAt: string;
}

function toRealTask(row: {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  cropId: string;
  zone: string;
  date: Date;
  done: boolean;
  critical: boolean;
  note: string | null;
  measurement: string | null;
  assignedToUserId: string | null;
  assignedTo?: { email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): RealTask {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    type: row.type as TaskKind,
    title: row.title,
    cropId: row.cropId,
    zone: row.zone,
    date: row.date.toISOString().slice(0, 10),
    done: row.done,
    critical: row.critical,
    note: row.note ?? undefined,
    measurement: row.measurement ?? undefined,
    assignedToUserId: row.assignedToUserId ?? undefined,
    assignedToEmail: row.assignedTo?.email ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Bugüne göreli tohum görevleri — eski Tasks.tsx'teki seedTasks() ile birebir aynı (yalnız
 * "gubreleme" → "gubre" düzeltildi ve dekoratif "offline" alanı düşürüldü). */
function seedRows(): (TaskInput & { done: boolean; note?: string; measurement?: string })[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const iso = (n: number) => {
    const x = new Date(today);
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
  };
  return [
    { type: "sulama", title: "Sabah suyu kaçtı", cropId: "feslegen", zone: "Mutfak pervazı", date: iso(-1), done: false },
    { type: "sulama", title: "Sıcak dalgasında kök nemi", cropId: "salatalik", zone: "Sera tüneli", date: iso(0), done: false, critical: true },
    { type: "budama", title: "Koltuk al ve bağla", cropId: "sirik-domates-beefsteak", zone: "Yatak A2", date: iso(0), done: false },
    { type: "gozlem", title: "Lahana kelebeği taraması", cropId: "lahana-brokoli", zone: "Yatak B1", date: iso(0), done: false },
    {
      type: "hasat", title: "İlk kes-gelsin turu", cropId: "roka", zone: "Yükseltilmiş yatak", date: iso(0), done: true,
      measurement: "318 g", note: "İlk kesim 318 g. Göbek bırakıldı; 10-12 gün sonra ikinci tur beklenir.",
    },
    {
      type: "gozlem", title: "Seyreltme ve aralık ölçümü", cropId: "havuc", zone: "Saksı sırası 3", date: iso(0), done: true,
      measurement: "6 cm aralık", note: "Fideler seyreltildi, sıra üzeri 6 cm bırakıldı. Toprak taşsız.",
    },
    { type: "ekim", title: "İkinci parti tohum", cropId: "turp-bahce", zone: "Saksı sırası 3", date: iso(1), done: false },
    { type: "gubre", title: "Çiçek sonrası besleme", cropId: "cilek", zone: "Dikey saksı kulesi", date: iso(1), done: false, critical: true },
    { type: "hasat", title: "Dış yapraklardan hasat", cropId: "marul", zone: "Balkon — Kuzey", date: iso(2), done: false },
    { type: "sulama", title: "Rizom saksısını kontrol et", cropId: "nane", zone: "Saksı (sınırlı)", date: iso(3), done: false },
    { type: "budama", title: "Uç alma ile çalılaştır", cropId: "feslegen", zone: "Mutfak pervazı", date: iso(4), done: false },
    { type: "gubre", title: "Sıvı besleme turu", cropId: "biber-carliston", zone: "Balkon — Güney", date: iso(6), done: false },
    { type: "ekim", title: "Sırık fasulye çıkımı", cropId: "fasulye-sirik", zone: "Sırık hattı", date: iso(8), done: false },
    { type: "hasat", title: "Şeker bezelye ilk toplama", cropId: "bezelye", zone: "Yatak C", date: iso(9), done: false },
  ];
}

/** Bir workspace'in görevlerini döner; hiç görevi yoksa (ilk ziyaret) tohum verisiyle doldurur. */
export async function listOrSeedTasks(workspaceId: string): Promise<RealTask[]> {
  const db = getDb();
  const count = await db.task.count({ where: { workspaceId } });
  if (count === 0) {
    await db.task.createMany({
      data: seedRows().map((r) => ({
        workspaceId,
        type: r.type,
        title: r.title,
        cropId: r.cropId,
        zone: r.zone,
        date: new Date(r.date),
        done: r.done,
        critical: r.critical ?? false,
        note: r.note,
        measurement: r.measurement,
      })),
    });
  }
  const rows = await db.task.findMany({
    where: { workspaceId },
    orderBy: { date: "asc" },
    include: { assignedTo: { select: { email: true } } },
  });
  return rows.map(toRealTask);
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  role: Role;
}

/** Görev atama seçici için gerçek workspace üyeleri (yalnız aktif üyelik). */
export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const db = getDb();
  const rows = await db.membership.findMany({
    where: { workspaceId, status: "aktif" },
    include: { user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((m) => ({ userId: m.user.id, email: m.user.email, role: fromPrismaRole(m.role) }));
}

export type AssignTaskResult = { applied: true; task: RealTask } | { applied: false; reason: string };

/**
 * Bir görevi gerçek bir workspace üyesine atar (veya assigneeUserId=null ile atamayı kaldırır).
 * Yalnız task.assign izinli rol atayabilir; atanan kişi GERÇEKTEN bu workspace'in aktif
 * üyesi olmalı (başka workspace'ten rastgele bir userId atanamaz).
 */
export async function assignTask(
  id: string,
  workspaceId: string,
  actorRole: Role,
  assigneeUserId: string | null
): Promise<AssignTaskResult> {
  if (!can(actorRole, "task.assign")) return { applied: false, reason: "Yetkisiz — task.assign izni gerekir." };
  const db = getDb();
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) return { applied: false, reason: "Görev bulunamadı." };

  if (assigneeUserId) {
    const membership = await db.membership.findFirst({
      where: { userId: assigneeUserId, workspaceId, status: "aktif" },
    });
    if (!membership) return { applied: false, reason: "Bu kişi bu işletmenin aktif üyesi değil." };
  }

  const row = await db.task.update({
    where: { id },
    data: { assignedToUserId: assigneeUserId },
    include: { assignedTo: { select: { email: true } } },
  });
  return { applied: true, task: toRealTask(row) };
}

export async function createTask(workspaceId: string, input: TaskInput): Promise<RealTask> {
  const db = getDb();
  const row = await db.task.create({
    data: {
      workspaceId,
      type: input.type,
      title: input.title,
      cropId: input.cropId,
      zone: input.zone,
      date: new Date(input.date),
      critical: input.critical ?? false,
    },
  });
  return toRealTask(row);
}

export async function toggleTaskDone(id: string, workspaceId: string): Promise<RealTask | undefined> {
  const db = getDb();
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) return undefined;
  const row = await db.task.update({
    where: { id },
    data: { done: !existing.done },
    include: { assignedTo: { select: { email: true } } },
  });
  return toRealTask(row);
}

/** Tamamlanmış bir görevin saha günlüğünü (not/ölçüm) yazar — boş string alan temizler. */
export async function updateTaskLog(
  id: string,
  workspaceId: string,
  input: { note?: string; measurement?: string }
): Promise<RealTask | undefined> {
  const db = getDb();
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) return undefined;
  const row = await db.task.update({
    where: { id },
    data: {
      note: input.note?.trim() ? input.note.trim() : null,
      measurement: input.measurement?.trim() ? input.measurement.trim() : null,
    },
    include: { assignedTo: { select: { email: true } } },
  });
  return toRealTask(row);
}

export async function deleteTask(id: string, workspaceId: string): Promise<boolean> {
  const db = getDb();
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) return false;
  await db.task.delete({ where: { id } });
  return true;
}
