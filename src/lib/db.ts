import Dexie, { type Table } from "dexie";
import type { Meal, NutritionCacheEntry, Settings } from "./types";

export class HealthDB extends Dexie {
  meals!: Table<Meal, string>;
  nutritionCache!: Table<NutritionCacheEntry, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("HealthDB");

    this.version(1).stores({
      meals: "id, date, createdAt",
      nutritionCache: "key",
      settings: "id",
    });
  }
}

export const db = new HealthDB();
