// SmartGrowth OS — Pazar ilan repository katmanı (gerçek Postgres CRUD).
// Bu dosya src/lib/** DEĞİLDİR — DB erişimi burada, iş mantığı/tip sözleşmesi
// src/data/commerce.ts'teki CatalogListing şekliyle uyumlu tutulur (aynı alanlar).
import "server-only";

import { getDb } from "../db";
import type {
  ProductFormat,
  StockType,
  ChannelId,
  OrganicClaimStatus,
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

export async function listActiveListings(): Promise<RealListing[]> {
  const db = getDb();
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
