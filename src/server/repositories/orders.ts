// SmartGrowth OS — Pazar sipariş repository katmanı (gerçek Postgres CRUD).
// DÜRÜSTLÜK NOTU: burada oluşan "Order" gerçek bir ödeme işlemi DEĞİLDİR — hiçbir ödeme
// ağ geçidi entegre edilmemiştir. Bu, iki gerçek hesap arasında kalıcı bir SATIN ALMA
// TALEBİ kaydıdır (bkz. prisma/schema.prisma Order modeli üzerindeki not).
import "server-only";

import { getDb } from "../db";
import { can, type Role } from "@/lib/roles";

export type OrderStatus = "beklemede" | "onaylandi" | "iptal";

export interface RealOrder {
  id: string;
  listingId: string;
  buyerUserId: string;
  buyerWorkspaceId: string;
  quantity: number;
  totalPriceTRY: number;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

function toRealOrder(row: {
  id: string;
  listingId: string;
  buyerUserId: string;
  buyerWorkspaceId: string;
  quantity: number;
  totalPriceTRY: number;
  status: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RealOrder {
  return {
    id: row.id,
    listingId: row.listingId,
    buyerUserId: row.buyerUserId,
    buyerWorkspaceId: row.buyerWorkspaceId,
    quantity: row.quantity,
    totalPriceTRY: row.totalPriceTRY,
    status: row.status as OrderStatus,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface PlaceOrderResult {
  order?: RealOrder;
  applied: boolean;
  reason?: string;
}

export async function placeOrder(
  listingId: string,
  buyerWorkspaceId: string,
  buyerUserId: string,
  quantity: number,
  note?: string
): Promise<PlaceOrderResult> {
  const db = getDb();
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.active) {
    return { applied: false, reason: "İlan bulunamadı veya artık aktif değil." };
  }
  if (quantity <= 0) {
    return { applied: false, reason: "Miktar sıfırdan büyük olmalı." };
  }
  if (listing.workspaceId === buyerWorkspaceId) {
    return { applied: false, reason: "Kendi ilanına sipariş veremezsin." };
  }

  const row = await db.order.create({
    data: {
      listingId,
      buyerUserId,
      buyerWorkspaceId,
      quantity,
      totalPriceTRY: Math.round(listing.priceTRY * quantity * 100) / 100,
      status: "beklemede",
      note,
    },
  });
  return { applied: true, order: toRealOrder(row) };
}

export async function listOrdersForListing(listingId: string): Promise<RealOrder[]> {
  const db = getDb();
  const rows = await db.order.findMany({ where: { listingId }, orderBy: { createdAt: "desc" } });
  return rows.map(toRealOrder);
}

export async function listMyOrdersAsBuyer(buyerWorkspaceId: string): Promise<RealOrder[]> {
  const db = getDb();
  const rows = await db.order.findMany({ where: { buyerWorkspaceId }, orderBy: { createdAt: "desc" } });
  return rows.map(toRealOrder);
}

export interface UpdateOrderStatusResult {
  order?: RealOrder;
  applied: boolean;
  reason?: string;
}

/**
 * Satıcı workspace'inin commerce.manage izinli bir üyesi onaylayabilir/iptal edebilir;
 * ya da siparişi veren alıcı kendi siparişini iptal edebilir. Başka kimse değiştiremez.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorUserId: string,
  actorWorkspaceId: string,
  actorRole: Role
): Promise<UpdateOrderStatusResult> {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order) return { applied: false, reason: "Sipariş bulunamadı." };
  if (order.status !== "beklemede") {
    return { applied: false, reason: "Yalnızca beklemedeki siparişler güncellenebilir." };
  }

  const isSeller = order.listing.workspaceId === actorWorkspaceId && can(actorRole, "commerce.manage");
  const isBuyerCancelling = order.buyerUserId === actorUserId && newStatus === "iptal";

  if (newStatus === "onaylandi" && !isSeller) {
    return { applied: false, reason: "Yalnızca satıcı onaylayabilir." };
  }
  if (newStatus === "iptal" && !isSeller && !isBuyerCancelling) {
    return { applied: false, reason: "Yalnızca satıcı veya siparişi veren alıcı iptal edebilir." };
  }

  const row = await db.order.update({ where: { id: orderId }, data: { status: newStatus } });
  return { applied: true, order: toRealOrder(row) };
}
