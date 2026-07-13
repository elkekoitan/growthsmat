"use server";
// SmartGrowth OS — /mikrofiliz gerçek oda profili + abonelik Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { upsertRoom, addSubscription, removeSubscription } from "@/server/repositories/microCapacity";
import { MICROGREEN_RECIPES } from "@/data/microgreens";

export interface MikrofilizFormState {
  error?: string;
  success?: string;
}

export async function saveRoomAction(_prev: MikrofilizFormState, formData: FormData): Promise<MikrofilizFormState> {
  const { membership } = await requireMembership();

  const shelves = Math.round(Number(formData.get("shelves") ?? 0));
  const levelsPerShelf = Math.round(Number(formData.get("levelsPerShelf") ?? 0));
  const traysPerLevel = Math.round(Number(formData.get("traysPerLevel") ?? 0));
  const airflowFactor = Number(formData.get("airflowFactor") ?? 0);

  if (!(shelves > 0) || !(levelsPerShelf > 0) || !(traysPerLevel > 0)) {
    return { error: "Raf/kat/tepsi sayıları sıfırdan büyük olmalı." };
  }
  if (!(airflowFactor > 0 && airflowFactor <= 1)) {
    return { error: "Hava akımı faktörü 0 ile 1 arasında olmalı." };
  }

  await upsertRoom(membership.workspaceId, { shelves, levelsPerShelf, traysPerLevel, airflowFactor });
  revalidatePath("/mikrofiliz");
  return { success: "Oda profili kaydedildi." };
}

export async function addSubscriptionAction(_prev: MikrofilizFormState, formData: FormData): Promise<MikrofilizFormState> {
  const { membership } = await requireMembership();

  const recipeId = String(formData.get("recipeId") ?? "");
  const traysPerWeek = Math.round(Number(formData.get("traysPerWeek") ?? 0));
  const deliveryDay = Math.round(Number(formData.get("deliveryDay") ?? 0));

  if (!MICROGREEN_RECIPES.some((r) => r.id === recipeId)) return { error: "Geçersiz reçete." };
  if (!(traysPerWeek > 0)) return { error: "Haftalık tepsi sayısı sıfırdan büyük olmalı." };
  if (!(deliveryDay >= 0 && deliveryDay <= 6)) return { error: "Geçersiz teslimat günü." };

  await addSubscription(membership.workspaceId, { recipeId, traysPerWeek, deliveryDay });
  revalidatePath("/mikrofiliz");
  return { success: "Abonelik eklendi." };
}

export async function removeSubscriptionAction(id: string): Promise<MikrofilizFormState> {
  const { membership } = await requireMembership();
  const removed = await removeSubscription(id, membership.workspaceId);
  revalidatePath("/mikrofiliz");
  if (!removed) return { error: "Abonelik bulunamadı." };
  return { success: "Abonelik kaldırıldı." };
}
