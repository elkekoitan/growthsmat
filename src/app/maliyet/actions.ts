"use server";
// SmartGrowth OS — /maliyet gerçek maliyet döngüsü Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createCycle, addEntry, removeEntry } from "@/server/repositories/costModel";
import type { CostCategory, FixedAllocation } from "@/lib/costModel";

export interface MaliyetFormState {
  error?: string;
  success?: string;
}

export async function createCycleAction(_prev: MaliyetFormState, formData: FormData): Promise<MaliyetFormState> {
  const { membership } = await requireMembership();

  const label = String(formData.get("label") ?? "").trim();
  const fixedCostsTRY = Number(formData.get("fixedCostsTRY") ?? 0);
  const allocation = String(formData.get("allocation") ?? "dongu-basi") as FixedAllocation;
  const areaM2 = formData.get("areaM2") ? Number(formData.get("areaM2")) : undefined;
  const totalAreaM2 = formData.get("totalAreaM2") ? Number(formData.get("totalAreaM2")) : undefined;
  const cycles = formData.get("cycles") ? Math.round(Number(formData.get("cycles"))) : undefined;

  if (!label) return { error: "Döngü adı gerekli (ör. 2026 Temmuz)." };
  if (fixedCostsTRY < 0) return { error: "Sabit maliyet negatif olamaz." };
  if (allocation === "alan-orani" && (!areaM2 || !totalAreaM2)) {
    return { error: "Alan oranı dağıtımı için alan (m²) ve toplam alan (m²) gerekli." };
  }
  if (allocation === "dongu-basi" && !cycles) {
    return { error: "Döngü başına dağıtım için döngü sayısı gerekli." };
  }

  await createCycle(membership.workspaceId, { label, fixedCostsTRY, allocation, areaM2, totalAreaM2, cycles });
  revalidatePath("/maliyet");
  return { success: `"${label}" döngüsü oluşturuldu.` };
}

export async function addEntryAction(_prev: MaliyetFormState, formData: FormData): Promise<MaliyetFormState> {
  const { membership } = await requireMembership();

  const cycleId = String(formData.get("cycleId") ?? "");
  const category = String(formData.get("category") ?? "") as CostCategory;
  const amountTRY = Number(formData.get("amountTRY") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || undefined;

  if (!(amountTRY > 0)) return { error: "Tutar sıfırdan büyük olmalı." };

  const result = await addEntry(cycleId, membership.workspaceId, { category, amountTRY, note });
  revalidatePath("/maliyet");
  if (!result) return { error: "Döngü bulunamadı." };
  return { success: "Maliyet kalemi eklendi." };
}

export async function removeEntryAction(entryId: string): Promise<MaliyetFormState> {
  const { membership } = await requireMembership();
  const removed = await removeEntry(entryId, membership.workspaceId);
  revalidatePath("/maliyet");
  if (!removed) return { error: "Kalem bulunamadı." };
  return { success: "Kalem kaldırıldı." };
}
