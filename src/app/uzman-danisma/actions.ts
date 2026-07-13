"use server";
// SmartGrowth OS — /uzman-danisma gerçek vaka Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createCase, assignCaseById, answerCaseById, closeCaseById, type CaseActionResult } from "@/server/repositories/consultCases";
import type { OpenCaseInput, ExpertProfile } from "@/lib/expertConsult";
import type { EvidenceGrade } from "@/data/crops";

export async function openCaseAction(input: Omit<OpenCaseInput, "askedBy">) {
  const { user } = await requireMembership();
  const created = await createCase({ ...input, askedBy: user.email }, new Date().toISOString());
  revalidatePath("/uzman-danisma");
  return created;
}

export async function assignCaseAction(caseId: string, expert: ExpertProfile): Promise<CaseActionResult> {
  const { membership } = await requireMembership();
  const result = await assignCaseById(caseId, expert, membership.role, new Date().toISOString());
  revalidatePath("/uzman-danisma");
  return result;
}

export async function answerCaseAction(
  caseId: string,
  responderExpertId: string,
  answerText: string,
  evidence: EvidenceGrade
): Promise<CaseActionResult> {
  const { membership } = await requireMembership();
  const result = await answerCaseById(caseId, membership.role, responderExpertId, answerText, evidence, new Date().toISOString());
  revalidatePath("/uzman-danisma");
  return result;
}

export async function closeCaseAction(caseId: string): Promise<CaseActionResult> {
  const { user, membership } = await requireMembership();
  const result = await closeCaseById(caseId, user.email, membership.role, new Date().toISOString());
  revalidatePath("/uzman-danisma");
  return result;
}
