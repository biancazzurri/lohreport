import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { exportData, importData } from "@/lib/backup";
import { addMeal } from "@/lib/meals";
import { cacheNutrition } from "@/lib/nutrition-cache";
import { saveSettings } from "@/lib/settings";

beforeEach(async () => {
  await db.meals.clear();
  await db.nutritionCache.clear();
  await db.settings.clear();
});

describe("exportData", () => {
  it("exports all meals, nutritionCache, and settings as JSON", async () => {
    await addMeal({
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
      date: "2026-04-04",
      time: "12:00",
    });

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

    await saveSettings({ calorieGoal: 2500, chatgptApiKey: "sk-test" });

    const data = await exportData();

    expect(data).toHaveProperty("meals");
    expect(data).toHaveProperty("nutritionCache");
    expect(data).toHaveProperty("settings");

    expect(data.meals).toHaveLength(1);
    expect(data.meals[0].totalCalories).toBe(165);

    expect(data.nutritionCache).toHaveLength(1);
    expect(data.nutritionCache[0].key).toBe("chicken-100g");

    expect(data.settings).toHaveLength(1);
    expect(data.settings[0].calorieGoal).toBe(2500);
  });

  it("exports empty arrays when no data exists", async () => {
    const data = await exportData();

    expect(data.meals).toEqual([]);
    expect(data.nutritionCache).toEqual([]);
    expect(data.settings).toEqual([]);
  });
});

describe("importData", () => {
  it("replaces all local data with the imported JSON", async () => {
    // Seed some initial data that should be replaced
    await addMeal({ items: [], date: "2026-01-01", time: "08:00" });
    await cacheNutrition({
      key: "old-key",
      name: "old",
      quantity: 1,
      unit: "g",
      calories: 1,
      protein: 0,
      carbs: 0,
      fat: 0,
    });

    const backupData = {
      meals: [
        {
          id: "imported-meal-1",
          date: "2026-04-04",
          time: "12:00",
          items: [],
          totalCalories: 500,
          totalProtein: 40,
          totalCarbs: 50,
          totalFat: 10,
          createdAt: Date.now(),
        },
      ],
      nutritionCache: [
        {
          key: "new-cache-key",
          name: "new food",
          quantity: 100,
          unit: "g",
          calories: 300,
          protein: 20,
          carbs: 40,
          fat: 8,
          cachedAt: Date.now(),
        },
      ],
      settings: [
        {
          id: "settings",
          calorieGoal: 1800,
          proteinGoal: 120,
          carbsGoal: 200,
          fatGoal: 60,
          chatgptApiKey: "imported-key",
        },
      ],
    };

    await importData(backupData);

    const meals = await db.meals.toArray();
    expect(meals).toHaveLength(1);
    expect(meals[0].id).toBe("imported-meal-1");
    expect(meals[0].totalCalories).toBe(500);

    const cache = await db.nutritionCache.toArray();
    expect(cache).toHaveLength(1);
    expect(cache[0].key).toBe("new-cache-key");

    const settings = await db.settings.toArray();
    expect(settings).toHaveLength(1);
    expect(settings[0].calorieGoal).toBe(1800);
    expect(settings[0].chatgptApiKey).toBe("imported-key");
  });

  it("clears all data when importing empty arrays", async () => {
    await addMeal({ items: [], date: "2026-04-04", time: "10:00" });

    await importData({ meals: [], nutritionCache: [], settings: [] });

    const meals = await db.meals.toArray();
    expect(meals).toHaveLength(0);
  });
});
