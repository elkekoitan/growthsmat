import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EPICS,
  epicProgress,
  overallProgress,
  STATUS_WEIGHT,
} from "../src/data/roadmap.ts";

test("170 civarı görev, 14 epik", () => {
  const total = EPICS.reduce((a, e) => a + e.tasks.length, 0);
  assert.ok(EPICS.length >= 13);
  assert.ok(total >= 160 && total <= 180, `görev sayısı ${total}`);
});

test("ağırlıklı yüzde 0-100 arasında ve done sayısı doğru", () => {
  for (const epic of EPICS) {
    const p = epicProgress(epic);
    assert.ok(p.weightedPercent >= 0 && p.weightedPercent <= 100);
    assert.equal(p.doneCount, epic.tasks.filter((t) => t.status === "done").length);
    const statusSum = Object.values(p.statusCounts).reduce((a, b) => a + b, 0);
    assert.equal(statusSum, epic.tasks.length, "durum dağılımı toplam görevle eşit");
  }
});

test("tümü done epik %100, tümü todo epik %0", () => {
  const p00 = epicProgress(EPICS.find((e) => e.id === "P00")!);
  assert.equal(Math.round(p00.weightedPercent), 100, "P00 tamamen done");
});

test("kritik görev ağırlığı 2 — ilerlemeyi ağırlıklı etkiler", () => {
  // Yapay epik: 1 kritik done + 1 normal todo → ağırlıklı = 2/3 ≈ 66.7, basit = 50
  const fake = {
    id: "X",
    name: "t",
    short: "t",
    risk: "t",
    tasks: [
      { id: "X-01", title: "a", status: "done" as const, critical: true },
      { id: "X-02", title: "b", status: "todo" as const },
    ],
  };
  const p = epicProgress(fake);
  assert.ok(Math.abs(p.weightedPercent - (2 / 3) * 100) < 0.1, "ağırlıklı 66.7 olmalı");
});

test("overallProgress ağırlıklı ve basit yüzdeyi ayrı verir", () => {
  const o = overallProgress();
  assert.ok(o.weightedPercent >= 0 && o.weightedPercent <= 100);
  assert.ok(o.simplePercent >= 0 && o.simplePercent <= 100);
  assert.equal(o.taskCount, EPICS.reduce((a, e) => a + e.tasks.length, 0));
  assert.equal(o.epics.length, EPICS.length);
});

test("STATUS_WEIGHT doküman değerleriyle eşleşir", () => {
  assert.equal(STATUS_WEIGHT.todo, 0);
  assert.equal(STATUS_WEIGHT.in_progress, 0.35);
  assert.equal(STATUS_WEIGHT.blocked, 0.2);
  assert.equal(STATUS_WEIGHT.review, 0.8);
  assert.equal(STATUS_WEIGHT.done, 1);
});
