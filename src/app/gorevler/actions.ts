"use server";
// SmartGrowth OS — /gorevler gerçek görev Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createTask, deleteTask, toggleTaskDone, type RealTask, type TaskInput } from "@/server/repositories/tasks";

export async function createTaskAction(input: TaskInput): Promise<RealTask> {
  const { membership } = await requireMembership();
  const task = await createTask(membership.workspaceId, input);
  revalidatePath("/gorevler");
  return task;
}

export async function toggleTaskAction(id: string): Promise<void> {
  const { membership } = await requireMembership();
  await toggleTaskDone(id, membership.workspaceId);
  revalidatePath("/gorevler");
}

export async function deleteTaskAction(id: string): Promise<void> {
  const { membership } = await requireMembership();
  await deleteTask(id, membership.workspaceId);
  revalidatePath("/gorevler");
}
