import { db } from "./db";
import type { NutritionCacheEntry } from "./types";

type NutritionInput = Omit<NutritionCacheEntry, "cachedAt">;

export async function cacheNutrition(entry: NutritionInput): Promise<void> {
  await db.nutritionCache.put({ ...entry, cachedAt: Date.now() });
}

export async function lookupCache(key: string): Promise<NutritionCacheEntry | null> {
  const entry = await db.nutritionCache.get(key);
  return entry ?? null;
}

export async function getAllCachedFoods(): Promise<NutritionCacheEntry[]> {
  return db.nutritionCache.toArray();
}
