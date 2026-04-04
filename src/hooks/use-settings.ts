import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Settings } from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  calorieGoal: 2100,
  proteinGoal: 150,
  carbsGoal: 220,
  fatGoal: 70,
  chatgptApiKey: "",
};

export function useSettings(): Settings {
  const settings = useLiveQuery(
    () => db.settings.get("settings"),
    []
  );
  return settings ?? { ...DEFAULT_SETTINGS };
}
