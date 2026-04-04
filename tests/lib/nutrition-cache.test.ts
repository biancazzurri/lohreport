import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { cacheNutrition, lookupCache, getAllCachedFoods } from "@/lib/nutrition-cache";

beforeEach(async () => {
  await db.nutritionCache.clear();
});

describe("cacheNutrition", () => {
  it("stores an entry with a cachedAt timestamp", async () => {
    const before = Date.now();
    await cacheNutrition({
      key: "chicken-100g",
      name: "chicken",
      quantity: 100,
      unit: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    });
    const after = Date.now();

    const stored = await db.nutritionCache.get("chicken-100g");
    expect(stored).toBeDefined();
    expect(stored?.cachedAt).toBeGreaterThanOrEqual(before);
    expect(stored?.cachedAt).toBeLessThanOrEqual(after);
  });
});

describe("lookupCache", () => {
  it("returns the entry on an exact key match", async () => {
    await cacheNutrition({
      key: "oats-50g",
      name: "oats",
      quantity: 50,
      unit: "g",
      calories: 190,
      protein: 6,
      carbs: 34,
      fat: 3,
    });

    const result = await lookupCache("oats-50g");
    expect(result).toBeDefined();
    expect(result?.name).toBe("oats");
    expect(result?.calories).toBe(190);
  });

  it("returns null on a cache miss", async () => {
    const result = await lookupCache("nonexistent-key");
    expect(result).toBeNull();
  });
});
