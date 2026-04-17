"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/meal-suggestions";

interface MealSuggestionsModalProps {
  suggestions: Suggestion[] | null;
  loading: boolean;
  error: string | null;
  onLog: (suggestion: Suggestion) => Promise<void>;
  onRetry: () => void;
  onClose: () => void;
}

export function MealSuggestionsModal({
  suggestions,
  loading,
  error,
  onLog,
  onRetry,
  onClose,
}: MealSuggestionsModalProps) {
  const [loggingIndex, setLoggingIndex] = useState<number | null>(null);

  async function handleLog(suggestion: Suggestion, index: number) {
    setLoggingIndex(index);
    try {
      await onLog(suggestion);
    } finally {
      setLoggingIndex(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1a1a2e] rounded-t-2xl border-t border-white/10 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#1a1a2e] flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-200">Meal suggestions</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-[#4fc3f7] rounded-full animate-spin mb-3" />
              <div className="text-xs">Thinking up meals…</div>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center">
              <div className="text-sm text-gray-300 mb-3">{error}</div>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-xl bg-[#4fc3f7] text-[#1a1a2e] text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && suggestions && (
            <ul className="space-y-3">
              {suggestions.map((s, i) => {
                const totalCalories = s.items.reduce((sum, x) => sum + x.calories, 0);
                const totalProtein = s.items.reduce((sum, x) => sum + x.protein, 0);
                const totalCarbs = s.items.reduce((sum, x) => sum + x.carbs, 0);
                const totalFat = s.items.reduce((sum, x) => sum + x.fat, 0);
                const isLogging = loggingIndex === i;

                return (
                  <li key={i} className="bg-[#252545] rounded-xl p-3">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-semibold text-gray-200">{s.name}</span>
                      <span className="text-sm text-[#4fc3f7] font-semibold">
                        {Math.round(totalCalories)} cal
                      </span>
                    </div>
                    <div className="flex gap-3 text-[11px] text-gray-500 mb-2">
                      <span><span className="text-[#81c784]">P</span> {Math.round(totalProtein)}g</span>
                      <span><span className="text-[#ffb74d]">C</span> {Math.round(totalCarbs)}g</span>
                      <span><span className="text-[#f48fb1]">F</span> {Math.round(totalFat)}g</span>
                    </div>
                    <ul className="text-[12px] text-gray-400 space-y-0.5 mb-3 pl-2 border-l border-white/10">
                      {s.items.map((item, j) => (
                        <li key={j} className="truncate">{item.displayText}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => handleLog(s, i)}
                      disabled={loggingIndex !== null}
                      className="w-full py-2 rounded-xl bg-[#4fc3f7] text-[#1a1a2e] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLogging ? "Logging…" : "Log this meal"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
