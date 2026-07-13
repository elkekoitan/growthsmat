// SmartGrowth OS — Maliyet döngüsü repository katmanı (gerçek Postgres CRUD).
// src/lib/costModel.ts'in computeCycleCost() SAF fonksiyonu değişmedi — bu dosya yalnız
// gerçek CostEntry satırlarını okuyup bu fonksiyona besler (certificates.ts ile AYNI desen).
import "server-only";

import { getDb } from "../db";
import { computeCycleCost, type CostEntry, type FixedAllocation, type CycleCostResult } from "@/lib/costModel";

export interface CostCycleInput {
  label: string;
  fixedCostsTRY: number;
  allocation: FixedAllocation;
  areaM2?: number;
  totalAreaM2?: number;
  cycles?: number;
}

export interface RealCostCycle extends CostCycleInput {
  id: string;
  createdAt: string;
}

export interface RealCostEntry extends CostEntry {
  id: string;
  createdAt: string;
}

function toDomainCycle(row: {
  id: string;
  label: string;
  fixedCostsTRY: number;
  allocation: string;
  areaM2: number | null;
  totalAreaM2: number | null;
  cycles: number | null;
  createdAt: Date;
}): RealCostCycle {
  return {
    id: row.id,
    label: row.label,
    fixedCostsTRY: row.fixedCostsTRY,
    allocation: row.allocation as FixedAllocation,
    areaM2: row.areaM2 ?? undefined,
    totalAreaM2: row.totalAreaM2 ?? undefined,
    cycles: row.cycles ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDomainEntry(row: { id: string; category: string; amountTRY: number; note: string | null; createdAt: Date }): RealCostEntry {
  return {
    id: row.id,
    category: row.category as CostEntry["category"],
    amountTRY: row.amountTRY,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCycles(workspaceId: string): Promise<RealCostCycle[]> {
  const db = getDb();
  const rows = await db.costCycle.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  return rows.map(toDomainCycle);
}

export async function createCycle(workspaceId: string, input: CostCycleInput): Promise<RealCostCycle> {
  const db = getDb();
  const row = await db.costCycle.create({ data: { workspaceId, ...input } });
  return toDomainCycle(row);
}

export async function listEntries(cycleId: string, workspaceId: string): Promise<RealCostEntry[]> {
  const db = getDb();
  const rows = await db.costEntry.findMany({
    where: { cycleId, cycle: { workspaceId } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDomainEntry);
}

export async function addEntry(cycleId: string, workspaceId: string, input: CostEntry): Promise<RealCostEntry | null> {
  const db = getDb();
  const cycle = await db.costCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.workspaceId !== workspaceId) return null;
  const row = await db.costEntry.create({ data: { cycleId, ...input } });
  return toDomainEntry(row);
}

export async function removeEntry(entryId: string, workspaceId: string): Promise<boolean> {
  const db = getDb();
  const result = await db.costEntry.deleteMany({ where: { id: entryId, cycle: { workspaceId } } });
  return result.count > 0;
}

/** Bir döngünün gerçek CostEntry satırlarını okuyup computeCycleCost()'u çalıştırır. */
export async function computeCycleResult(cycleId: string, workspaceId: string): Promise<CycleCostResult | null> {
  const db = getDb();
  const cycle = await db.costCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.workspaceId !== workspaceId) return null;
  const entries = await listEntries(cycleId, workspaceId);
  const ctx =
    cycle.allocation === "alan-orani"
      ? { areaM2: cycle.areaM2 ?? 0, totalAreaM2: cycle.totalAreaM2 ?? 0 }
      : { cycles: cycle.cycles ?? 0 };
  return computeCycleCost(entries, cycle.fixedCostsTRY, cycle.allocation as FixedAllocation, ctx);
}
