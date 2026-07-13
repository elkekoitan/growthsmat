// SmartGrowth OS — Mikro filiz oda/abonelik repository katmanı (gerçek Postgres CRUD).
// src/lib/microCapacity.ts'in effectiveCapacity()/planBackwards() SAF fonksiyonları
// değişmedi — bu dosya yalnız gerçek workspace'in oda profilini ve restoran
// aboneliklerini okuyup bu fonksiyonlara besler (certificates.ts ile AYNI desen).
import "server-only";

import { getDb } from "../db";
import { planBackwards, type RoomProfile, type Subscription, type CapacityPlan } from "@/lib/microCapacity";

export interface RealSubscription extends Subscription {
  id: string;
}

export async function getRoom(workspaceId: string): Promise<RoomProfile | null> {
  const db = getDb();
  const row = await db.room.findUnique({ where: { workspaceId } });
  if (!row) return null;
  return { shelves: row.shelves, levelsPerShelf: row.levelsPerShelf, traysPerLevel: row.traysPerLevel, airflowFactor: row.airflowFactor };
}

export async function upsertRoom(workspaceId: string, room: RoomProfile): Promise<RoomProfile> {
  const db = getDb();
  const row = await db.room.upsert({
    where: { workspaceId },
    create: { workspaceId, ...room },
    update: { ...room },
  });
  return { shelves: row.shelves, levelsPerShelf: row.levelsPerShelf, traysPerLevel: row.traysPerLevel, airflowFactor: row.airflowFactor };
}

export async function listSubscriptions(workspaceId: string): Promise<RealSubscription[]> {
  const db = getDb();
  const rows = await db.subscription.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({ id: r.id, recipeId: r.recipeId, traysPerWeek: r.traysPerWeek, deliveryDay: r.deliveryDay }));
}

export async function addSubscription(workspaceId: string, input: Subscription): Promise<RealSubscription> {
  const db = getDb();
  const row = await db.subscription.create({ data: { workspaceId, ...input } });
  return { id: row.id, recipeId: row.recipeId, traysPerWeek: row.traysPerWeek, deliveryDay: row.deliveryDay };
}

export async function removeSubscription(id: string, workspaceId: string): Promise<boolean> {
  const db = getDb();
  const result = await db.subscription.deleteMany({ where: { id, workspaceId } });
  return result.count > 0;
}

/** Gerçek oda profili + abonelikleri okuyup planBackwards()'ı çalıştırır. Oda yoksa null döner. */
export async function computeWorkspaceCapacityPlan(workspaceId: string): Promise<CapacityPlan | null> {
  const room = await getRoom(workspaceId);
  if (!room) return null;
  const subs = await listSubscriptions(workspaceId);
  return planBackwards(subs, room);
}
