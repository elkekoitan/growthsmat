"use server";
// SmartGrowth OS — /roller (rol/izin + ekip yönetimi) Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { setOverride, clearOverride } from "@/server/repositories/featureFlags";
import { createInvite, cancelInviteById, acceptInviteById, declineInviteById } from "@/server/repositories/invites";
import type { Role } from "@/lib/roles";

export interface RollerFormState {
  error?: string;
  success?: string;
}

export async function setFlagOverrideAction(flagKey: string, action: "ac" | "kapat" | "kaldir"): Promise<RollerFormState> {
  const { user, membership } = await requireMembership();

  if (action === "kaldir") {
    const result = await clearOverride(membership.workspaceId, membership.role, flagKey);
    revalidatePath("/roller");
    if (!result.applied) return { error: result.reason };
    return { success: `"${flagKey}" override kaldırıldı — kohort/varsayılana döndü.` };
  }

  const value = action === "ac";
  const result = await setOverride(membership.workspaceId, membership.role, flagKey, value, user.id);
  revalidatePath("/roller");
  if (!result.applied) return { error: result.reason };
  return { success: `"${flagKey}" ${value ? "zorla açık" : "zorla kapalı"} olarak override edildi.` };
}

export async function createInviteAction(_prev: RollerFormState, formData: FormData): Promise<RollerFormState> {
  const { user, membership } = await requireMembership();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "goruntuleyici") as Role;

  const result = await createInvite(membership.workspaceId, membership.role, user.id, email, role);
  revalidatePath("/roller");
  if (!result.applied) return { error: result.reason };
  return { success: `${result.invite.email} adresine davet gönderildi (7 gün geçerli).` };
}

export async function cancelInviteAction(inviteId: string): Promise<RollerFormState> {
  const { user, membership } = await requireMembership();
  const result = await cancelInviteById(inviteId, user.id, membership.role, membership.workspaceId);
  revalidatePath("/roller");
  if (!result.applied) return { error: result.reason };
  return { success: "Davet iptal edildi." };
}

export async function acceptInviteAction(inviteId: string): Promise<RollerFormState> {
  const { user } = await requireMembership();
  const result = await acceptInviteById(inviteId, user.id, user.email);
  revalidatePath("/roller");
  if (!result.applied) return { error: result.reason };
  return { success: "Davet kabul edildi — yeni işletmeye üye oldun." };
}

export async function declineInviteAction(inviteId: string): Promise<RollerFormState> {
  const { user } = await requireMembership();
  const result = await declineInviteById(inviteId, user.id, user.email);
  revalidatePath("/roller");
  if (!result.applied) return { error: result.reason };
  return { success: "Davet reddedildi." };
}
