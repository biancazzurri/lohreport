import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import type { Meal, MealItem } from "./types";

interface Totals {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export function computeTotals(items: MealItem[]): Totals {
  return items.reduce(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProtein: acc.totalProtein + item.protein,
      totalCarbs: acc.totalCarbs + item.carbs,
      totalFat: acc.totalFat + item.fat,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function addMeal({
  items,
  date,
  time,
}: {
  items: MealItem[];
  date?: string;
  time?: string;
}): Promise<Meal> {
  const meal: Meal = {
    id: uuidv4(),
    date: date ?? todayDate(),
    time: time ?? currentTime(),
    items,
    ...computeTotals(items),
    createdAt: Date.now(),
  };

  await db.meals.put(meal);
  return meal;
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const meals = await db.meals.where("date").equals(date).toArray();
  return meals.sort((a, b) => a.time.localeCompare(b.time));
}

export async function deleteMeal(id: string): Promise<void> {
  await db.meals.delete(id);
}

export async function updateMeal(
  id: string,
  updates: { items?: MealItem[] }
): Promise<Meal | undefined> {
  const existing = await db.meals.get(id);
  if (!existing) return undefined;

  const newItems = updates.items ?? existing.items;
  const updated: Meal = {
    ...existing,
    items: newItems,
    ...computeTotals(newItems),
  };

  await db.meals.put(updated);
  return updated;
}
