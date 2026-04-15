import { useMeals } from "./use-meals";
import { useTrainingSessions } from "./use-training-sessions";

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burned: number;
}

export function useDailyTotals(date: string): DailyTotals {
  const meals = useMeals(date);
  const training = useTrainingSessions(date);

  const mealTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const burned = training.reduce((sum, s) => sum + s.totalCaloriesBurned, 0);

  return { ...mealTotals, burned };
}
