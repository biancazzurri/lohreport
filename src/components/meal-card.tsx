"use client";

import type { Meal } from "@/lib/types";

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  return (
    <div className="bg-[#252545] rounded-xl p-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{meal.time}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#4fc3f7]">
            {Math.round(meal.totalCalories)} cal
          </span>
          <button
            onClick={() => onDelete(meal.id)}
            className="text-gray-500 hover:text-gray-300 text-sm leading-none"
            aria-label="Delete meal"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        {meal.items.map((item, i) => (
          <div key={i} className="text-sm">
            <div className="flex justify-between">
              <span className="text-gray-200">{item.rawText}</span>
              {item.parsed ? (
                <span className="text-gray-400 ml-2 shrink-0">
                  {Math.round(item.calories)} cal
                </span>
              ) : (
                <span className="text-gray-500 italic ml-2 shrink-0">
                  pending
                </span>
              )}
            </div>
            {item.parsed && (
              <div className="text-xs text-gray-500">
                P: {Math.round(item.protein)}g · C: {Math.round(item.carbs)}g · F: {Math.round(item.fat)}g
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-2 text-xs text-gray-500">
        P: {Math.round(meal.totalProtein)}g · C: {Math.round(meal.totalCarbs)}g · F: {Math.round(meal.totalFat)}g
      </div>
    </div>
  );
}
