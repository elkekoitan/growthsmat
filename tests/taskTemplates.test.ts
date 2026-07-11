import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTaskSchedule, addDaysISO } from "../src/lib/taskTemplates.ts";
import { CROP_BY_ID } from "../src/data/crops.ts";

test("her şablon ekim görevi ile gün 0'da başlar", () => {
  const tasks = generateTaskSchedule(CROP_BY_ID["marul"]);
  assert.equal(tasks[0].kind, "ekim");
  assert.equal(tasks[0].dayOffset, 0);
});

test("her şablon hasat görevi ile biter, gün = daysToHarvest[0]", () => {
  const crop = CROP_BY_ID["cherry-domates-kompakt"];
  const tasks = generateTaskSchedule(crop);
  const last = tasks[tasks.length - 1];
  assert.equal(last.kind, "hasat");
  assert.equal(last.dayOffset, crop.daysToHarvest[0]);
});

test("hiçbir görev hasat üst sınırını (daysToHarvest[1]) aşmaz", () => {
  for (const cropId of Object.keys(CROP_BY_ID)) {
    const crop = CROP_BY_ID[cropId];
    const tasks = generateTaskSchedule(crop);
    for (const t of tasks) {
      assert.ok(t.dayOffset <= crop.daysToHarvest[1], `${cropId} → ${t.kind} gün ${t.dayOffset} sınırı aşıyor`);
    }
  }
});

test("yüksek su ihtiyacı (waterNeed=3) daha sık sulama üretir (düşük ihtiyaçtan fazla)", () => {
  const highWater = CROP_BY_ID["salatalik"]; // waterNeed: 3
  const lowWater = CROP_BY_ID["aromatik-kekik"]; // waterNeed: 1
  assert.equal(highWater.waterNeed, 3);
  assert.equal(lowWater.waterNeed, 1);
  const highTasks = generateTaskSchedule(highWater).filter((t) => t.kind === "sulama");
  const lowTasks = generateTaskSchedule(lowWater).filter((t) => t.kind === "sulama");
  const highRate = highTasks.length / highWater.daysToHarvest[0];
  const lowRate = lowTasks.length / lowWater.daysToHarvest[0];
  assert.ok(highRate > lowRate, "yüksek su ihtiyacında birim zamana düşen sulama daha sık olmalı");
});

test("careLoad=3 (yüksek bakım) ürünlerde budama görevi üretilir", () => {
  const highCare = CROP_BY_ID["sirik-domates-beefsteak"]; // careLoad: 3
  assert.equal(highCare.careLoad, 3);
  const tasks = generateTaskSchedule(highCare);
  assert.ok(tasks.some((t) => t.kind === "budama"));
});

test("careLoad=1 (düşük bakım) ürünlerde budama görevi üretilmez", () => {
  const lowCare = CROP_BY_ID["roka"]; // careLoad: 1
  assert.equal(lowCare.careLoad, 1);
  const tasks = generateTaskSchedule(lowCare);
  assert.ok(!tasks.some((t) => t.kind === "budama"));
});

test("görevler gün sırasına göre artan sırada döner", () => {
  const tasks = generateTaskSchedule(CROP_BY_ID["cherry-domates-kompakt"]);
  for (let i = 1; i < tasks.length; i++) {
    assert.ok(tasks[i].dayOffset >= tasks[i - 1].dayOffset);
  }
});

test("addDaysISO gün ofsetini doğru tarihe çevirir", () => {
  assert.equal(addDaysISO("2026-07-01", 10), "2026-07-11");
  assert.equal(addDaysISO("2026-07-25", 10), "2026-08-04"); // ay sınırını doğru geçer
  assert.equal(addDaysISO("2026-07-01", 0), "2026-07-01");
});
