import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/lib/db";
import { addMeal } from "@/lib/meals";
import { getShortcuts } from "@/lib/shortcuts";

const CHICKEN_ITEM = {
  rawText: "100g chicken",
  name: "chicken",
  quantity: 100,
  unit: "g",
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  parsed: true,
};

const RICE_ITEM = {
  rawText: "1 cup rice",
  name: "rice",
  quantity: 1,
  unit: "cup",
  calories: 200,
  protein: 4,
  carbs: 45,
  fat: 0.4,
  parsed: true,
};

beforeEach(async () => {
  await db.meals.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-04-04T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getShortcuts", () => {
  it("returns recent meals as shortcuts", async () => {
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-04", time: "12:00" });

    const shortcuts = await getShortcuts();

    expect(shortcuts).toHaveLength(1);
    expect(shortcuts[0].items).toEqual([CHICKEN_ITEM]);
    expect(shortcuts[0].count).toBe(1);
    expect(shortcuts[0].totalCalories).toBe(165);
    expect(shortcuts[0].totalProtein).toBe(31);
    expect(shortcuts[0].totalCarbs).toBe(0);
    expect(shortcuts[0].totalFat).toBeCloseTo(3.6);
    expect(shortcuts[0].fingerprint).toBeDefined();
  });

  it("deduplicates identical meals and counts correctly", async () => {
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-02", time: "12:00" });
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-03", time: "12:00" });
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-04", time: "12:00" });

    const shortcuts = await getShortcuts();

    expect(shortcuts).toHaveLength(1);
    expect(shortcuts[0].count).toBe(3);
  });

  it("ranks frequent meals higher than less frequent meals", async () => {
    // CHICKEN_ITEM meal added 3 times
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-02", time: "08:00" });
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-03", time: "08:00" });
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-04", time: "08:00" });

    // RICE_ITEM meal added once
    await addMeal({ items: [RICE_ITEM], date: "2026-04-04", time: "12:00" });

    const shortcuts = await getShortcuts();

    expect(shortcuts).toHaveLength(2);
    expect(shortcuts[0].count).toBe(3);
    expect(shortcuts[0].totalCalories).toBe(165); // chicken
    expect(shortcuts[1].count).toBe(1);
    expect(shortcuts[1].totalCalories).toBe(200); // rice
  });

  it("excludes meals older than 7 days", async () => {
    const now = new Date("2026-04-04T12:00:00Z").getTime();
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

    // Insert old meal directly with a createdAt 8 days ago
    await db.meals.put({
      id: "old-meal",
      date: "2026-03-27",
      time: "12:00",
      items: [CHICKEN_ITEM],
      totalCalories: 165,
      totalProtein: 31,
      totalCarbs: 0,
      totalFat: 3.6,
      createdAt: eightDaysAgo,
    });

    // Meal today — should be included
    await addMeal({ items: [RICE_ITEM], date: "2026-04-04", time: "12:00" });

    const shortcuts = await getShortcuts();

    expect(shortcuts).toHaveLength(1);
    expect(shortcuts[0].totalCalories).toBe(200); // rice only
  });

  it("returns at most 10 shortcuts", async () => {
    // Add 12 distinct meals
    for (let i = 0; i < 12; i++) {
      await addMeal({
        items: [
          {
            rawText: `item${i}`,
            name: `food${i}`,
            quantity: i + 1,
            unit: "g",
            calories: 100 + i,
            protein: 10,
            carbs: 10,
            fat: 5,
            parsed: true,
          },
        ],
        date: "2026-04-04",
        time: `${String(i).padStart(2, "0")}:00`,
      });
    }

    const shortcuts = await getShortcuts();

    expect(shortcuts.length).toBeLessThanOrEqual(10);
  });

  it("breaks ties by recency (lastUsed desc)", async () => {
    // Two meals each added once; rice is more recent
    await addMeal({ items: [CHICKEN_ITEM], date: "2026-04-02", time: "12:00" });
    await addMeal({ items: [RICE_ITEM], date: "2026-04-04", time: "12:00" });

    const shortcuts = await getShortcuts();

    expect(shortcuts).toHaveLength(2);
    // rice is more recent so it should come first when counts tie
    expect(shortcuts[0].totalCalories).toBe(200); // rice
    expect(shortcuts[1].totalCalories).toBe(165); // chicken
  });
});
