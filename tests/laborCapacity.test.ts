import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estimateTaskMinutes,
  computeLaborCapacity,
  suggestRebalance,
  BASE_TASK_MINUTES,
  AREA_MINUTES_PER_M2,
  type CropPlanEntry,
} from "../src/lib/laborCapacity.ts";
import type { ScheduledTask } from "../src/lib/taskTemplates.ts";

test("estimateTaskMinutes: temel + alan*katsayı formülüne uyar", () => {
  const minutes = estimateTaskMinutes("sulama", 10);
  assert.equal(minutes, Math.round(BASE_TASK_MINUTES.sulama + AREA_MINUTES_PER_M2.sulama * 10));
});

test("estimateTaskMinutes: negatif alan güvenli sıfırlanır (temel süreden az olmaz)", () => {
  const minutes = estimateTaskMinutes("hasat", -5);
  assert.equal(minutes, BASE_TASK_MINUTES.hasat);
});

test("computeLaborCapacity: tek ürün, tek haftaya düşen görevler doğru toplanır", () => {
  const schedule: ScheduledTask[] = [
    { kind: "ekim", dayOffset: 0, title: "ekim" },
    { kind: "sulama", dayOffset: 2, title: "sulama" },
    { kind: "sulama", dayOffset: 4, title: "sulama" },
  ];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 2, schedule }];
  const result = computeLaborCapacity(plan, 999);
  assert.equal(result.weeks.length, 1);
  assert.equal(result.weeks[0].weekIndex, 0);
  const expected = estimateTaskMinutes("ekim", 2) + 2 * estimateTaskMinutes("sulama", 2);
  assert.equal(result.weeks[0].totalMinutes, expected);
});

test("computeLaborCapacity: dayOffset 7'ye bölünerek doğru haftaya düşer", () => {
  const schedule: ScheduledTask[] = [
    { kind: "ekim", dayOffset: 0, title: "ekim" }, // hafta 0
    { kind: "sulama", dayOffset: 7, title: "sulama" }, // hafta 1
    { kind: "sulama", dayOffset: 13, title: "sulama" }, // hafta 1
    { kind: "hasat", dayOffset: 14, title: "hasat" }, // hafta 2
  ];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 1, schedule }];
  const result = computeLaborCapacity(plan, 999);
  assert.deepEqual(result.weeks.map((w) => w.weekIndex), [0, 1, 2]);
  assert.equal(result.weeks[1].taskCount, 2);
});

test("computeLaborCapacity: plantingOffsetDays succession-planting görevleri doğru haftaya kaydırır", () => {
  const schedule: ScheduledTask[] = [{ kind: "sulama", dayOffset: 0, title: "sulama" }];
  const plan: CropPlanEntry[] = [{ cropId: "marul", areaM2: 1, schedule, plantingOffsetDays: 10 }];
  const result = computeLaborCapacity(plan, 999);
  assert.equal(result.weeks[0].weekIndex, Math.floor(10 / 7));
});

test("computeLaborCapacity: aynı haftada birden fazla ürün ayrı ayrı gruplanır ve toplanır", () => {
  const schedA: ScheduledTask[] = [{ kind: "sulama", dayOffset: 1, title: "a" }];
  const schedB: ScheduledTask[] = [{ kind: "gozlem", dayOffset: 2, title: "b" }];
  const plan: CropPlanEntry[] = [
    { cropId: "domates", areaM2: 3, schedule: schedA },
    { cropId: "biber", areaM2: 1, schedule: schedB },
  ];
  const result = computeLaborCapacity(plan, 999);
  assert.equal(result.weeks.length, 1);
  assert.equal(result.weeks[0].tasksByCrop.length, 2);
  const expected = estimateTaskMinutes("sulama", 3) + estimateTaskMinutes("gozlem", 1);
  assert.equal(result.weeks[0].totalMinutes, expected);
});

test("computeLaborCapacity: bütçeyi aşan haftalar overloadedWeeks'te işaretlenir, feasible=false", () => {
  const schedule: ScheduledTask[] = [{ kind: "ekim", dayOffset: 0, title: "ekim" }];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 100, schedule }];
  const result = computeLaborCapacity(plan, 10); // büyük alan, çok düşük bütçe
  assert.equal(result.feasible, false);
  assert.equal(result.overloadedWeeks.length, 1);
  assert.equal(result.overloadedWeeks[0].weekIndex, 0);
});

test("computeLaborCapacity: aşım yoksa feasible=true, overloadedWeeks boş", () => {
  const schedule: ScheduledTask[] = [{ kind: "sulama", dayOffset: 0, title: "sulama" }];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 1, schedule }];
  const result = computeLaborCapacity(plan, 999);
  assert.equal(result.feasible, true);
  assert.equal(result.overloadedWeeks.length, 0);
});

test("computeLaborCapacity: peakWeek en yüksek yüklü haftayı doğru bulur", () => {
  const schedule: ScheduledTask[] = [
    { kind: "sulama", dayOffset: 0, title: "a" }, // hafta 0, az
    { kind: "hasat", dayOffset: 7, title: "b" }, // hafta 1, çok
    { kind: "hasat", dayOffset: 8, title: "c" }, // hafta 1, çok
  ];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 5, schedule }];
  const result = computeLaborCapacity(plan, 999);
  assert.equal(result.peakWeek?.weekIndex, 1);
});

test("computeLaborCapacity: boş plan → feasible true, hafta yok", () => {
  const result = computeLaborCapacity([], 100);
  assert.equal(result.feasible, true);
  assert.equal(result.weeks.length, 0);
  assert.equal(result.peakWeek, null);
});

test("suggestRebalance: feasible ise undefined döner (sahte öneri yok)", () => {
  const schedule: ScheduledTask[] = [{ kind: "sulama", dayOffset: 0, title: "a" }];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 1, schedule }];
  const result = computeLaborCapacity(plan, 999);
  assert.equal(suggestRebalance(result), undefined);
});

test("suggestRebalance: esnek görev (sulama) varsa kaydırma önerir", () => {
  const schedule: ScheduledTask[] = [{ kind: "sulama", dayOffset: 0, title: "a" }];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 200, schedule }];
  const result = computeLaborCapacity(plan, 5);
  const msg = suggestRebalance(result);
  assert.ok(msg && /kaydırmayı dene/.test(msg));
});

test("suggestRebalance: yalnız ertelenemez görev (ekim) varsa süre/alan önerisi verir, kaydırma önermez", () => {
  const schedule: ScheduledTask[] = [{ kind: "ekim", dayOffset: 0, title: "a" }];
  const plan: CropPlanEntry[] = [{ cropId: "domates", areaM2: 200, schedule }];
  const result = computeLaborCapacity(plan, 5);
  const msg = suggestRebalance(result);
  assert.ok(msg && /ertelenemez/.test(msg));
  assert.ok(!/kaydırmayı dene/.test(msg ?? ""));
});
