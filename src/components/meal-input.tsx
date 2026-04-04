"use client";

import { useState, useEffect, useRef } from "react";
import { getAllCachedFoods } from "@/lib/nutrition-cache";
import type { NutritionCacheEntry } from "@/lib/types";

interface MealInputProps {
  onSubmit: (text: string) => void;
}

export function MealInput({ onSubmit }: MealInputProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<NutritionCacheEntry[]>([]);
  const [allFoods, setAllFoods] = useState<NutritionCacheEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllCachedFoods().then(setAllFoods);
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = allFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.key.toLowerCase().includes(lower)
    );
    setSuggestions(filtered.slice(0, 6));
  }, [value, allFoods]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      setSuggestions([]);
      onSubmit(value.trim());
    }
  }

  function handleSuggestionClick(food: NutritionCacheEntry) {
    setSuggestions([]);
    onSubmit(food.key);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What did you eat?"
        className="w-full bg-[#252545] text-gray-100 placeholder-gray-500 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#4fc3f7]"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-[#252545] rounded-xl overflow-hidden shadow-lg">
          {suggestions.map((food) => (
            <li key={food.key}>
              <button
                type="button"
                onClick={() => handleSuggestionClick(food)}
                className="w-full text-left px-4 py-2 hover:bg-[#1a1a2e] transition-colors"
              >
                <div className="text-sm text-gray-200">{food.name}</div>
                <div className="text-xs text-gray-500">
                  {Math.round(food.calories)} cal · P: {Math.round(food.protein)}g · C:{" "}
                  {Math.round(food.carbs)}g · F: {Math.round(food.fat)}g
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
