export interface MealItem {
  rawText: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  parsed: boolean;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: number;
}

export interface NutritionCacheEntry {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cachedAt: number;
}

export interface Settings {
  id: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  chatgptApiKey: string;
}
