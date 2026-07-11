import { test } from "node:test";
import assert from "node:assert/strict";
import { effectiveCapacity, planBackwards, type RoomProfile, type Subscription } from "../src/lib/microCapacity.ts";
import { MICROGREEN_RECIPES } from "../src/data/microgreens.ts";

const ROOM: RoomProfile = { shelves: 4, levelsPerShelf: 5, traysPerLevel: 4, airflowFactor: 0.8 };

test("airflowFactor kapasiteyi düşürür (yalnız fiziksel sığma değil)", () => {
  const full = effectiveCapacity({ ...ROOM, airflowFactor: 1 }); // 80
  const limited = effectiveCapacity(ROOM); // 80 * 0.8 = 64
  assert.equal(full, 80);
  assert.equal(limited, 64);
  assert.ok(limited < full);
});

test("geriye planlama ekim gününü temkinli hasat gününe (harvestDays[1]) göre hesaplar", () => {
  const recipe = MICROGREEN_RECIPES[0];
  const subs: Subscription[] = [{ recipeId: recipe.id, traysPerWeek: 10, deliveryDay: 3 }];
  const plan = planBackwards(subs, ROOM);
  assert.equal(plan.slots[0].plantOffsetDays, recipe.harvestDays[1]);
});

test("kapasite yeterliyse tüm abonelikler feasible", () => {
  const subs: Subscription[] = [
    { recipeId: MICROGREEN_RECIPES[0].id, traysPerWeek: 20, deliveryDay: 1 },
    { recipeId: MICROGREEN_RECIPES[1].id, traysPerWeek: 20, deliveryDay: 4 },
  ];
  const plan = planBackwards(subs, ROOM); // kapasite 64, toplam 40
  assert.equal(plan.feasible, true);
  assert.equal(plan.overflowTrays, 0);
  assert.equal(plan.slots.length, 2);
});

test("kapasite aşımında feasible=false + overflow doğru + alternatif öneri", () => {
  const subs: Subscription[] = [{ recipeId: MICROGREEN_RECIPES[0].id, traysPerWeek: 100, deliveryDay: 2 }];
  const plan = planBackwards(subs, ROOM); // kapasite 64, toplam 100
  assert.equal(plan.feasible, false);
  assert.equal(plan.overflowTrays, 36);
  assert.ok(plan.suggestion && /alternatif/i.test(plan.suggestion));
});

test("0 abonelik boş ama feasible plan döner", () => {
  const plan = planBackwards([], ROOM);
  assert.equal(plan.feasible, true);
  assert.equal(plan.slots.length, 0);
  assert.equal(plan.totalTraysPerWeek, 0);
});

test("bilinmeyen recipeId güvenli atlanır", () => {
  const subs: Subscription[] = [
    { recipeId: "olmayan-recete", traysPerWeek: 10, deliveryDay: 1 },
    { recipeId: MICROGREEN_RECIPES[0].id, traysPerWeek: 10, deliveryDay: 2 },
  ];
  const plan = planBackwards(subs, ROOM);
  assert.equal(plan.slots.length, 1); // yalnız geçerli reçete
  assert.equal(plan.totalTraysPerWeek, 10);
});

test("effectiveCapacity aşağı yuvarlar (kısmi tepsi sayılmaz)", () => {
  const cap = effectiveCapacity({ shelves: 3, levelsPerShelf: 3, traysPerLevel: 3, airflowFactor: 0.7 }); // 27*0.7=18.9 → 18
  assert.equal(cap, 18);
});

test("airflowFactor 0-1 dışına taşarsa güvenli sınırlanır", () => {
  const over = effectiveCapacity({ ...ROOM, airflowFactor: 2 });
  const under = effectiveCapacity({ ...ROOM, airflowFactor: -1 });
  assert.equal(over, 80); // 1'e sabitlenir
  assert.equal(under, 0);
});
