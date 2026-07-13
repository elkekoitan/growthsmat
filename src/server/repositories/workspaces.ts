// SmartGrowth OS — Workspace repository katmanı (gerçek Postgres okuma).
// Şimdilik yalnız homeJurisdiction okunuyor — 03-TEKNIK-MIMARI.md §6.1'in workspaces(...)
// şemasındaki diğer alanlar (type, plan) henüz hiçbir gerçek davranışa bağlı değil (plan
// bazlı özellik kısıtlaması veya workspace türüne göre farklı akış yok), bu yüzden burada
// eklenmedi — yalnız gerçekten kullanılan bir alan için şema genişletildi (bkz. roadmap.ts).
import "server-only";

import { getDb } from "../db";
import type { Jurisdiction } from "@/lib/rulePacks";

export async function getWorkspaceHomeJurisdiction(workspaceId: string): Promise<Jurisdiction> {
  const db = getDb();
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { homeJurisdiction: true } });
  return (workspace?.homeJurisdiction ?? "TR") as Jurisdiction;
}
