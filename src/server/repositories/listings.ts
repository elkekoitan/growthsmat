// SmartGrowth OS — Pazar ilan repository katmanı (gerçek Postgres CRUD).
// Bu dosya src/lib/** DEĞİLDİR — DB erişimi burada, iş mantığı/tip sözleşmesi
// src/data/commerce.ts'teki CatalogListing şekliyle uyumlu tutulur (aynı alanlar).
import "server-only";

import crypto from "node:crypto";
import { getDb } from "../db";
import { hashPassword } from "../password";
import {
  CATALOG,
  type ProductFormat,
  type StockType,
  type ChannelId,
  type OrganicClaimStatus,
  type CatalogListing,
} from "@/data/commerce";

export interface ListingInput {
  cropId?: string;
  microgreenId?: string;
  title: string;
  producer: string;
  region: string;
  format: ProductFormat;
  unitLabel: string;
  priceTRY: number;
  stockType: StockType;
  stockQty: number;
  channels: ChannelId[];
  claim: OrganicClaimStatus;
  shelfLifeDays: number;
  repeatOrderRate: number;
}

export interface RealListing extends ListingInput {
  id: string;
  workspaceId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function toRealListing(row: {
  id: string;
  workspaceId: string;
  cropId: string | null;
  microgreenId: string | null;
  title: string;
  producer: string;
  region: string;
  format: string;
  unitLabel: string;
  priceTRY: number;
  stockType: string;
  stockQty: number;
  channels: string[];
  claim: string;
  shelfLifeDays: number;
  repeatOrderRate: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): RealListing {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    cropId: row.cropId ?? undefined,
    microgreenId: row.microgreenId ?? undefined,
    title: row.title,
    producer: row.producer,
    region: row.region,
    format: row.format as ProductFormat,
    unitLabel: row.unitLabel,
    priceTRY: row.priceTRY,
    stockType: row.stockType as StockType,
    stockQty: row.stockQty,
    channels: row.channels as ChannelId[],
    claim: row.claim as OrganicClaimStatus,
    shelfLifeDays: row.shelfLifeDays,
    repeatOrderRate: row.repeatOrderRate,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createListing(workspaceId: string, input: ListingInput): Promise<RealListing> {
  const db = getDb();
  const row = await db.listing.create({
    data: {
      workspaceId,
      cropId: input.cropId,
      microgreenId: input.microgreenId,
      title: input.title,
      producer: input.producer,
      region: input.region,
      format: input.format,
      unitLabel: input.unitLabel,
      priceTRY: input.priceTRY,
      stockType: input.stockType,
      stockQty: input.stockQty,
      channels: input.channels,
      claim: input.claim,
      shelfLifeDays: input.shelfLifeDays,
      repeatOrderRate: input.repeatOrderRate,
    },
  });
  return toRealListing(row);
}

// ---------- Pazarı ilk açılışta gerçek ilanlarla doldur (seed-if-empty) ----------
// src/server/repositories/tasks.ts listOrSeedTasks() ve lots.ts listOrSeedLots() ile AYNI
// desen: sayaç 0 ise tohum satırları oluştur. Fark: ilanların bir sahip workspace+user'ı
// olması gerekir (per-caller seed'lerin aksine), bu yüzden önce özel bir "örnek üreticiler"
// workspace'i ve kimse-giriş-yapamayan bir sistem kullanıcısı upsert edilir. Böylece HERKESE
// AÇIK /pazar boş bir vitrin yerine gerçek, tıklanabilir Listing satırları gösterir.
// DÜRÜSTLÜK NOTU: repeatOrderRate KASITLI OLARAK 0 tohumlanır (yeni pazarın gerçek tekrar-
// sipariş geçmişi yoktur, hiçbir yerde de gösterilmez); stockQty ise gerçek bir envanter
// adedidir (siparişte azalır) — sabit, makul bir >0 değer atanır.
const DEMO_PRODUCER_WORKSPACE_ID = "sg-demo-hasat-pazari";
const DEMO_PRODUCER_USER_EMAIL = "vitrin@demo.smartgrowth.local";

function seedStockQty(l: CatalogListing): number {
  // stockType yalnız kategorik bir etiket — gerçek adet buradan türetilir (makul, >0).
  switch (l.stockType) {
    case "mevcut":
      return 24;
    case "tahmini-hasat":
      return 12;
    case "on-siparis":
      return 40;
    default:
      return 10;
  }
}

/** Örnek üreticiler workspace'ini (ve onu sahiplenen sistem kullanıcısı + üyeliği) upsert eder. */
async function ensureDemoProducerWorkspace(): Promise<string> {
  const db = getDb();
  // Sistem sahibi kullanıcı — rastgele, hiçbir yerde saklanmayan şifre: kimse bununla giriş yapamaz.
  const user = await db.user.upsert({
    where: { email: DEMO_PRODUCER_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_PRODUCER_USER_EMAIL,
      passwordHash: hashPassword(crypto.randomBytes(32).toString("hex")),
    },
  });
  await db.workspace.upsert({
    where: { id: DEMO_PRODUCER_WORKSPACE_ID },
    update: {},
    create: { id: DEMO_PRODUCER_WORKSPACE_ID, name: "Hasat Pazarı — Örnek Üreticiler" },
  });
  await db.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: DEMO_PRODUCER_WORKSPACE_ID } },
    update: {},
    create: { userId: user.id, workspaceId: DEMO_PRODUCER_WORKSPACE_ID, role: "sahip", status: "aktif" },
  });
  return DEMO_PRODUCER_WORKSPACE_ID;
}

/**
 * Veritabanında HİÇ ilan yoksa (ilk açılış) katalogdaki 8 ürünü gerçek Listing satırı olarak
 * tohumlar. Idempotent: toplam ilan sayısı > 0 ise hiçbir şey yapmaz (aktif/pasif fark etmez —
 * total count'a bakılır, böylece tüm ilanlar pasifleştirilse bile yeniden tohumlanmaz).
 */
export async function seedMarketplaceIfEmpty(): Promise<void> {
  const db = getDb();
  const count = await db.listing.count();
  if (count > 0) return;
  const workspaceId = await ensureDemoProducerWorkspace();
  await db.listing.createMany({
    data: CATALOG.map((l) => ({
      workspaceId,
      cropId: l.cropId,
      microgreenId: l.microgreenId,
      title: l.title,
      producer: l.producer,
      region: l.region,
      format: l.format,
      unitLabel: l.unitLabel,
      priceTRY: l.priceTRY,
      stockType: l.stockType,
      stockQty: seedStockQty(l),
      channels: l.channels,
      claim: l.claim,
      shelfLifeDays: l.shelfLifeDays,
      repeatOrderRate: 0,
    })),
  });
}

export async function listActiveListings(): Promise<RealListing[]> {
  const db = getDb();
  await seedMarketplaceIfEmpty();
  const rows = await db.listing.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRealListing);
}

export async function listMyListings(workspaceId: string): Promise<RealListing[]> {
  const db = getDb();
  const rows = await db.listing.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRealListing);
}

export async function getListingById(id: string): Promise<RealListing | undefined> {
  const db = getDb();
  const row = await db.listing.findUnique({ where: { id } });
  return row ? toRealListing(row) : undefined;
}

export async function setListingActive(id: string, workspaceId: string, active: boolean): Promise<RealListing | undefined> {
  const db = getDb();
  const existing = await db.listing.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) return undefined;
  const row = await db.listing.update({ where: { id }, data: { active } });
  return toRealListing(row);
}

/** Yalnız ilanın kendi workspace'i stok adedini elle güncelleyebilir (yeniden stoklama). */
export async function setListingStock(id: string, workspaceId: string, stockQty: number): Promise<RealListing | undefined> {
  const db = getDb();
  const existing = await db.listing.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) return undefined;
  const row = await db.listing.update({ where: { id }, data: { stockQty: Math.max(0, Math.round(stockQty)) } });
  return toRealListing(row);
}
