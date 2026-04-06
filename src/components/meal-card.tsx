"use client";

import { useState } from "react";
import type { Meal } from "@/lib/types";

interface MealCardProps {
  meal: Meal;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);

  const description = meal.items.map((item) => item.name || item.rawText).join(", ");

  return (
    <div className="bg-[#252545] rounded-[10px] p-3 mb-2">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-gray-600 shrink-0">{meal.time}</span>
            <span className="text-[13px] text-gray-200 truncate">{description}</span>
          </div>
          <span className="text-xs text-[#4fc3f7] font-semibold shrink-0 ml-2">
            {Math.round(meal.totalCalories)} cal
          </span>
        </div>
        {(() => {
          const totalGrams = meal.totalProtein + meal.totalCarbs + meal.totalFat;
          if (totalGrams === 0) return null;
          const pPct = (meal.totalProtein / totalGrams) * 100;
          const cPct = (meal.totalCarbs / totalGrams) * 100;
          const fPct = (meal.totalFat / totalGrams) * 100;
          const macros = [
            { grams: meal.totalProtein, pct: pPct, color: "#81c784" },
            { grams: meal.totalCarbs, pct: cPct, color: "#ffb74d" },
            { grams: meal.totalFat, pct: fPct, color: "#f48fb1" },
          ].filter((m) => Math.round(m.grams) > 0);
          return (
            <div className="flex h-[8px] flex-1 rounded-full overflow-hidden mt-1.5 text-[8px] font-bold leading-none">
              {macros.map((m) => (
                <div key={m.color} className="flex items-center justify-center text-[#0a0a1a]" style={{ width: `${m.pct}%`, backgroundColor: m.color }}>{Math.round(m.grams)}g</div>
              ))}
            </div>
          );
        })()}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
          {meal.items.map((item, i) => (
            <div
              key={i}
              className={i < meal.items.length - 1 ? "mb-2 pb-2 border-b border-white/[0.06]" : ""}
            >
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-[13px]">{item.rawText}</span>
                {item.parsed ? (
                  <span className="text-[11px] text-gray-500 ml-2 shrink-0">{Math.round(item.calories)} cal</span>
                ) : (
                  <span className="text-[10px] text-yellow-600 italic ml-2 shrink-0">pending</span>
                )}
              </div>
              {item.parsed && (
                <div className="flex gap-3 text-[10px] text-gray-500">
                  <span><span className="text-[#81c784]">P</span> {Math.round(item.protein)}g</span>
                  <span><span className="text-[#ffb74d]">C</span> {Math.round(item.carbs)}g</span>
                  <span><span className="text-[#f48fb1]">F</span> {Math.round(item.fat)}g</span>
                </div>
              )}
            </div>
          ))}

          <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={() => onDelete(meal.id)}
              className="text-[10px] text-gray-600 hover:text-red-400"
              aria-label="Delete meal"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
