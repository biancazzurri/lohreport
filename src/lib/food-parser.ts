import { lookupCache, cacheNutrition } from "./nutrition-cache";
import type { MealItem } from "./types";

interface ParsedItem {
  name: string;
  displayText: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function parseFood(text: string): Promise<MealItem[]> {
  // 1. Check cache first
  const cached = await lookupCache(text);
  if (cached) {
    return [
      {
        rawText: text,
        name: cached.name,
        quantity: cached.quantity,
        unit: cached.unit,
        calories: cached.calories,
        protein: cached.protein,
        carbs: cached.carbs,
        fat: cached.fat,
        parsed: true,
      },
    ];
  }

  // 2. Call server-side API route
  try {
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Parse failed: ${res.status}`);
    }

    const parsedItems: ParsedItem[] = await res.json();

    // 3. Cache each parsed item and build result
    const mealItems: MealItem[] = [];

    for (const item of parsedItems) {
      const displayText = item.displayText || `${item.quantity} ${item.unit} ${item.name}`;
      await cacheNutrition({
        key: displayText,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      });

      mealItems.push({
        rawText: displayText,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        parsed: true,
      });
    }

    return mealItems;
  } catch (err) {
    console.error("Food parsing failed:", err);
    throw err;
  }
}
