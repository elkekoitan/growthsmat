// SmartGrowth OS — Mikro filiz oda/raf kapasite + restoran aboneliğinden geriye ekim
// (PRD FR-111, FR-121; US-04/US-05). Kapasite yalnız tepsi sığmasına göre DEĞİL, hava
// akımı/iş akışı kısıtıyla hesaplanır. Kapasite aşımında satış sözü yerine alternatif hafta.

import { MICROGREEN_RECIPES, type MicrogreenRecipe } from "@/data/microgreens";

export interface RoomProfile {
  shelves: number;
  levelsPerShelf: number;
  traysPerLevel: number;
  airflowFactor: number; // 0-1, hava akımı/iş akışı kısıtı
}

/** Fiziksel tepsi kapasitesi × hava akımı faktörü (aşağı yuvarlanır). */
export function effectiveCapacity(room: RoomProfile): number {
  const physical = room.shelves * room.levelsPerShelf * room.traysPerLevel;
  return Math.floor(physical * clamp01(room.airflowFactor));
}

export interface Subscription {
  recipeId: string;
  traysPerWeek: number;
  deliveryDay: number; // 0-6 (haftanın günü)
}

export interface PlantingSlot {
  recipeId: string;
  recipeName: string;
  traysPerWeek: number;
  deliveryDay: number;
  plantOffsetDays: number; // teslimat gününden kaç gün ÖNCE ekilmeli
  harvestDays: number; // kullanılan temkinli hasat günü
}

export interface CapacityPlan {
  feasible: boolean;
  totalTraysPerWeek: number;
  capacity: number;
  overflowTrays: number;
  slots: PlantingSlot[];
  suggestion?: string;
}

/**
 * Restoran aboneliklerinden geriye ekim çizelgesi. Her teslimat için reçetenin temkinli
 * hasat günü (harvestDays[1]) kadar geriye giderek ekim günü belirlenir. Haftalık toplam
 * tepsi kapasiteyi aşarsa feasible=false + alternatif öneri.
 */
export function planBackwards(
  subscriptions: Subscription[],
  room: RoomProfile,
  recipes: MicrogreenRecipe[] = MICROGREEN_RECIPES
): CapacityPlan {
  const capacity = effectiveCapacity(room);
  const slots: PlantingSlot[] = [];
  let totalTraysPerWeek = 0;

  for (const sub of subscriptions) {
    const recipe = recipes.find((r) => r.id === sub.recipeId);
    if (!recipe) continue; // bilinmeyen reçete güvenli atlanır
    const harvestDays = recipe.harvestDays[1]; // temkinli üst sınır
    totalTraysPerWeek += sub.traysPerWeek;
    slots.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      traysPerWeek: sub.traysPerWeek,
      deliveryDay: sub.deliveryDay,
      plantOffsetDays: harvestDays,
      harvestDays,
    });
  }

  const overflowTrays = Math.max(0, totalTraysPerWeek - capacity);
  const feasible = overflowTrays === 0;

  return {
    feasible,
    totalTraysPerWeek,
    capacity,
    overflowTrays,
    slots,
    suggestion: feasible
      ? undefined
      : `Kapasite ${overflowTrays} tepsi aşılıyor — ${overflowTrays} tepsiyi alternatif teslim haftasına kaydır veya kapasiteyi artır.`,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
