import { useMeals } from "./use-meals";

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function useDailyTotals(date: string): DailyTotals {
  const meals = useMeals(date);

  return meals.reduce<DailyTotals>(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
