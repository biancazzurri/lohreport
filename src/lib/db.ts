import Dexie, { type Table } from "dexie";
import type { Meal, NutritionCacheEntry, Settings, TrainingSession } from "./types";

export interface DismissedShortcut {
  fingerprint: string;
  dismissedAt: number;
}

export class HealthDB extends Dexie {
  meals!: Table<Meal, string>;
  nutritionCache!: Table<NutritionCacheEntry, string>;
  settings!: Table<Settings, string>;
  dismissedShortcuts!: Table<DismissedShortcut, string>;
  trainingSessions!: Table<TrainingSession, string>;

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

    this.version(3).stores({
      meals: "id, date, createdAt",
      nutritionCache: "key",
      settings: "id",
      dismissedShortcuts: "fingerprint",
      trainingSessions: "id, date, createdAt",
    });
  }
}

export const db = new HealthDB();
