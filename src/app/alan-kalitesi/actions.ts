"use server";
// SmartGrowth OS — /alan-kalitesi gerçek alan + test kaydı Server Action'ları.
// Skor motoru (computeDataQuality) SAF kalır — burada yalnız kullanıcının girdiği ham
// profil/test verisi kalıcılaştırılır; hesaplanan skor yazılmaz (rotasyon ile aynı ilke).
// GÜVENLİK: workspaceId istemciden ALINMAZ — her zaman oturumun aktif üyeliğinden gelir.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import {
  addSoilTest,
  addWaterTest,
  createSite,
  deleteSite,
  updateSiteObservations,
} from "@/server/repositories/sites";

export interface SiteFormState {
  error?: string;
  success?: string;
}

/**
 * Zorunlu sayısal form alanı: alan hiç gönderilmemiş/boşsa NaN döner (validate katmanı
 * Number.isFinite ile reddeder). `Number(null) = 0` tuzağına karşı — 0 pH/EC/organik
 * madde GEÇERLİ sınır değer olduğundan, eksik alanın sessizce 0'a düşmesi uydurma-sıfır
 * veri kaydederdi (adversarial review bulgusu).
 */
function requiredNumber(formData: FormData, key: string): number {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === "") return Number.NaN;
  return Number(raw);
}

/** Yeni alan oluşturur (boş durum + "alan ekle" formu). */
export async function createSiteAction(_prev: SiteFormState, formData: FormData): Promise<SiteFormState> {
  const { membership } = await requireMembership();

  const name = String(formData.get("name") ?? "");
  const areaM2 = requiredNumber(formData, "areaM2");
  // Boş bırakılan güneş saati "0 saat" DEĞİL "henüz gözlemlenmedi"dir — undefined geçer,
  // skor motoru bunu dürüstçe "eksik" olarak işaretler.
  const sunRaw = String(formData.get("sunHoursObserved") ?? "").trim();
  const sunHoursObserved = sunRaw === "" ? undefined : Number(sunRaw);
  const exactLocationKnown = formData.get("exactLocationKnown") === "on";

  const result = await createSite(membership.workspaceId, { name, areaM2, sunHoursObserved, exactLocationKnown });
  if (!result.applied) return { error: result.reason };

  revalidatePath("/alan-kalitesi");
  return { success: `"${name.trim()}" alanı eklendi.` };
}

/** Bir alana yapılmış bir toprak testini kaydeder. */
export async function addSoilTestAction(_prev: SiteFormState, formData: FormData): Promise<SiteFormState> {
  const { membership } = await requireMembership();

  const siteId = String(formData.get("siteId") ?? "");
  const ph = requiredNumber(formData, "ph");
  const ec = requiredNumber(formData, "ec");
  const organicMatterPct = requiredNumber(formData, "organicMatterPct");
  const sampledAt = String(formData.get("sampledAt") ?? "");

  const result = await addSoilTest(membership.workspaceId, siteId, { ph, ec, organicMatterPct, sampledAt });
  if (!result.applied) return { error: result.reason };

  revalidatePath("/alan-kalitesi");
  return { success: "Toprak testi kaydedildi." };
}

/** Bir alana yapılmış bir su testini kaydeder. */
export async function addWaterTestAction(_prev: SiteFormState, formData: FormData): Promise<SiteFormState> {
  const { membership } = await requireMembership();

  const siteId = String(formData.get("siteId") ?? "");
  const qualityOk = formData.get("qualityOk") === "on";
  const testedAt = String(formData.get("testedAt") ?? "");

  const result = await addWaterTest(membership.workspaceId, siteId, { qualityOk, testedAt });
  if (!result.applied) return { error: result.reason };

  revalidatePath("/alan-kalitesi");
  return { success: "Su testi kaydedildi." };
}

/** Güneş saati gözlemi + tam konum bilgisini günceller. */
export async function updateSiteObservationsAction(_prev: SiteFormState, formData: FormData): Promise<SiteFormState> {
  const { membership } = await requireMembership();

  const siteId = String(formData.get("siteId") ?? "");
  const sunRaw = String(formData.get("sunHoursObserved") ?? "").trim();
  const sunHoursObserved = sunRaw === "" ? null : Number(sunRaw);
  const exactLocationKnown = formData.get("exactLocationKnown") === "on";

  const result = await updateSiteObservations(membership.workspaceId, siteId, { sunHoursObserved, exactLocationKnown });
  if (!result.applied) return { error: result.reason };

  revalidatePath("/alan-kalitesi");
  return { success: "Gözlemler güncellendi." };
}

/** Alanı siler (testleri Cascade ile birlikte gider) — onay istemi istemcide. */
export async function deleteSiteAction(siteId: string): Promise<SiteFormState> {
  const { membership } = await requireMembership();
  const result = await deleteSite(membership.workspaceId, siteId);
  revalidatePath("/alan-kalitesi");
  if (!result.applied) return { error: result.reason };
  return { success: "Alan silindi." };
}
