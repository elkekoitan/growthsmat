// SmartGrowth OS — Sensör, kalite ve alarm motoru v1 (PRD §9.13 FR-206–220)
// Yanlış/aykırı sensör değeri otomatik eylemden önce filtrelenir (FR-213); alarm süre ve
// eşiğe dayanır, tek anlık sıçrama yanlış alarm üretmez (FR-212).

export type SensorType = "sicaklik" | "nem" | "toprak-nemi" | "ec" | "ph" | "isik";

export interface Device {
  id: string;
  label: string;
  zone: string;
  type: SensorType;
  unit: string;
  batteryPct: number;
  online: boolean;
  calibratedAt: string; // ISO tarih
}

export type QualityFlag = "gecerli" | "supheli";

export interface Reading {
  deviceId: string;
  value: number;
  timestamp: string; // ISO tarih-saat, artan sırada
  qualityFlag?: QualityFlag;
}

export interface AlertRule {
  id: string;
  deviceId: string;
  comparator: ">" | "<";
  threshold: number;
  minConsecutive: number; // FR-212: kaç ardışık ihlal alarmı tetikler
  label: string;
}

export interface AlertResult {
  rule: AlertRule;
  triggered: boolean;
  breachStreak: number;
  lastValidValue?: number;
  ignoredSuspiciousCount: number;
}

// ---------- Cihaz + örnek okuma seti (sera senaryosu) ----------
export const DEVICES: Device[] = [
  { id: "SEN-T01", label: "Sera sıcaklık", zone: "Sera A — Cherry Domates", type: "sicaklik", unit: "°C", batteryPct: 82, online: true, calibratedAt: "2026-05-01" },
  { id: "SEN-H01", label: "Sera nem", zone: "Sera A — Cherry Domates", type: "nem", unit: "%", batteryPct: 82, online: true, calibratedAt: "2026-05-01" },
  { id: "SEN-SM01", label: "Toprak nemi", zone: "Sera A — Cherry Domates", type: "toprak-nemi", unit: "%", batteryPct: 45, online: true, calibratedAt: "2026-04-15" },
];

/**
 * Ardışık okumada SON GEÇERLİ değere göre büyük sıçrama varsa "şüpheli" işaretler (FR-213).
 * Kıyas her zaman en son geçerli okumayla yapılır — tek bir aykırı sıçrama, ondan sonraki
 * normal okumaları da yanlışlıkla şüpheli göstermez (baseline bozulmaz).
 */
export function flagAnomalies(readings: Reading[], maxAbsJump = 15): Reading[] {
  const sorted = [...readings].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const out: Reading[] = [];
  let lastValid: number | undefined;
  for (const r of sorted) {
    if (lastValid === undefined) {
      out.push({ ...r, qualityFlag: "gecerli" });
      lastValid = r.value;
      continue;
    }
    const jump = Math.abs(r.value - lastValid);
    const suspicious = jump > maxAbsJump;
    out.push({ ...r, qualityFlag: suspicious ? "supheli" : "gecerli" });
    if (!suspicious) lastValid = r.value;
  }
  return out;
}

/**
 * Bir alarm kuralını değerlendirir. YALNIZ geçerli (şüpheli olmayan) okumalar ardışık
 * sayaca dahil edilir — aykırı değer otomatik eylemi tetiklemez (FR-213).
 */
export function evaluateAlertRule(readings: Reading[], rule: AlertRule): AlertResult {
  const deviceReadings = readings
    .filter((r) => r.deviceId === rule.deviceId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const flagged = flagAnomalies(deviceReadings);

  let streak = 0;
  let maxStreak = 0;
  let ignoredSuspicious = 0;
  let lastValidValue: number | undefined;

  for (const r of flagged) {
    if (r.qualityFlag === "supheli") {
      ignoredSuspicious++;
      continue; // aykırı değer sayaca girmez, ama sayaç da sıfırlanmaz (tek şüpheli nokta akışı bozmaz)
    }
    const breaches = rule.comparator === ">" ? r.value > rule.threshold : r.value < rule.threshold;
    lastValidValue = r.value;
    if (breaches) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  return {
    rule,
    triggered: maxStreak >= rule.minConsecutive,
    breachStreak: maxStreak,
    lastValidValue,
    ignoredSuspiciousCount: ignoredSuspicious,
  };
}

export const SENSOR_TYPE_LABELS: Record<SensorType, string> = {
  sicaklik: "Sıcaklık",
  nem: "Hava nemi",
  "toprak-nemi": "Toprak nemi",
  ec: "EC (iletkenlik)",
  ph: "pH",
  isik: "Işık",
};
