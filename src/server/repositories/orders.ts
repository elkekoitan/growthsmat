// SmartGrowth OS — Pazar sipariş repository katmanı (gerçek Postgres CRUD).
// DÜRÜSTLÜK NOTU: burada oluşan "Order" gerçek bir ödeme işlemi DEĞİLDİR — hiçbir ödeme
// ağ geçidi entegre edilmemiştir. Bu, iki gerçek hesap arasında kalıcı bir SATIN ALMA
// TALEBİ kaydıdır (bkz. prisma/schema.prisma Order modeli üzerindeki not).
import "server-only";

import { getDb } from "../db";
import { can, type Role } from "@/lib/roles";
import { isSelectablePaymentMethod, evaluateMarkOrderPaid, type PaymentMethod, type PaymentStatus } from "@/lib/payment";

export type OrderStatus = "beklemede" | "onaylandi" | "iptal";

export interface RealOrder {
  id: string;
  listingId: string;
  buyerUserId: string;
  buyerWorkspaceId: string;
  quantity: number;
  totalPriceTRY: number;
  status: OrderStatus;
  // Ödeme: MANUEL tahsilat kaydı (kapıda/havale) — online ağ geçidi YOK (bkz. src/lib/payment.ts).
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
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
  paymentMethod: string;
  paymentStatus: string;
  paidAt: Date | null;
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
    paymentMethod: row.paymentMethod as PaymentMethod,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paidAt: row.paidAt ? row.paidAt.toISOString() : undefined,
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
  note?: string,
  paymentMethod: PaymentMethod = "belirtilmedi"
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
  if (quantity > listing.stockQty) {
    return { applied: false, reason: `Stokta yalnız ${listing.stockQty} adet var.` };
  }

  // Stok, sipariş TALEP edilirken hemen rezerve edilir (satıcı onayını beklerken başka
  // bir alıcı aynı stoğu sipariş edemesin diye) — koşullu updateMany (stockQty >= quantity)
  // aynı anda gelen iki siparişte de yarış durumunu (race condition) engeller: yalnız BİRİ
  // 1 satır etkiler, diğeri 0 satır görüp reddedilir. İptal edilirse stok geri eklenir
  // (bkz. updateOrderStatus), onaylanırsa zaten düşülmüş olan miktar aynen kalır.
  const reserved = await db.listing.updateMany({
    where: { id: listingId, stockQty: { gte: quantity } },
    data: { stockQty: { decrement: quantity } },
  });
  if (reserved.count === 0) {
    return { applied: false, reason: "Stok az önce değişti, tekrar dene." };
  }

  // Yöntemi doğrula: yalnız "kapida"/"havale" kabul edilir; geçersizse (çöp, "online" vb.)
  // "belirtilmedi"e DÜŞÜLÜR — sipariş yine oluşur (yöntem, siparişin gerçekleşmesi için
  // zorunlu değildir; üretici sonradan da tahsilat yöntemini belirleyebilir). paymentStatus
  // her zaman "bekliyor" başlar — tahsilat ancak markOrderPaid ile elle işaretlenir.
  const method: PaymentMethod = isSelectablePaymentMethod(paymentMethod) ? paymentMethod : "belirtilmedi";

  const row = await db.order.create({
    data: {
      listingId,
      buyerUserId,
      buyerWorkspaceId,
      quantity,
      totalPriceTRY: Math.round(listing.priceTRY * quantity * 100) / 100,
      status: "beklemede",
      paymentMethod: method,
      paymentStatus: "bekliyor",
      note,
    },
  });
  return { applied: true, order: toRealOrder(row) };
}

export interface CartOrderItem {
  listingId: string;
  quantity: number;
}

export interface CartOrderLineResult {
  listingId: string;
  applied: boolean;
  reason?: string;
  order?: RealOrder;
}

export interface PlaceMultipleOrdersResult {
  lines: CartOrderLineResult[];
  allApplied: boolean;
}

/**
 * Sepetten birden fazla ilan için tek seferde sipariş oluşturur. Her satır AYRI bir
 * placeOrder() çağrısıdır (aynı stok-rezervasyon/kendi-ilanı-alamama kuralları geçerlidir) —
 * bir satır başarısız olsa bile diğerleri denenmeye devam eder (tek başarısız ürün yüzünden
 * sepetteki her şeyin iptal olması gerekmez).
 */
export async function placeMultipleOrders(
  items: CartOrderItem[],
  buyerWorkspaceId: string,
  buyerUserId: string,
  paymentMethod: PaymentMethod = "belirtilmedi"
): Promise<PlaceMultipleOrdersResult> {
  // Ödeme yöntemi sepet GENELİDİR (tek checkout = tek yöntem) — CartOrderItem'a ayrı alan
  // eklenmedi. Her satır aynı yöntemle placeOrder()'a geçer; placeOrder geçersizi düşürür.
  const lines: CartOrderLineResult[] = [];
  for (const item of items) {
    const result = await placeOrder(item.listingId, buyerWorkspaceId, buyerUserId, item.quantity, undefined, paymentMethod);
    lines.push({ listingId: item.listingId, applied: result.applied, reason: result.reason, order: result.order });
  }
  return { lines, allApplied: lines.every((l) => l.applied) };
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

/** Alıcı siparişini, HANGİ ürün/satıcı/birim olduğunu gösterecek detaylarla döner. */
export interface BuyerOrderView extends RealOrder {
  listingTitle: string;
  producer: string;
  region: string;
  unitLabel: string;
}

/**
 * "Siparişlerim" görünümü için: her siparişi ilan başlığı/üretici/birim ile birlikte döner.
 * DÜRÜSTLÜK/UX: alıcı "3× · 45 ₺" yerine HANGİ ürünü sipariş ettiğini net görsün diye
 * (eski minimal görünüm "kullanıcı kayboluyor" geri bildiriminin bir örneğiydi).
 * Yalnız kendi workspace'inin siparişleri (buyerWorkspaceId ile scoped).
 */
export async function listMyOrdersDetailed(buyerWorkspaceId: string): Promise<BuyerOrderView[]> {
  const db = getDb();
  const rows = await db.order.findMany({
    where: { buyerWorkspaceId },
    orderBy: { createdAt: "desc" },
    include: { listing: true },
  });
  return rows.map((r) => ({
    ...toRealOrder(r),
    listingTitle: r.listing.title,
    producer: r.listing.producer,
    region: r.listing.region,
    unitLabel: r.listing.unitLabel,
  }));
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

  // İptalde rezerve edilen stok geri eklenir — placeOrder() zaten talep anında düşmüştü.
  // Onayda hiçbir stok değişikliği gerekmez (miktar zaten düşülmüş durumda kalır).
  if (newStatus === "iptal") {
    await db.listing.update({ where: { id: order.listingId }, data: { stockQty: { increment: order.quantity } } });
  }

  const row = await db.order.update({ where: { id: orderId }, data: { status: newStatus } });
  return { applied: true, order: toRealOrder(row) };
}

export interface MarkOrderPaidResult {
  order?: RealOrder;
  applied: boolean;
  reason?: string;
}

/**
 * Üretici, ONAYLANMIŞ bir siparişin parasını ELDEN (kapıda) ya da HAVALE ile aldığını
 * elle "Ödendi" işaretler — bu MANUEL bir tahsilat kaydıdır, hiçbir ödeme ağ geçidi
 * çağrılmaz (bkz. src/lib/payment.ts). Yalnız SATICI + commerce.manage + kendi ilanı
 * yapabilir (updateOrderStatus'taki rol/sahiplik kapısı deseninin BİREBİR aynısı) —
 * alıcı kendi siparişini "ödendi" işaretleyemez.
 *
 * DÜRÜSTLÜK KAPISI: yalnız "onaylandi" siparişte tahsilat işaretlenebilir. "beklemede"
 * (henüz kabul edilmemiş) veya "iptal" siparişte para alınmış sayılmaz — onaylanmadan
 * tahsilat kaydı tutmak gerçeği yanlış gösterir. paymentStatus zaten "odendi" ise işlem
 * idempotenttir (tekrar tıklamada yeniden yazmaz, dürüst bir sebeple döner).
 */
export async function markOrderPaid(
  orderId: string,
  actorUserId: string,
  actorWorkspaceId: string,
  actorRole: Role
): Promise<MarkOrderPaidResult> {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true } });
  if (!order) return { applied: false, reason: "Sipariş bulunamadı." };

  // Yetki/durum kapısı saf katmanda (src/lib/payment.ts) — testli, tek gerçek kaynak.
  const decision = evaluateMarkOrderPaid(
    {
      sellerWorkspaceId: order.listing.workspaceId,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus as PaymentStatus,
    },
    { workspaceId: actorWorkspaceId, canManageCommerce: can(actorRole, "commerce.manage") }
  );
  if (!decision.allowed) return { applied: false, reason: decision.reason };

  const row = await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: "odendi", paidAt: new Date() },
  });
  return { applied: true, order: toRealOrder(row) };
}
