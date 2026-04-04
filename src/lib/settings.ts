import { db } from "./db";
import type { Settings } from "./types";

const SETTINGS_ID = "settings";

const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  calorieGoal: 2100,
  proteinGoal: 150,
  carbsGoal: 220,
  fatGoal: 70,
  chatgptApiKey: "",
};

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get(SETTINGS_ID);
  return stored ?? { ...DEFAULT_SETTINGS };
}

export async function saveSettings(updates: Partial<Omit<Settings, "id">>): Promise<Settings> {
  const current = await getSettings();
  const updated: Settings = { ...current, ...updates };
  await db.settings.put(updated);
  return updated;
}
