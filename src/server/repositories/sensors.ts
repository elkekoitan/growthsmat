// SmartGrowth OS — Sensör repository katmanı (gerçek Postgres CRUD).
// DÜRÜSTLÜK NOTU: gerçek IoT donanımı yok — okumalar MANUEL girilir (bkz. sensor/actions.ts).
// Sahte bir simülatör/cron kurmak yerine bilinçli bir tercih — bkz. schema.prisma yorumu.
import "server-only";

import { getDb } from "../db";
import type { Device, Reading, AlertRule, SensorType } from "@/lib/sensors";

function toDomainDevice(row: {
  code: string;
  label: string;
  zone: string;
  type: string;
  unit: string;
  batteryPct: number;
  online: boolean;
  calibratedAt: Date;
}): Device {
  return {
    id: row.code,
    label: row.label,
    zone: row.zone,
    type: row.type as SensorType,
    unit: row.unit,
    batteryPct: row.batteryPct,
    online: row.online,
    calibratedAt: row.calibratedAt.toISOString().slice(0, 10),
  };
}

function toDomainReading(row: { device: { code: string }; value: number; timestamp: Date }): Reading {
  return { deviceId: row.device.code, value: row.value, timestamp: row.timestamp.toISOString() };
}

function toDomainRule(row: { id: string; device: { code: string }; comparator: string; threshold: number; minConsecutive: number; label: string }): AlertRule {
  return {
    id: row.id,
    deviceId: row.device.code,
    comparator: row.comparator as ">" | "<",
    threshold: row.threshold,
    minConsecutive: row.minConsecutive,
    label: row.label,
  };
}

// Sicaklik/nem/toprak-nemi için sensible varsayılan kural (eski SensorDashboard.tsx'in
// DEFAULT_RULES'ıyla birebir aynı). Diğer sensör tipleri (ec/ph/isik) için gerçek saha
// verisi olmadan bir eşik UYDURULMADI — o tipler kuralsız kalır, dashboard'da dürüstçe
// "henüz alarm kuralı yok" gösterilir.
const DEFAULT_RULE_BY_TYPE: Partial<Record<SensorType, Omit<AlertRule, "id" | "deviceId">>> = {
  sicaklik: { comparator: ">", threshold: 30, minConsecutive: 2, label: "Yüksek sıcaklık" },
  nem: { comparator: ">", threshold: 80, minConsecutive: 2, label: "Aşırı nem" },
  "toprak-nemi": { comparator: "<", threshold: 20, minConsecutive: 3, label: "Düşük toprak nemi" },
};

export interface DeviceInput {
  code: string;
  label: string;
  zone: string;
  type: SensorType;
  unit: string;
  calibratedAt: string; // yyyy-mm-dd
}

export interface CreateDeviceResult {
  applied: boolean;
  device?: Device;
  reason?: string;
}

export async function createDevice(workspaceId: string, input: DeviceInput): Promise<CreateDeviceResult> {
  const db = getDb();
  const existing = await db.device.findUnique({ where: { workspaceId_code: { workspaceId, code: input.code } } });
  if (existing) return { applied: false, reason: `"${input.code}" kodlu bir cihaz zaten var.` };

  const row = await db.device.create({
    data: {
      workspaceId,
      code: input.code,
      label: input.label,
      zone: input.zone,
      type: input.type,
      unit: input.unit,
      calibratedAt: new Date(input.calibratedAt),
      ...(DEFAULT_RULE_BY_TYPE[input.type]
        ? { alertRules: { create: [DEFAULT_RULE_BY_TYPE[input.type]!] } }
        : {}),
    },
  });
  return { applied: true, device: toDomainDevice(row) };
}

export async function listDevices(workspaceId: string): Promise<Device[]> {
  const db = getDb();
  const rows = await db.device.findMany({ where: { workspaceId }, orderBy: { calibratedAt: "asc" } });
  return rows.map(toDomainDevice);
}

export async function listReadings(workspaceId: string, deviceCode: string): Promise<Reading[]> {
  const db = getDb();
  const rows = await db.reading.findMany({
    where: { device: { workspaceId, code: deviceCode } },
    include: { device: { select: { code: true } } },
    orderBy: { timestamp: "asc" },
  });
  return rows.map(toDomainReading);
}

export async function listAlertRules(workspaceId: string, deviceCode: string): Promise<AlertRule[]> {
  const db = getDb();
  const rows = await db.alertRule.findMany({
    where: { device: { workspaceId, code: deviceCode } },
    include: { device: { select: { code: true } } },
  });
  return rows.map(toDomainRule);
}

export interface AddReadingResult {
  applied: boolean;
  reading?: Reading;
  reason?: string;
}

export async function addReading(workspaceId: string, deviceCode: string, value: number): Promise<AddReadingResult> {
  const db = getDb();
  const device = await db.device.findUnique({ where: { workspaceId_code: { workspaceId, code: deviceCode } } });
  if (!device) return { applied: false, reason: "Cihaz bulunamadı." };

  const row = await db.reading.create({ data: { deviceId: device.id, value, timestamp: new Date() } });
  return { applied: true, reading: { deviceId: deviceCode, value: row.value, timestamp: row.timestamp.toISOString() } };
}

/** Bugüne göreli olmayan sabit demo cihaz + okuma seti — eski SensorDashboard.tsx'teki
 * DEVICES/DEMO_READINGS ile birebir aynı, yalnız artık gerçek satır. */
async function seedDemoDevices(workspaceId: string) {
  const seed: (DeviceInput & { readings: number[] })[] = [
    { code: "SEN-T01", label: "Sera sıcaklık", zone: "Sera A — Cherry Domates", type: "sicaklik", unit: "°C", calibratedAt: "2026-05-01", readings: [22, 23, 24, 25, 55, 24, 25, 26, 32, 33, 34, 33] },
    { code: "SEN-H01", label: "Sera nem", zone: "Sera A — Cherry Domates", type: "nem", unit: "%", calibratedAt: "2026-05-01", readings: [64, 66, 65, 68, 67, 65, 66, 64, 65, 66] },
    { code: "SEN-SM01", label: "Toprak nemi", zone: "Sera A — Cherry Domates", type: "toprak-nemi", unit: "%", calibratedAt: "2026-04-15", readings: [38, 35, 32, 29, 26, 23, 20, 18, 17, 16] },
  ];
  const base = new Date("2026-07-10T08:00:00Z");
  for (const s of seed) {
    const result = await createDevice(workspaceId, s);
    if (!result.applied || !result.device) continue;
    const db = getDb();
    const deviceRow = await db.device.findUnique({ where: { workspaceId_code: { workspaceId, code: s.code } } });
    if (!deviceRow) continue;
    await db.reading.createMany({
      data: s.readings.map((value, i) => ({
        deviceId: deviceRow.id,
        value,
        timestamp: new Date(base.getTime() + i * 3600_000),
      })),
    });
  }
}

export async function listOrSeedDevices(workspaceId: string): Promise<Device[]> {
  const db = getDb();
  const count = await db.device.count({ where: { workspaceId } });
  if (count === 0) await seedDemoDevices(workspaceId);
  return listDevices(workspaceId);
}
