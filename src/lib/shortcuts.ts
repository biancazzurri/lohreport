import { db } from "./db";
import type { MealItem } from "./types";

export interface Shortcut {
  fingerprint: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  count: number;
  lastUsed: number;
}

function fingerprintItems(items: MealItem[]): string {
  return [...items]
    .map((i) => i.rawText)
    .sort()
    .join("|");
}

export async function getShortcuts(): Promise<Shortcut[]> {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recentMeals = await db.meals
    .where("createdAt")
    .above(sevenDaysAgo)
    .toArray();

  const groupMap = new Map<
    string,
    { items: MealItem[]; count: number; lastUsed: number }
  >();

  for (const meal of recentMeals) {
    const fp = fingerprintItems(meal.items);
    const existing = groupMap.get(fp);
    if (existing) {
      existing.count += 1;
      if (meal.createdAt > existing.lastUsed) {
        existing.lastUsed = meal.createdAt;
      }
    } else {
      groupMap.set(fp, {
        items: meal.items,
        count: 1,
        lastUsed: meal.createdAt,
      });
    }
  }

  const shortcuts: Shortcut[] = Array.from(groupMap.entries()).map(
    ([fingerprint, { items, count, lastUsed }]) => {
      const totalCalories = items.reduce((s, i) => s + i.calories, 0);
      const totalProtein = items.reduce((s, i) => s + i.protein, 0);
      const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
      const totalFat = items.reduce((s, i) => s + i.fat, 0);
      return {
        fingerprint,
        items,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        count,
        lastUsed,
      };
    }
  );

  // Filter out dismissed shortcuts
  const dismissed = await db.dismissedShortcuts.toArray();
  const dismissedSet = new Set(dismissed.map((d) => d.fingerprint));
  const filtered = shortcuts.filter((s) => !dismissedSet.has(s.fingerprint));

  filtered.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastUsed - a.lastUsed;
  });

  return filtered.slice(0, 10);
}

export async function dismissShortcut(fingerprint: string): Promise<void> {
  await db.dismissedShortcuts.put({ fingerprint, dismissedAt: Date.now() });
}
