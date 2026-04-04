import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import type { Meal, NutritionCacheEntry, Settings } from "@/lib/types";

beforeEach(async () => {
  await db.meals.clear();
  await db.nutritionCache.clear();
  await db.settings.clear();
});

describe("meals store", () => {
  it("stores and retrieves a meal", async () => {
    const meal: Meal = {
      id: "meal-1",
      date: "2026-04-04",
      time: "12:00",
      items: [
        {
          rawText: "100g chicken",
          name: "chicken",
          quantity: 100,
          unit: "g",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          parsed: true,
        },
      ],
      totalCalories: 165,
      totalProtein: 31,
      totalCarbs: 0,
      totalFat: 3.6,
      createdAt: Date.now(),
    };

    await db.meals.put(meal);
    const retrieved = await db.meals.get("meal-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("meal-1");
    expect(retrieved?.totalCalories).toBe(165);
    expect(retrieved?.items).toHaveLength(1);
  });

  it("queries meals by date", async () => {
    const base = {
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      createdAt: Date.now(),
    };

    await db.meals.bulkPut([
      { ...base, id: "m1", date: "2026-04-04", time: "08:00" },
      { ...base, id: "m2", date: "2026-04-04", time: "12:00" },
      { ...base, id: "m3", date: "2026-04-05", time: "08:00" },
    ]);

    const results = await db.meals.where("date").equals("2026-04-04").toArray();
    expect(results).toHaveLength(2);
    expect(results.map((m) => m.id)).toContain("m1");
    expect(results.map((m) => m.id)).toContain("m2");
  });
});

describe("nutritionCache store", () => {
  it("stores and retrieves a nutrition cache entry", async () => {
    const entry: NutritionCacheEntry = {
      key: "chicken-100g",
      name: "chicken",
      quantity: 100,
      unit: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      cachedAt: Date.now(),
    };

    await db.nutritionCache.put(entry);
    const retrieved = await db.nutritionCache.get("chicken-100g");
    expect(retrieved).toBeDefined();
    expect(retrieved?.key).toBe("chicken-100g");
    expect(retrieved?.calories).toBe(165);
  });
});

describe("settings store", () => {
  it("stores and retrieves settings", async () => {
    const settings: Settings = {
      id: "settings",
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 200,
      fatGoal: 65,
      chatgptApiKey: "sk-test",
    };

    await db.settings.put(settings);
    const retrieved = await db.settings.get("settings");
    expect(retrieved).toBeDefined();
    expect(retrieved?.calorieGoal).toBe(2000);
    expect(retrieved?.chatgptApiKey).toBe("sk-test");
  });
});
