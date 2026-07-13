// SmartGrowth OS — Plan repository katmanı (gerçek Postgres CRUD).
// DÜRÜSTLÜK NOTU: burada yalnız sihirbazın HAM SiteProfile girdisi saklanır — hesaplanan
// AssessmentResult (skor/güven/senaryo) hiç saklanmaz, çağıran taraf her okunuşta
// runAssessment() ile YENİDEN hesaplar (bkz. src/lib/suitability.ts). Bir workspace'in
// tek, güncel plan satırı olur (eski localStorage "sg-plan" anahtarıyla aynı anlam).
import "server-only";

import { getDb } from "../db";
import type { SiteProfile } from "@/lib/suitability";

export interface PlanInput {
  profile: SiteProfile;
  phMeasured: boolean;
  phValue: number;
  completed: boolean;
}

export interface RealPlan extends PlanInput {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

function toRealPlan(row: {
  id: string;
  workspaceId: string;
  city: string;
  method: string;
  areaM2: number;
  sunHours: number;
  containerL: number | null;
  waterAccess: number;
  weeklyMinutes: number;
  experience: number;
  goal: string;
  hasKidsOrPets: boolean;
  season: string;
  phMeasured: boolean;
  phValue: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}): RealPlan {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    profile: {
      city: row.city,
      method: row.method as SiteProfile["method"],
      areaM2: row.areaM2,
      sunHours: row.sunHours,
      containerL: row.containerL ?? undefined,
      waterAccess: row.waterAccess as SiteProfile["waterAccess"],
      weeklyMinutes: row.weeklyMinutes,
      experience: row.experience as SiteProfile["experience"],
      goal: row.goal as SiteProfile["goal"],
      hasKidsOrPets: row.hasKidsOrPets,
      season: row.season as SiteProfile["season"],
      soilPh: row.phMeasured ? row.phValue : undefined,
    },
    phMeasured: row.phMeasured,
    phValue: row.phValue,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPlan(workspaceId: string): Promise<RealPlan | undefined> {
  const db = getDb();
  const row = await db.plan.findUnique({ where: { workspaceId } });
  return row ? toRealPlan(row) : undefined;
}

export async function upsertPlan(workspaceId: string, input: PlanInput): Promise<RealPlan> {
  const db = getDb();
  const data = {
    city: input.profile.city,
    method: input.profile.method,
    areaM2: input.profile.areaM2,
    sunHours: input.profile.sunHours,
    containerL: input.profile.containerL,
    waterAccess: input.profile.waterAccess,
    weeklyMinutes: input.profile.weeklyMinutes,
    experience: input.profile.experience,
    goal: input.profile.goal,
    hasKidsOrPets: input.profile.hasKidsOrPets,
    season: input.profile.season,
    phMeasured: input.phMeasured,
    phValue: input.phValue,
    completed: input.completed,
  };
  const row = await db.plan.upsert({
    where: { workspaceId },
    create: { workspaceId, ...data },
    update: data,
  });
  return toRealPlan(row);
}
