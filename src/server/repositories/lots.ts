// SmartGrowth OS — Lot izlenebilirlik repository katmanı (gerçek Postgres CRUD).
// DÜRÜSTLÜK NOTU: eski /izlenebilirlik yalnız sabit 8 lotluk bir örnek zinciri (LOTS
// sabiti, src/lib/traceability.ts) gösteren salt-okunur bir demoydu — gerçek lot
// oluşturma imkânı yoktu. Bu katman gerçek bir "lot kaydet" akışını mümkün kılar.
// `code` (kullanıcının atadığı lot kodu, ör. "SEED-2026-014") workspace içinde
// benzersizdir ve src/lib/traceability.ts'teki Lot.id ile eşleşir; Prisma'nın kendi
// `id`si (cuid) yalnız iç FK hedefidir. parentLotIds dizisi LotGenealogy join
// tablosundan yeniden kurulur (yazarken de aynı şekilde parent kodları gerçek satırlara
// çözülür) — src/lib/traceability.ts'in saf fonksiyonları hiç değişmeden bu şekilde
// beslenebilir (bkz. o dosyadaki `lots: Lot[] = LOTS` varsayılan parametresi).
import "server-only";

import { getDb } from "../db";
import type { Lot, LotType, LotStatus } from "@/lib/traceability";
import type { LotStatus as PrismaLotStatus } from "../../../generated/prisma/enums";

// Prisma'nın generated LotStatus enum'u @map("geri-cagrildi") yönünü YALNIZ veritabanı
// sütun değerine uygular — çalışma zamanı client'ı hep alt çizgili "geri_cagrildi" döner
// (bkz. src/lib/roles.ts'teki fromPrismaRole/toPrismaRole ile AYNI, zaten bilinen desen).
function toPrismaLotStatus(status: LotStatus): PrismaLotStatus {
  return (status === "geri-cagrildi" ? "geri_cagrildi" : status) as PrismaLotStatus;
}
function fromPrismaLotStatus(status: string): LotStatus {
  return (status === "geri_cagrildi" ? "geri-cagrildi" : status) as LotStatus;
}

export interface LotInput {
  code: string;
  label: string;
  type: LotType;
  cropId?: string;
  quantity: number;
  unit: string;
  producedAt: string; // yyyy-mm-dd
  status?: LotStatus;
  certifiedOrigin: boolean;
  ownerLabel: string;
  parentCodes: string[];
  createdByUserId?: string;
  createdByEmail?: string;
}

/**
 * `Lot` (src/lib/traceability.ts) saf motorun ihtiyaç duyduğu alanlarla sınırlıdır — bu
 * yüzden denetim-izi alanları (kim kaydetti) motoru KİRLETMEMEK için burada, RealListing/
 * RealOrder/RealCertificate ile AYNI desende, ayrı bir genişletme olarak tutulur. `RealLot[]`
 * yapısal olarak `Lot[]`e uyduğu için traceability.ts'in 7 saf fonksiyonuna hiç değişiklik
 * gerekmeden geçilebilir (bkz. o dosyadaki `lots: Lot[] = LOTS` varsayılan parametresi).
 */
export interface RealLot extends Lot {
  createdByUserId?: string;
  createdByEmail?: string;
}

export interface CreateLotResult {
  applied: boolean;
  lot?: RealLot;
  reason?: string;
}

function toDomainLot(
  row: {
    code: string;
    type: string;
    label: string;
    cropId: string | null;
    quantity: number;
    unit: string;
    producedAt: Date;
    status: string;
    certifiedOrigin: boolean;
    ownerLabel: string;
    createdByUserId: string | null;
    createdByEmail: string | null;
  },
  parentLotIds: string[]
): RealLot {
  return {
    id: row.code,
    type: row.type as LotType,
    label: row.label,
    cropId: row.cropId ?? undefined,
    quantity: row.quantity,
    unit: row.unit,
    producedAt: row.producedAt.toISOString().slice(0, 10),
    parentLotIds,
    status: fromPrismaLotStatus(row.status),
    certifiedOrigin: row.certifiedOrigin,
    ownerLabel: row.ownerLabel,
    createdByUserId: row.createdByUserId ?? undefined,
    createdByEmail: row.createdByEmail ?? undefined,
  };
}

export async function listLots(workspaceId: string): Promise<RealLot[]> {
  const db = getDb();
  const rows = await db.lot.findMany({ where: { workspaceId }, orderBy: { producedAt: "asc" } });
  const idToCode = new Map(rows.map((r) => [r.id, r.code]));
  const edges = rows.length
    ? await db.lotGenealogy.findMany({ where: { childId: { in: rows.map((r) => r.id) } } })
    : [];
  const parentsByChild = new Map<string, string[]>();
  for (const e of edges) {
    const code = idToCode.get(e.parentId);
    if (!code) continue;
    const list = parentsByChild.get(e.childId) ?? [];
    list.push(code);
    parentsByChild.set(e.childId, list);
  }
  return rows.map((r) => toDomainLot(r, parentsByChild.get(r.id) ?? []));
}

export async function createLot(workspaceId: string, input: LotInput): Promise<CreateLotResult> {
  const db = getDb();

  const existing = await db.lot.findUnique({ where: { workspaceId_code: { workspaceId, code: input.code } } });
  if (existing) return { applied: false, reason: `"${input.code}" kodlu bir lot zaten var.` };

  if (!(input.quantity > 0)) return { applied: false, reason: "Miktar sıfırdan büyük olmalı." };

  let parentRows: { id: string; code: string }[] = [];
  if (input.parentCodes.length > 0) {
    parentRows = await db.lot.findMany({ where: { workspaceId, code: { in: input.parentCodes } } });
    const foundCodes = new Set(parentRows.map((p) => p.code));
    const missing = input.parentCodes.filter((c) => !foundCodes.has(c));
    if (missing.length > 0) {
      return { applied: false, reason: `Girdi lotu bulunamadı: ${missing.join(", ")}` };
    }
  }

  const row = await db.lot.create({
    data: {
      workspaceId,
      code: input.code,
      label: input.label,
      type: input.type,
      cropId: input.cropId,
      quantity: input.quantity,
      unit: input.unit,
      producedAt: new Date(input.producedAt),
      status: toPrismaLotStatus(input.status ?? "aktif"),
      certifiedOrigin: input.certifiedOrigin,
      ownerLabel: input.ownerLabel,
      createdByUserId: input.createdByUserId,
      createdByEmail: input.createdByEmail,
      parentEdges: { create: parentRows.map((p) => ({ parentId: p.id })) },
    },
  });

  return { applied: true, lot: toDomainLot(row, input.parentCodes) };
}

/** Bugüne göreli olmayan (sabit tarihli), gerçek dünyadan örnek cherry domates zinciri —
 * eski src/lib/traceability.ts LOTS sabitiyle birebir aynı, yalnız artık gerçek satır. */
async function seedDemoChain(workspaceId: string) {
  const seed: LotInput[] = [
    { code: "SEED-2026-014", type: "tohum", label: "Cherry domates tohum lotu", cropId: "cherry-domates-kompakt", quantity: 500, unit: "tohum", producedAt: "2026-02-10", parentCodes: [], status: "tuketildi", certifiedOrigin: true, ownerLabel: "Sertifikalı tedarikçi — Anadolu Tohumculuk" },
    { code: "PROD-2026-031", type: "uretim", label: "Sera üretim partisi", cropId: "cherry-domates-kompakt", quantity: 480, unit: "bitki", producedAt: "2026-03-05", parentCodes: ["SEED-2026-014"], status: "tuketildi", certifiedOrigin: true, ownerLabel: "Ayşe — Sera İşletmesi" },
    { code: "HARVEST-2026-058", type: "hasat", label: "Hasat lotu — hafta 22", cropId: "cherry-domates-kompakt", quantity: 340, unit: "kg", producedAt: "2026-06-02", parentCodes: ["PROD-2026-031"], status: "tuketildi", certifiedOrigin: true, ownerLabel: "Ayşe — Sera İşletmesi" },
    { code: "PKG-2026-102", type: "paket", label: "500g file — parti A (sertifikalı)", cropId: "cherry-domates-kompakt", quantity: 200, unit: "kg", producedAt: "2026-06-03", parentCodes: ["HARVEST-2026-058"], status: "aktif", certifiedOrigin: true, ownerLabel: "Ayşe — Sera İşletmesi" },
    { code: "PKG-2026-103", type: "paket", label: "500g file — parti B (su testi şüpheli)", cropId: "cherry-domates-kompakt", quantity: 140, unit: "kg", producedAt: "2026-06-03", parentCodes: ["HARVEST-2026-058"], status: "incelemede", certifiedOrigin: true, ownerLabel: "Ayşe — Sera İşletmesi" },
    { code: "SHIP-2026-210", type: "sevkiyat", label: "Yerel vitrin sevkiyatı — İstanbul", cropId: "cherry-domates-kompakt", quantity: 90, unit: "kg", producedAt: "2026-06-05", parentCodes: ["PKG-2026-102"], status: "aktif", certifiedOrigin: true, ownerLabel: "Alıcı: Yerel Vitrin — İstanbul" },
    { code: "SHIP-2026-211", type: "sevkiyat", label: "Restoran teslimatı — Şef Deniz", cropId: "cherry-domates-kompakt", quantity: 60, unit: "kg", producedAt: "2026-06-06", parentCodes: ["PKG-2026-103"], status: "aktif", certifiedOrigin: true, ownerLabel: "Alıcı: Restoran — Şef Deniz" },
    { code: "SHIP-2026-212", type: "sevkiyat", label: "Etsy kurutulmuş ürün sevkiyatı", cropId: "aromatik-kekik", quantity: 12, unit: "kg", producedAt: "2026-06-07", parentCodes: ["PKG-2026-103"], status: "aktif", certifiedOrigin: true, ownerLabel: "Alıcı: Etsy siparişi #EC-4471" },
  ];
  // Sıralı — her adım kendinden önceki koda (parentCodes) referans verir.
  for (const s of seed) {
    await createLot(workspaceId, s);
  }
}

/** Bir workspace'in lotlarını döner; hiç lotu yoksa (ilk ziyaret) örnek zincirle doldurur. */
export async function listOrSeedLots(workspaceId: string): Promise<RealLot[]> {
  const db = getDb();
  const count = await db.lot.count({ where: { workspaceId } });
  if (count === 0) await seedDemoChain(workspaceId);
  return listLots(workspaceId);
}
