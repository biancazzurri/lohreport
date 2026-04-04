"use client";

import type { MealItem } from "@/lib/types";

interface ParsedPreviewProps {
  items: MealItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ParsedPreview({ items, onConfirm, onCancel }: ParsedPreviewProps) {
  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
  const totalFat = items.reduce((s, i) => s + i.fat, 0);

  return (
    <div className="bg-[#252545] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">Parsed Items</h2>

      <ul className="space-y-3 mb-4">
        {items.map((item, i) => (
          <li key={i} className="border-b border-gray-700 pb-3 last:border-0 last:pb-0">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-200">
                {item.quantity} {item.unit} {item.name}
              </span>
              <span className="text-sm text-[#4fc3f7] shrink-0 ml-2">
                {Math.round(item.calories)} cal
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              P: {Math.round(item.protein)}g · C: {Math.round(item.carbs)}g · F:{" "}
              {Math.round(item.fat)}g
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-700 pt-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-300">Total</span>
          <span className="text-sm font-semibold text-[#4fc3f7]">
            {Math.round(totalCalories)} cal
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          P: {Math.round(totalProtein)}g · C: {Math.round(totalCarbs)}g · F:{" "}
          {Math.round(totalFat)}g
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-[#1a1a2e] text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 rounded-xl bg-[#4fc3f7] text-[#1a1a2e] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Log Meal
        </button>
      </div>
    </div>
  );
}
