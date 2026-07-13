"use server";
// SmartGrowth OS — /kurasyon gerçek düzeltme önerisi Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createSubmission, reviewSubmissionById, withdrawSubmissionById, type ReviewActionResult } from "@/server/repositories/corrections";
import type { SubmissionInput } from "@/lib/curation";

export async function submitCorrectionAction(input: Omit<SubmissionInput, "submittedBy">) {
  const { user } = await requireMembership();
  const created = await createSubmission({ ...input, submittedBy: user.email }, new Date().toISOString());
  revalidatePath("/kurasyon");
  return created;
}

export async function reviewCorrectionAction(
  submissionId: string,
  decision: "onayla" | "reddet",
  note?: string
): Promise<ReviewActionResult> {
  const { user, membership } = await requireMembership();
  const result = await reviewSubmissionById(submissionId, membership.role, decision, user.email, new Date().toISOString(), note);
  revalidatePath("/kurasyon");
  return result;
}

export async function withdrawSubmissionAction(submissionId: string): Promise<ReviewActionResult> {
  const { user } = await requireMembership();
  const result = await withdrawSubmissionById(submissionId, user.email);
  revalidatePath("/kurasyon");
  return result;
}
