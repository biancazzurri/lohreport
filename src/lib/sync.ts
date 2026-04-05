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

    // Sync settings
    const localSettings = await db.settings.get("settings");
    if (serverSettings && serverSettings.calorieGoal) {
      // Server has settings — write to local
      await db.settings.put({
        id: "settings",
        calorieGoal: serverSettings.calorieGoal,
        proteinGoal: serverSettings.proteinGoal,
        carbsGoal: serverSettings.carbsGoal,
        fatGoal: serverSettings.fatGoal,
        chatgptApiKey: localSettings?.chatgptApiKey ?? "",
      });
    } else if (localSettings && localSettings.calorieGoal !== 2100) {
      // Server has no settings but local does — push local to server
      await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calorieGoal: localSettings.calorieGoal,
          proteinGoal: localSettings.proteinGoal,
          carbsGoal: localSettings.carbsGoal,
          fatGoal: localSettings.fatGoal,
        }),
      }).catch(() => {});
    }

    console.log("[sync] pulled", serverMeals.length, "meals from server");
  } catch (err) {
    console.error("[sync] failed:", err);
  }
}
