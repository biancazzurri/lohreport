import Dexie, { type Table } from "dexie";
import type { Meal, NutritionCacheEntry, Settings } from "./types";

export interface DismissedShortcut {
  fingerprint: string;
  dismissedAt: number;
}

export class HealthDB extends Dexie {
  meals!: Table<Meal, string>;
  nutritionCache!: Table<NutritionCacheEntry, string>;
  settings!: Table<Settings, string>;
  dismissedShortcuts!: Table<DismissedShortcut, string>;

  constructor() {
    super("HealthDB");

    this.version(1).stores({
      meals: "id, date, createdAt",
      nutritionCache: "key",
      settings: "id",
    });

    this.version(2).stores({
      meals: "id, date, createdAt",
      nutritionCache: "key",
      settings: "id",
      dismissedShortcuts: "fingerprint",
    });
  }
}

export const db = new HealthDB();
