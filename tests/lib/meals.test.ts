import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { addMeal, getMealsByDate, deleteMeal, updateMeal } from "@/lib/meals";

beforeEach(async () => {
  await db.meals.clear();
});

describe("addMeal", () => {
  it("creates a meal with computed totals from items", async () => {
    const meal = await addMeal({
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
        {
          rawText: "1 cup rice",
          name: "rice",
          quantity: 1,
          unit: "cup",
          calories: 200,
          protein: 4,
          carbs: 45,
          fat: 0.4,
          parsed: true,
        },
      ],
      date: "2026-04-04",
      time: "12:00",
    });

    expect(meal.id).toBeDefined();
    expect(meal.totalCalories).toBe(365);
    expect(meal.totalProtein).toBe(35);
    expect(meal.totalCarbs).toBe(45);
    expect(meal.totalFat).toBeCloseTo(4);

    const stored = await db.meals.get(meal.id);
    expect(stored).toBeDefined();
    expect(stored?.totalCalories).toBe(365);
  });

  it("auto-assigns date and time when not provided", async () => {
    const meal = await addMeal({ items: [] });
    expect(meal.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(meal.time).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("getMealsByDate", () => {
  it("returns meals sorted by time for a given date", async () => {
    await addMeal({ items: [], date: "2026-04-04", time: "18:00" });
    await addMeal({ items: [], date: "2026-04-04", time: "08:00" });
    await addMeal({ items: [], date: "2026-04-04", time: "12:00" });
    await addMeal({ items: [], date: "2026-04-05", time: "09:00" });

    const results = await getMealsByDate("2026-04-04");
    expect(results).toHaveLength(3);
    expect(results[0].time).toBe("08:00");
    expect(results[1].time).toBe("12:00");
    expect(results[2].time).toBe("18:00");
  });
});

describe("deleteMeal", () => {
  it("removes the meal by id", async () => {
    const meal = await addMeal({ items: [], date: "2026-04-04", time: "12:00" });
    await deleteMeal(meal.id);
    const stored = await db.meals.get(meal.id);
    expect(stored).toBeUndefined();
  });
});

describe("updateMeal", () => {
  it("updates items and recomputes totals", async () => {
    const meal = await addMeal({
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

    expect(meal.totalCalories).toBe(165);

    const updated = await updateMeal(meal.id, {
      items: [
        {
          rawText: "200g chicken",
          name: "chicken",
          quantity: 200,
          unit: "g",
          calories: 330,
          protein: 62,
          carbs: 0,
          fat: 7.2,
          parsed: true,
        },
      ],
    });

    expect(updated).toBeDefined();
    expect(updated?.totalCalories).toBe(330);
    expect(updated?.totalProtein).toBe(62);

    const stored = await db.meals.get(meal.id);
    expect(stored?.totalCalories).toBe(330);
  });
});
