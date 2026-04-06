"use client";

import { useState } from "react";
import type { MealItem } from "@/lib/types";

interface ParsedPreviewProps {
  items: MealItem[];
  onConfirm: (items: MealItem[]) => void;
  onCancel: () => void;
}

export function ParsedPreview({ items, onConfirm, onCancel }: ParsedPreviewProps) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => true));

  function toggle(index: number) {
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  const selected = items.filter((_, i) => checked[i]);
  const totalCalories = selected.reduce((s, i) => s + i.calories, 0);
  const totalProtein = selected.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = selected.reduce((s, i) => s + i.carbs, 0);
  const totalFat = selected.reduce((s, i) => s + i.fat, 0);
  const noneSelected = selected.length === 0;

  return (
    <div className="bg-[#252545] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">Parsed Items</h2>

      <ul className="space-y-3 mb-4">
        {items.map((item, i) => (
          <li
            key={i}
            className={`border-b border-gray-700 pb-3 last:border-0 last:pb-0 cursor-pointer transition-opacity ${checked[i] ? "" : "opacity-40"}`}
            onClick={() => toggle(i)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${checked[i] ? "bg-[#4fc3f7] border-[#4fc3f7]" : "border-gray-600 bg-transparent"}`}
              >
                {checked[i] && (
                  <svg className="w-3 h-3 text-[#1a1a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
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
              </div>
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
          onClick={() => onConfirm(selected)}
          disabled={noneSelected}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-opacity ${noneSelected ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-[#4fc3f7] text-[#1a1a2e] hover:opacity-90"}`}
        >
          Log Meal
        </button>
      </div>
    </div>
  );
}
