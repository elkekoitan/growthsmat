// SmartGrowth OS — Alan (Site) + toprak/su testi repository katmanı (/alan-kalitesi kalıcılığı).
// DÜRÜSTLÜK NOTU: skor motoru (src/lib/siteQuality.ts computeDataQuality) SAF kalır — bu
// katman yalnız kullanıcının GİRDİĞİ ham alan profilini ve yapılmış testleri okur/yazar;
// hesaplanan DataQualityResult hiçbir zaman kalıcılaştırılmaz (PlotSeason/Plan ile aynı ilke).
// Skor her okumada nowInTurkeyISO()'ya göre TAZE hesaplanır — bayatlık zamanla değişen bir
// yargıdır, dünkü "güncel" bugün "bayat" olabilir; dondurulmuş skor yalan söylerdi.
import "server-only";

import { getDb } from "../db";
import { nowInTurkeyISO } from "../trDate";
import { computeDataQuality, type DataQualityResult, type SiteProfile } from "@/lib/siteQuality";
import {
  validateSiteInput,
  validateSoilTestInput,
  validateWaterTestInput,
} from "@/lib/siteInput";

export type SiteWriteResult = { applied: true } | { applied: false; reason: string };

export interface SiteWithQuality {
  siteId: string;
  profile: SiteProfile;
  result: DataQualityResult;
  soilTestCount: number;
  waterTestCount: number;
}

/**
 * Bir workspace'in alanlarını EN YENİ toprak/su testleriyle çeker ve her biri için veri
 * kalite skorunu o anda hesaplar. Motor yalnız en son teste bakar (bayatlık en son ölçüme
 * göre yargılanır) ama geçmiş test sayıları da döner — UI "2 toprak testi kayıtlı" diyerek
 * kaydın gerçek olduğunu gösterir, uydurma özet yazmaz.
 */
export async function listSitesWithQuality(workspaceId: string): Promise<SiteWithQuality[]> {
  const db = getDb();
  const nowISO = nowInTurkeyISO();

  const rows = await db.site.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: {
      soilTests: { orderBy: { sampledAt: "desc" }, take: 1 },
      waterTests: { orderBy: { testedAt: "desc" }, take: 1 },
      _count: { select: { soilTests: true, waterTests: true } },
    },
  });

  return rows.map((row) => {
    const soil = row.soilTests[0];
    const water = row.waterTests[0];
    const profile: SiteProfile = {
      id: row.id,
      name: row.name,
      areaM2: row.areaM2,
      sunHoursObserved: row.sunHoursObserved ?? undefined,
      soilTest: soil
        ? {
            ph: soil.ph,
            ec: soil.ec,
            organicMatterPct: soil.organicMatterPct,
            sampledAt: soil.sampledAt.toISOString().slice(0, 10),
          }
        : undefined,
      waterTest: water
        ? { qualityOk: water.qualityOk, testedAt: water.testedAt.toISOString().slice(0, 10) }
        : undefined,
      exactLocationKnown: row.exactLocationKnown,
    };
    return {
      siteId: row.id,
      profile,
      result: computeDataQuality(profile, nowISO),
      soilTestCount: row._count.soilTests,
      waterTestCount: row._count.waterTests,
    };
  });
}

/**
 * Yeni alan oluşturur. Doğrulama saf katmanda (src/lib/siteInput.ts). Aynı adla ikinci alan
 * compound unique'e (workspaceId+name) takılır — yarış durumunda bile DB son sözü söyler,
 * P2002 kullanıcıya anlaşılır bir gerekçeyle döner (upsert DEĞİL: aynı ada sessizce yazmak
 * mevcut alanın profilini habersiz ezerdi).
 */
export async function createSite(
  workspaceId: string,
  input: { name: string; areaM2: number; sunHoursObserved?: number; exactLocationKnown: boolean }
): Promise<SiteWriteResult> {
  const validated = validateSiteInput(input);
  if (!validated.ok) return { applied: false, reason: validated.reason };

  const db = getDb();
  try {
    await db.site.create({
      data: {
        workspaceId,
        name: validated.value.name,
        areaM2: validated.value.areaM2,
        sunHoursObserved: validated.value.sunHoursObserved ?? null,
        exactLocationKnown: validated.value.exactLocationKnown,
      },
    });
  } catch (e) {
    // Prisma unique ihlali — sınıf importu yerine kod kontrolü (driver-adapter altında da
    // stabil olan tek sözleşme error.code'dur).
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      return { applied: false, reason: "Bu adla bir alan zaten var." };
    }
    throw e;
  }
  return { applied: true };
}

/**
 * Gözlem alanlarını günceller (güneş saati + tam konum bilgisi). updateMany + workspaceId:
 * id tek başına ASLA yeterli değil (tenant izolasyonu — trackedCrops ile aynı desen).
 * sunHoursObserved=null "gözlemi sil" demektir; doğrulama yalnız sayı verilmişse çalışır.
 */
export async function updateSiteObservations(
  workspaceId: string,
  siteId: string,
  input: { sunHoursObserved: number | null; exactLocationKnown: boolean }
): Promise<SiteWriteResult> {
  if (input.sunHoursObserved !== null) {
    if (!Number.isFinite(input.sunHoursObserved) || input.sunHoursObserved < 0 || input.sunHoursObserved > 24) {
      return { applied: false, reason: "Güneş saati 0 ile 24 arasında olmalı." };
    }
  }
  const db = getDb();
  const res = await db.site.updateMany({
    where: { id: siteId, workspaceId },
    data: { sunHoursObserved: input.sunHoursObserved, exactLocationKnown: input.exactLocationKnown },
  });
  if (res.count === 0) return { applied: false, reason: "Alan bulunamadı." };
  return { applied: true };
}

/**
 * Toprak testi ekler. ÖNCE alanın bu workspace'e ait olduğu doğrulanır (SoilTest'in kendi
 * workspaceId kolonu yok — sahiplik Site üzerinden geçer, o yüzden bu kontrol atlanamaz).
 * Tarih "bugünden ileri olamaz" kuralı TR yerel gününe göre işler (nowInTurkeyISO).
 */
export async function addSoilTest(
  workspaceId: string,
  siteId: string,
  input: { ph: number; ec: number; organicMatterPct: number; sampledAt: string }
): Promise<SiteWriteResult> {
  const validated = validateSoilTestInput(input, nowInTurkeyISO());
  if (!validated.ok) return { applied: false, reason: validated.reason };

  const db = getDb();
  const site = await db.site.findFirst({ where: { id: siteId, workspaceId } });
  if (!site) return { applied: false, reason: "Alan bulunamadı." };

  await db.soilTest.create({
    data: {
      siteId: site.id,
      ph: validated.value.ph,
      ec: validated.value.ec,
      organicMatterPct: validated.value.organicMatterPct,
      sampledAt: new Date(validated.value.sampledAt + "T00:00:00Z"),
    },
  });
  return { applied: true };
}

/** Su testi ekler — sahiplik ve tarih kuralları toprak testiyle aynı. */
export async function addWaterTest(
  workspaceId: string,
  siteId: string,
  input: { qualityOk: boolean; testedAt: string }
): Promise<SiteWriteResult> {
  const validated = validateWaterTestInput(input, nowInTurkeyISO());
  if (!validated.ok) return { applied: false, reason: validated.reason };

  const db = getDb();
  const site = await db.site.findFirst({ where: { id: siteId, workspaceId } });
  if (!site) return { applied: false, reason: "Alan bulunamadı." };

  await db.waterTest.create({
    data: {
      siteId: site.id,
      qualityOk: validated.value.qualityOk,
      testedAt: new Date(validated.value.testedAt + "T00:00:00Z"),
    },
  });
  return { applied: true };
}

/** Alanı siler — bağlı toprak/su testleri şemadaki onDelete: Cascade ile birlikte gider. */
export async function deleteSite(workspaceId: string, siteId: string): Promise<SiteWriteResult> {
  const db = getDb();
  const res = await db.site.deleteMany({ where: { id: siteId, workspaceId } });
  if (res.count === 0) return { applied: false, reason: "Alan bulunamadı." };
  return { applied: true };
}
