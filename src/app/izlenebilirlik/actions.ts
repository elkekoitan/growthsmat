"use server";
// SmartGrowth OS — /izlenebilirlik gerçek lot kaydı Server Action'ı.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createLot, type LotInput } from "@/server/repositories/lots";

export interface LotFormState {
  error?: string;
  success?: string;
}

export async function createLotAction(_prev: LotFormState, formData: FormData): Promise<LotFormState> {
  const { user, membership } = await requireMembership();

  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const ownerLabel = String(formData.get("ownerLabel") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);
  const producedAt = String(formData.get("producedAt") ?? "");
  const parentCodesRaw = String(formData.get("parentCodes") ?? "");
  const parentCodes = parentCodesRaw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (!code || !label || !ownerLabel || !unit || !producedAt) {
    return { error: "Tüm zorunlu alanları doldur." };
  }

  const input: LotInput = {
    code,
    label,
    type: String(formData.get("type") ?? "uretim") as LotInput["type"],
    cropId: String(formData.get("cropId") ?? "").trim() || undefined,
    quantity,
    unit,
    producedAt,
    certifiedOrigin: formData.get("certifiedOrigin") === "on",
    ownerLabel,
    parentCodes,
    // 03-TEKNIK-MIMARI.md §6.5 operations(...performed_by): ownerLabel serbest metin (kim
    // bunu YAZDIĞINI iddia ediyor), bu ise gerçek oturumdan gelen, sahtelenemez kimlik.
    createdByUserId: user.id,
    createdByEmail: user.email,
  };

  const result = await createLot(membership.workspaceId, input);
  revalidatePath("/izlenebilirlik");
  if (!result.applied) return { error: result.reason };
  return { success: `Lot kaydedildi: ${code}` };
}
