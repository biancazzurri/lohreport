"use client";

import { useState } from "react";
import {
  suggestMeals,
  logSuggestion,
  type RemainingMacros,
  type Suggestion,
} from "@/lib/meal-suggestions";
import { MealSuggestionsModal } from "@/components/meal-suggestions-modal";

interface SuggestMealButtonProps {
  remaining: RemainingMacros;
  date: string;
}

export function SuggestMealButton({ remaining, date }: SuggestMealButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  const goalsMet =
    remaining.calories === 0 &&
    remaining.protein === 0 &&
    remaining.carbs === 0 &&
    remaining.fat === 0;

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestMeals(remaining);
      setSuggestions(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    if (goalsMet) return;
    setOpen(true);
    await fetchSuggestions();
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setSuggestions(null);
  }

  async function handleLog(suggestion: Suggestion) {
    await logSuggestion(suggestion, date);
    handleClose();
  }

  return (
    <>
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={handleOpen}
          disabled={goalsMet}
          className="w-full py-2 rounded-full bg-[#252545] text-gray-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#2d2d52] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Suggest meal to fill remaining macros"
        >
          <span>✨</span>
          <span>{goalsMet ? "Goals met" : "Suggest meal"}</span>
        </button>
      </div>

      {open && (
        <MealSuggestionsModal
          suggestions={suggestions}
          loading={loading}
          error={error}
          onLog={handleLog}
          onRetry={fetchSuggestions}
          onClose={handleClose}
        />
      )}
    </>
  );
}
