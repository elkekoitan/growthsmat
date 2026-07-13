"use server";
// SmartGrowth OS — /pazar gerçek ilan ve sipariş Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createListing, setListingActive, setListingStock } from "@/server/repositories/listings";
import { placeOrder, placeMultipleOrders, updateOrderStatus, type OrderStatus, type CartOrderItem } from "@/server/repositories/orders";
import {
  createCertificate,
  evaluateWorkspaceClaim,
  reviewCertificateById,
  revokeCertificateById,
  type CertificateInput,
  type RealCertificate,
} from "@/server/repositories/certificates";
import { getWorkspaceHomeJurisdiction } from "@/server/repositories/workspaces";
import type { ProductFormat, StockType, ChannelId, OrganicClaimStatus } from "@/data/commerce";
import type { Jurisdiction } from "@/lib/rulePacks";
import { CROP_BY_ID } from "@/data/crops";

export interface MarketFormState {
  error?: string;
  success?: string;
}

// 2026-07-13 (dokümantasyon incelemesi): önceden burada sabit bir DEFAULT_JURISDICTION="TR"
// vardı — sertifika formundaki 9 yargı-alanı seçeneğinden 8'i hiçbir zaman kontrol edilmezdi
// (adversarial review bulgusu). Artık Workspace.homeJurisdiction (03-TEKNIK-MIMARI.md §6.1)
// kullanılıyor — hâlâ signup'ta varsayılan TR (ADR-009: tek pazardan başla) ve bunu
// değiştirecek bir ayarlar UI'ı yok, ama en azından artık sabit-kodlanmış değil, gerçek bir
// workspace alanı — bir sonraki adım bunu değiştirebilen bir ayarlar sayfası.
const TR_UTC_OFFSET_MS = 3 * 60 * 60 * 1000; // Türkiye yıl boyu UTC+3, DST yok.

/**
 * Türkiye yerel takvim gününü (yyyy-mm-dd) döner. Ham `new Date().toISOString()` UTC
 * bugününü verir — UTC 21:00–23:59 arası (TR yerel 00:00–02:59) bu, henüz TR takvimi bir
 * gün ilerlemişken hâlâ "dünü" döner, ki bu tam olarak adversarial review'ün bulduğu
 * hatadır (sertifika süresi TR yerel gece yarısında dolar, ama UTC saat 3 saat sonra
 * güncellenirdi — o pencerede süresi dolmuş bir sertifika hâlâ geçerli sayılırdı).
 */
function nowInTurkeyISO(): string {
  return new Date(Date.now() + TR_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

export async function createListingAction(_prev: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const { membership } = await requireMembership();

  const title = String(formData.get("title") ?? "").trim();
  const producer = String(formData.get("producer") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const unitLabel = String(formData.get("unitLabel") ?? "").trim();
  const priceTRY = Number(formData.get("priceTRY") ?? 0);
  const stockQty = Math.round(Number(formData.get("stockQty") ?? 0));
  const cropId = String(formData.get("cropId") ?? "").trim() || undefined;
  const requestedClaim = String(formData.get("claim") ?? "yontem-kayitli") as OrganicClaimStatus;

  if (!title || !producer || !region || !unitLabel) {
    return { error: "Tüm alanları doldur." };
  }
  if (!(priceTRY > 0)) {
    return { error: "Fiyat sıfırdan büyük olmalı." };
  }
  if (!(stockQty >= 0)) {
    return { error: "Stok adedi 0 veya daha büyük olmalı." };
  }

  // FR-126 / ADR-008: sertifika doğrulanmadan "sertifikali"/"gecis-sureci" iddiası
  // yayınlanamaz — rulePacks.ts'in GERÇEK, test edilmiş evaluateClaim() motoru burada
  // gerçek workspace sertifikalarına karşı çalıştırılır (önceden bu form alanı hiç yoktu,
  // her ilan sessizce "yontem-kayitli"ye düşüyordu — bkz. repositories/certificates.ts notu).
  let finalClaim = requestedClaim;
  let downgradeNote: string | undefined;
  if (requestedClaim === "sertifikali" || requestedClaim === "gecis-sureci") {
    if (!cropId) {
      return { error: "Sertifikalı/geçiş süreci iddiası yalnız katalogdan seçilen bir ürün için değerlendirilebilir." };
    }
    const nowISO = nowInTurkeyISO(); // DÜRÜSTLÜK NOTU: workspace TR dışı bir jurisdiction
    // seçse bile "şimdi" hâlâ TR yerel saatiyle hesaplanır — gerçek çoklu-yargı-alanı saat
    // dilimi tablosu bu turun kapsamı dışında, TR-dışı workspace'lerde bu bir saat kayması
    // riski taşır (aynı sınıf hata, farklı jurisdiction için henüz kapatılmadı).
    const jurisdiction = await getWorkspaceHomeJurisdiction(membership.workspaceId);
    const result = await evaluateWorkspaceClaim(membership.workspaceId, cropId, jurisdiction, nowISO);
    if (!result.allowed) {
      return { error: `Organik iddia reddedildi: ${result.reason}` };
    }
    // Kullanıcının istediği durum ile sertifikanın GERÇEK durumu farklı olabilir (ör.
    // "sertifikali" seçildi ama sertifika hâlâ geçiş sürecinde) — gerçek sonuç kullanılır.
    // Bu bir DÜŞÜRME ise (istenenden daha zayıf bir durum), success mesajında AÇIKÇA
    // belirtilir — sessiz düşürme, UX-honesty adversarial review bulgusuydu.
    finalClaim = result.status === "sertifikali" ? "sertifikali" : "gecis-sureci";
    if (finalClaim !== requestedClaim) {
      downgradeNote = ` Not: sertifikan henüz geçiş sürecinde olduğu için ilan "Sertifikalı organik" değil, "Geçiş süreci" olarak yayınlandı.`;
    }
  }

  await createListing(membership.workspaceId, {
    cropId,
    title,
    producer,
    region,
    format: (String(formData.get("format") ?? "adet")) as ProductFormat,
    unitLabel,
    priceTRY,
    stockType: (String(formData.get("stockType") ?? "mevcut")) as StockType,
    stockQty,
    channels: ["yerel-vitrin"] as ChannelId[],
    claim: finalClaim,
    shelfLifeDays: Number(formData.get("shelfLifeDays") ?? 7),
    repeatOrderRate: 0,
  });

  revalidatePath("/pazar");
  return { success: `İlan yayınlandı.${downgradeNote ?? ""}` };
}

export async function toggleListingActiveAction(listingId: string, active: boolean): Promise<void> {
  const { membership } = await requireMembership();
  await setListingActive(listingId, membership.workspaceId, active);
  revalidatePath("/pazar");
}

export async function setListingStockAction(listingId: string, stockQty: number): Promise<MarketFormState> {
  const { membership } = await requireMembership();
  const updated = await setListingStock(listingId, membership.workspaceId, stockQty);
  revalidatePath("/pazar");
  if (!updated) return { error: "İlan bulunamadı." };
  return { success: `Stok güncellendi: ${updated.stockQty} adet.` };
}

export async function placeOrderAction(listingId: string, quantity: number): Promise<MarketFormState> {
  const { user, membership } = await requireMembership();
  const result = await placeOrder(listingId, membership.workspaceId, user.id, quantity);
  revalidatePath("/pazar");
  if (!result.applied) return { error: result.reason };
  return { success: "Sipariş talebi gönderildi." };
}

export interface CartCheckoutResult {
  error?: string;
  success?: string;
  failedListingIds?: string[];
}

/** Sepetteki birden fazla ilanı TEK seferde sipariş talebine dönüştürür. */
export async function placeCartOrdersAction(items: CartOrderItem[]): Promise<CartCheckoutResult> {
  const { user, membership } = await requireMembership();
  if (items.length === 0) return { error: "Sepet boş." };

  const result = await placeMultipleOrders(items, membership.workspaceId, user.id);
  revalidatePath("/pazar");

  const failed = result.lines.filter((l) => !l.applied);
  if (result.allApplied) {
    return { success: `${items.length} üründen sipariş talebi gönderildi.` };
  }
  return {
    error:
      failed.length === items.length
        ? "Hiçbir ürün sipariş edilemedi (stok/kendi ilanın vb.)."
        : `${items.length - failed.length}/${items.length} ürün gönderildi, ${failed.length} tanesi başarısız oldu (stok az önce değişmiş olabilir).`,
    failedListingIds: failed.map((l) => l.listingId),
  };
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<MarketFormState> {
  const { user, membership } = await requireMembership();
  const result = await updateOrderStatus(orderId, status, user.id, membership.workspaceId, membership.role);
  revalidatePath("/pazar");
  if (!result.applied) return { error: result.reason };
  return { success: "Sipariş durumu güncellendi." };
}

export interface CertificateFormState {
  error?: string;
  success?: string;
}

export async function createCertificateAction(_prev: CertificateFormState, formData: FormData): Promise<CertificateFormState> {
  const { membership } = await requireMembership();

  const holder = String(formData.get("holder") ?? "").trim();
  const issuer = String(formData.get("issuer") ?? "").trim();
  const validFrom = String(formData.get("validFrom") ?? "");
  const validTo = String(formData.get("validTo") ?? "");
  const scopeCropIds = String(formData.get("scopeCropIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const jurisdiction = (String(formData.get("jurisdiction") ?? "TR")) as Jurisdiction;
  const inTransition = formData.get("inTransition") === "on";
  const documentUrl = String(formData.get("documentUrl") ?? "").trim() || undefined;

  if (!holder || !issuer || !validFrom || !validTo || scopeCropIds.length === 0) {
    return { error: "Tüm zorunlu alanları doldur (kapsam en az bir ürün içermeli)." };
  }
  // UX-honesty review: elle yazılan ürün id'lerinde yazım hatası, hiçbir uyarı olmadan
  // asla eşleşmeyen bir sertifika üretiyordu. Kataloğa karşı erken doğrula.
  const unknownCropIds = scopeCropIds.filter((id) => !CROP_BY_ID[id]);
  if (unknownCropIds.length > 0) {
    return { error: `Tanınmayan ürün id'si: ${unknownCropIds.join(", ")} — ürün kataloğundaki gerçek id'yi kullan.` };
  }

  const input: CertificateInput = { holder, jurisdiction, scopeCropIds, validFrom, validTo, issuer, inTransition, documentUrl };
  const cert: RealCertificate = await createCertificate(membership.workspaceId, input);
  revalidatePath("/pazar");
  // Kayıt, DOĞRULAMA değildir — bu alanların hiçbiri şu an kontrol edilmiyor. Sertifika
  // compliance.review izinli bir rol onaylayana kadar hiçbir organik iddiayı açmaz
  // (bkz. src/lib/certificateReview.ts, src/server/repositories/certificates.ts).
  return { success: `Sertifika kaydedildi (beklemede): ${cert.issuer}. Organik iddiayı açabilmesi için önce doğrulanması gerekir.` };
}

export interface CertificateReviewFormState {
  error?: string;
  success?: string;
}

export async function reviewCertificateAction(
  certificateId: string,
  decision: "onayla" | "reddet",
  note?: string
): Promise<CertificateReviewFormState> {
  const { user, membership } = await requireMembership();
  const result = await reviewCertificateById(
    certificateId,
    membership.role,
    membership.workspaceId,
    decision,
    user.id,
    new Date().toISOString(),
    note
  );
  revalidatePath("/pazar");
  if (!result.applied) return { error: result.reason };
  return { success: decision === "onayla" ? "Sertifika onaylandı." : "Sertifika reddedildi." };
}

/** FR-183: daha önce onaylanmış bir sertifikayı sahte/şüpheli gerekçesiyle geriye dönük iptal eder. */
export async function revokeCertificateAction(certificateId: string, note: string): Promise<CertificateReviewFormState> {
  const { user, membership } = await requireMembership();
  const result = await revokeCertificateById(certificateId, membership.role, membership.workspaceId, user.id, new Date().toISOString(), note);
  revalidatePath("/pazar");
  if (!result.applied) return { error: result.reason };
  return { success: "Sertifika iptal edildi — bu sertifikaya dayanan gelecekteki organik iddiaları artık reddedilecek." };
}
