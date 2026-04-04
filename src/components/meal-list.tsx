import type { Meal } from "@/lib/types";
import { MealCard } from "./meal-card";

interface MealListProps {
  meals: Meal[];
  onDelete: (id: string) => void;
}

export function MealList({ meals, onDelete }: MealListProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No meals logged yet</div>
    );
  }

  return (
    <div className="px-4">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onDelete={onDelete} />
      ))}
    </div>
  );
}
