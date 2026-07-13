"use server";
// SmartGrowth OS — /pazar gerçek ilan ve sipariş Server Action'ları.
import { revalidatePath } from "next/cache";
import { requireMembership } from "@/server/session";
import { createListing, setListingActive } from "@/server/repositories/listings";
import { placeOrder, updateOrderStatus, type OrderStatus } from "@/server/repositories/orders";
import type { ProductFormat, StockType, ChannelId, OrganicClaimStatus } from "@/data/commerce";

export interface MarketFormState {
  error?: string;
  success?: string;
}

export async function createListingAction(_prev: MarketFormState, formData: FormData): Promise<MarketFormState> {
  const { membership } = await requireMembership();

  const title = String(formData.get("title") ?? "").trim();
  const producer = String(formData.get("producer") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const unitLabel = String(formData.get("unitLabel") ?? "").trim();
  const priceTRY = Number(formData.get("priceTRY") ?? 0);
  const cropId = String(formData.get("cropId") ?? "").trim() || undefined;

  if (!title || !producer || !region || !unitLabel) {
    return { error: "Tüm alanları doldur." };
  }
  if (!(priceTRY > 0)) {
    return { error: "Fiyat sıfırdan büyük olmalı." };
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
    channels: ["yerel-vitrin"] as ChannelId[],
    claim: (String(formData.get("claim") ?? "yontem-kayitli")) as OrganicClaimStatus,
    shelfLifeDays: Number(formData.get("shelfLifeDays") ?? 7),
    repeatOrderRate: 0,
  });

  revalidatePath("/pazar");
  return { success: "İlan yayınlandı." };
}

export async function toggleListingActiveAction(listingId: string, active: boolean): Promise<void> {
  const { membership } = await requireMembership();
  await setListingActive(listingId, membership.workspaceId, active);
  revalidatePath("/pazar");
}

export async function placeOrderAction(listingId: string, quantity: number): Promise<MarketFormState> {
  const { user, membership } = await requireMembership();
  const result = await placeOrder(listingId, membership.workspaceId, user.id, quantity);
  revalidatePath("/pazar");
  if (!result.applied) return { error: result.reason };
  return { success: "Sipariş talebi gönderildi." };
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<MarketFormState> {
  const { user, membership } = await requireMembership();
  const result = await updateOrderStatus(orderId, status, user.id, membership.workspaceId, membership.role);
  revalidatePath("/pazar");
  if (!result.applied) return { error: result.reason };
  return { success: "Sipariş durumu güncellendi." };
}
