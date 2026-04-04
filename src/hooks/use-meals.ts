import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Meal } from "@/lib/types";

export function useMeals(date: string): Meal[] {
  const meals = useLiveQuery(
    () => db.meals.where("date").equals(date).sortBy("time"),
    [date]
  );
  return meals ?? [];
}
