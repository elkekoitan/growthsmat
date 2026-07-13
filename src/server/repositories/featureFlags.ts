// SmartGrowth OS — Feature flag override repository katmanı (gerçek Postgres CRUD).
// src/lib/featureFlags.ts'in FLAGS/evaluateFlag()/cohortBucket() SAF fonksiyonları
// değişmedi (300 testin bir kısmı bunlara dayanır) — bu dosya yalnız workspace başına
// AÇIK override'ı okuyup evaluateFlag()'in "overrides" parametresine besler.
import "server-only";

import { getDb } from "../db";
import { FLAGS, FLAG_BY_KEY, evaluateAll, type FlagDecision } from "@/lib/featureFlags";
import { can, type Role } from "@/lib/roles";

export async function listOverrides(workspaceId: string): Promise<Record<string, boolean>> {
  const db = getDb();
  const rows = await db.featureFlagOverride.findMany({ where: { workspaceId } });
  return Object.fromEntries(rows.map((r) => [r.flagKey, r.value]));
}

/** Bir workspace için tüm bayrakların gerçek override'lara karşı değerlendirilmiş halini döner. */
export async function evaluateWorkspaceFlags(workspaceId: string): Promise<FlagDecision[]> {
  const overrides = await listOverrides(workspaceId);
  return evaluateAll(overrides, workspaceId, FLAGS);
}

export type FlagOverrideResult = { applied: true } | { applied: false; reason: string };

/**
 * Yalnız workspace.manage izinli rol (sahip/yönetici) override yazabilir/kaldırabilir —
 * kontrol burada, repository katmanında yapılır (yalnız UI'da gizlemek YETMEZ, certificates.ts
 * ile aynı ders: sunucu tarafı kontrolsüz bir Server Action herkes tarafından çağrılabilir).
 */
export async function setOverride(
  workspaceId: string,
  actorRole: Role,
  flagKey: string,
  value: boolean,
  updatedByUserId: string
): Promise<FlagOverrideResult> {
  if (!can(actorRole, "workspace.manage")) return { applied: false, reason: "Bu rolle bayrak override edemezsin — workspace.manage izni gerekir." };
  if (!FLAG_BY_KEY[flagKey]) return { applied: false, reason: "Bilinmeyen bayrak." };
  const db = getDb();
  await db.featureFlagOverride.upsert({
    where: { workspaceId_flagKey: { workspaceId, flagKey } },
    create: { workspaceId, flagKey, value, updatedByUserId },
    update: { value, updatedByUserId },
  });
  return { applied: true };
}

/** Override'ı kaldırır — bayrak tekrar kohort/varsayılana döner. */
export async function clearOverride(workspaceId: string, actorRole: Role, flagKey: string): Promise<FlagOverrideResult> {
  if (!can(actorRole, "workspace.manage")) return { applied: false, reason: "Bu rolle bayrak override edemezsin — workspace.manage izni gerekir." };
  const db = getDb();
  await db.featureFlagOverride.deleteMany({ where: { workspaceId, flagKey } });
  return { applied: true };
}
