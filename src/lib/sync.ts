import { db } from "./db";
import type { Meal, Settings, TrainingSession } from "./types";

export async function syncFromServer(): Promise<void> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 10);
    const sinceStr = since.toISOString().slice(0, 10);

    // Fetch meals
    const mealsRes = await fetch(`/api/meals?since=${sinceStr}`);
    if (!mealsRes.ok) return;
    const serverMeals: Meal[] = await mealsRes.json();

    // Fetch training sessions
    const trainingRes = await fetch(`/api/training?since=${sinceStr}`);
    const serverTraining: TrainingSession[] = trainingRes.ok ? await trainingRes.json() : [];

    // Fetch settings
    const settingsRes = await fetch("/api/backup");
    const serverSettings = settingsRes.ok ? await settingsRes.json() : null;

    // Merge meals
    const localMeals = await db.meals.toArray();
    const localMealIds = new Set(localMeals.map((m) => m.id));
    for (const meal of serverMeals) {
      if (localMealIds.has(meal.id)) {
        await db.meals.put(meal);
      } else {
        await db.meals.add(meal);
      }
    }

    // Merge training sessions
    const localTraining = await db.trainingSessions.toArray();
    const localTrainingIds = new Set(localTraining.map((t) => t.id));
    for (const session of serverTraining) {
      if (localTrainingIds.has(session.id)) {
        await db.trainingSessions.put(session);
      } else {
        await db.trainingSessions.add(session);
      }
    }

    // Sync settings
    const localSettings = await db.settings.get("settings");
    if (serverSettings && serverSettings.calorieGoal) {
      await db.settings.put({
        id: "settings",
        calorieGoal: serverSettings.calorieGoal,
        proteinGoal: serverSettings.proteinGoal,
        carbsGoal: serverSettings.carbsGoal,
        fatGoal: serverSettings.fatGoal,
        chatgptApiKey: localSettings?.chatgptApiKey ?? "",
      });
    } else if (localSettings && localSettings.calorieGoal !== 2100) {
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

    console.log("[sync] pulled", serverMeals.length, "meals and", serverTraining.length, "training sessions from server");
  } catch (err) {
    console.error("[sync] failed:", err);
  }
}
