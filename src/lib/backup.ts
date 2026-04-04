import { db } from "./db";
import type { Meal, NutritionCacheEntry, Settings } from "./types";

interface BackupData {
  meals: Meal[];
  nutritionCache: NutritionCacheEntry[];
  settings: Settings[];
}

export async function exportData(): Promise<BackupData> {
  const [meals, nutritionCache, settings] = await Promise.all([
    db.meals.toArray(),
    db.nutritionCache.toArray(),
    db.settings.toArray(),
  ]);
  return { meals, nutritionCache, settings };
}

export async function importData(data: BackupData): Promise<void> {
  await db.transaction("rw", [db.meals, db.nutritionCache, db.settings], async () => {
    await db.meals.clear();
    await db.nutritionCache.clear();
    await db.settings.clear();

    if (data.meals?.length) await db.meals.bulkAdd(data.meals);
    if (data.nutritionCache?.length) await db.nutritionCache.bulkAdd(data.nutritionCache);
    if (data.settings?.length) await db.settings.bulkAdd(data.settings);
  });
}

async function uploadBackup(): Promise<void> {
  const data = await exportData();
  const res = await fetch("/api/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) console.error("Backup failed:", res.status);
}

export async function downloadBackup(): Promise<BackupData> {
  const res = await fetch("/api/backup");
  if (!res.ok) throw new Error("No backup found");
  return res.json();
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleBackup(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    uploadBackup().catch(console.error);
  }, 5000);
}
