import { test } from "node:test";
import assert from "node:assert/strict";
import { flagAnomalies, evaluateAlertRule, DEVICES, type Reading, type AlertRule } from "../src/lib/sensors.ts";

function reading(deviceId: string, value: number, minute: number): Reading {
  return { deviceId, value, timestamp: `2026-07-10T10:${String(minute).padStart(2, "0")}:00Z` };
}

test("ilk okuma her zaman geçerli sayılır (karşılaştıracak önceki yok)", () => {
  const out = flagAnomalies([reading("SEN-T01", 24, 0)]);
  assert.equal(out[0].qualityFlag, "gecerli");
});

test("büyük ani sıçrama şüpheli olarak işaretlenir (FR-213)", () => {
  const readings = [reading("SEN-T01", 24, 0), reading("SEN-T01", 55, 1), reading("SEN-T01", 25, 2)];
  const out = flagAnomalies(readings, 15);
  assert.equal(out[0].qualityFlag, "gecerli");
  assert.equal(out[1].qualityFlag, "supheli"); // 24 → 55 sıçraması
  assert.equal(out[2].qualityFlag, "gecerli"); // 55 baz alınmaz, önceki GEÇERLİ değerle kıyaslanır aslında bir sonraki karşılaştırma out[i-1] ile yapılır
});

test("küçük doğal değişim şüpheli sayılmaz", () => {
  const readings = [reading("SEN-T01", 24, 0), reading("SEN-T01", 26, 1), reading("SEN-T01", 25, 2)];
  const out = flagAnomalies(readings, 15);
  assert.ok(out.every((r) => r.qualityFlag === "gecerli"));
});

test("ALARM: tek anlık eşik ihlali (minConsecutive altında) alarmı TETİKLEMEZ", () => {
  const readings = [reading("SEN-T01", 20, 0), reading("SEN-T01", 32, 1), reading("SEN-T01", 20, 2)];
  const rule: AlertRule = { id: "r1", deviceId: "SEN-T01", comparator: ">", threshold: 30, minConsecutive: 2, label: "Yüksek sıcaklık" };
  const result = evaluateAlertRule(readings, rule);
  assert.equal(result.triggered, false);
  assert.equal(result.breachStreak, 1);
});

test("ALARM: ardışık N ihlal eşiği karşılanınca tetiklenir", () => {
  const readings = [reading("SEN-T01", 20, 0), reading("SEN-T01", 32, 1), reading("SEN-T01", 33, 2), reading("SEN-T01", 34, 3)];
  const rule: AlertRule = { id: "r1", deviceId: "SEN-T01", comparator: ">", threshold: 30, minConsecutive: 2, label: "Yüksek sıcaklık" };
  const result = evaluateAlertRule(readings, rule);
  assert.equal(result.triggered, true);
  assert.equal(result.breachStreak, 3);
});

test("ALARM: aykırı (şüpheli) tek okuma yanlış alarm ÜRETMEZ", () => {
  // 24 → 90 (şüpheli sıçrama, göz ardı edilir) → 25 (normal, eşiği aşmıyor)
  const readings = [reading("SEN-T01", 24, 0), reading("SEN-T01", 90, 1), reading("SEN-T01", 25, 2)];
  const rule: AlertRule = { id: "r1", deviceId: "SEN-T01", comparator: ">", threshold: 30, minConsecutive: 1, label: "Yüksek sıcaklık" };
  const result = evaluateAlertRule(readings, rule);
  assert.equal(result.triggered, false, "şüpheli okuma sayaca girmemeli");
  assert.equal(result.ignoredSuspiciousCount, 1);
});

test("ALARM: küçük (<) karşılaştırıcı doğru çalışır", () => {
  const readings = [reading("SEN-SM01", 15, 0), reading("SEN-SM01", 12, 1)];
  const rule: AlertRule = { id: "r2", deviceId: "SEN-SM01", comparator: "<", threshold: 20, minConsecutive: 2, label: "Düşük toprak nemi" };
  const result = evaluateAlertRule(readings, rule);
  assert.equal(result.triggered, true);
});

test("başka cihaza ait okumalar kuralı etkilemez", () => {
  const readings = [reading("SEN-T01", 50, 0), reading("SEN-H01", 50, 1)];
  const rule: AlertRule = { id: "r3", deviceId: "SEN-SM01", comparator: ">", threshold: 10, minConsecutive: 1, label: "test" };
  const result = evaluateAlertRule(readings, rule);
  assert.equal(result.triggered, false);
  assert.equal(result.lastValidValue, undefined);
});

test("örnek cihaz listesi (DEVICES) dolu ve tutarlı alanlar taşır", () => {
  assert.ok(DEVICES.length >= 3);
  for (const d of DEVICES) {
    assert.ok(d.batteryPct >= 0 && d.batteryPct <= 100);
    assert.ok(d.id.length > 0 && d.zone.length > 0);
  }
});
