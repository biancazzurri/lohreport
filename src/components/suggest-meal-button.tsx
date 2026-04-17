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
      <button
        type="button"
        onClick={handleOpen}
        disabled={goalsMet}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#b388ff] flex items-center justify-center shadow-lg text-[#1a1a2e] text-2xl font-bold hover:bg-[#9c6eff] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label={goalsMet ? "Goals met" : "Suggest meal to fill remaining macros"}
      >
        ✨
      </button>

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
