import { addMeal } from "./meals";
import type { MealItem } from "./types";

export interface SuggestionItem {
  name: string;
  displayText: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Suggestion {
  name: string;
  items: SuggestionItem[];
}

export interface RemainingMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function suggestMeals(remaining: RemainingMacros): Promise<Suggestion[]> {
  const res = await fetch("/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remaining }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Suggest failed: ${res.status}`);
  }

  return res.json();
}

export async function logSuggestion(suggestion: Suggestion, date: string): Promise<void> {
  const items: MealItem[] = suggestion.items.map((item) => ({
    rawText: item.displayText,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    parsed: true,
  }));

  await addMeal({ items, date });
}
