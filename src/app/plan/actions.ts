"use server";
// SmartGrowth OS — /plan gerçek Plan Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { upsertPlan, type RealPlan, type PlanInput } from "@/server/repositories/plans";

export async function savePlanAction(input: PlanInput): Promise<RealPlan> {
  const { membership } = await requireMembership();
  const plan = await upsertPlan(membership.workspaceId, input);
  revalidatePath("/plan");
  return plan;
}
