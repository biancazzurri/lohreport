import type { Meal, TrainingSession } from "@/lib/types";
import { MealCard } from "./meal-card";
import { TrainingCard } from "./training-card";

interface MealListProps {
  meals: Meal[];
  trainingSessions: TrainingSession[];
  onDeleteMeal: (id: string) => void;
  onDeleteTraining: (id: string) => void;
}

export function MealList({ meals, trainingSessions, onDeleteMeal, onDeleteTraining }: MealListProps) {
  const mealEntries = meals.map((m) => ({ type: "meal" as const, time: m.time, data: m }));
  const trainingEntries = trainingSessions.map((t) => ({ type: "training" as const, time: t.time, data: t }));
  const all = [...mealEntries, ...trainingEntries].sort((a, b) => a.time.localeCompare(b.time));

  if (all.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No meals logged yet</div>
    );
  }

  return (
    <div className="px-4">
      {all.map((entry) =>
        entry.type === "meal" ? (
          <MealCard key={entry.data.id} meal={entry.data} onDelete={onDeleteMeal} />
        ) : (
          <TrainingCard key={entry.data.id} session={entry.data} onDelete={onDeleteTraining} />
        )
      )}
    </div>
  );
}
