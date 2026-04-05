import { db } from "./db";
import type { Meal, Settings } from "./types";

export async function syncFromServer(): Promise<void> {
  try {
    // Fetch last 10 days of meals from server
    const since = new Date();
    since.setDate(since.getDate() - 10);
    const sinceStr = since.toISOString().slice(0, 10);
    const mealsRes = await fetch(`/api/meals?since=${sinceStr}`);
    if (!mealsRes.ok) return;
    const serverMeals: Meal[] = await mealsRes.json();

    // Fetch settings from server
    const settingsRes = await fetch("/api/backup");
    const serverSettings = settingsRes.ok ? await settingsRes.json() : null;

    // Merge meals: server wins for conflicts (by id)
    const localMeals = await db.meals.toArray();
    const localIds = new Set(localMeals.map((m) => m.id));

    for (const meal of serverMeals) {
      if (localIds.has(meal.id)) {
        await db.meals.put(meal); // server version overwrites
      } else {
        await db.meals.add(meal);
      }
    }

    // Merge settings: server wins
    if (serverSettings && serverSettings.calorieGoal) {
      const current = await db.settings.get("settings");
      await db.settings.put({
        id: "settings",
        calorieGoal: serverSettings.calorieGoal,
        proteinGoal: serverSettings.proteinGoal,
        carbsGoal: serverSettings.carbsGoal,
        fatGoal: serverSettings.fatGoal,
        chatgptApiKey: current?.chatgptApiKey ?? "",
      });
    }

    console.log("[sync] pulled", serverMeals.length, "meals from server");
  } catch (err) {
    console.error("[sync] failed:", err);
  }
}
