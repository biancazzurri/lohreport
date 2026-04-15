"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MealInput } from "@/components/meal-input";
import { ShortcutList } from "@/components/shortcut-list";
import { ParsedPreview } from "@/components/parsed-preview";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { parseFood } from "@/lib/food-parser";
import { parseTraining } from "@/lib/training-parser";
import { addMeal } from "@/lib/meals";
import { addTraining } from "@/lib/training";
import { dismissShortcut } from "@/lib/shortcuts";
import type { MealItem, Exercise } from "@/lib/types";
import type { Shortcut } from "@/lib/shortcuts";

export default function AddPage() {
  return (
    <Suspense>
      <AddPageContent />
    </Suspense>
  );
}

function AddPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTraining = searchParams.get("type") === "training";

  const shortcuts = useShortcuts();
  const [inputText, setInputText] = useState("");
  const [parsedItems, setParsedItems] = useState<MealItem[] | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  async function handleTextSubmit(text: string) {
    setLoading(true);
    setError("");
    try {
      if (isTraining) {
        const result = await parseTraining(text);
        setExercises((prev) => [...prev, result]);
        setInputText("");
      } else {
        const items = await parseFood(text);
        setParsedItems(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isTraining ? "Failed to parse training" : "Failed to parse food");
    } finally {
      setLoading(false);
    }
  }

  function handleShortcutSelect(shortcut: Shortcut) {
    setParsedItems(shortcut.items);
  }

  async function handleConfirmMeal(items: MealItem[]) {
    await addMeal({ items });
    router.push("/");
  }

  async function handleConfirmTraining() {
    if (exercises.length === 0) return;
    await addTraining({ exercises });
    router.push("/");
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCancel() {
    setParsedItems(null);
  }

  const title = isTraining ? "Add Training" : "Add Meal";
  const placeholder = isTraining ? "What did you do?" : "What did you eat?";
  const analyzingText = isTraining ? "Estimating calories burned..." : "Analyzing your meal...";
  const totalBurned = exercises.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          aria-label="Back"
        >
          &#9664;
        </Link>
        <h1 className="text-base font-semibold text-gray-200">{title}</h1>
      </div>

      {error && (
        <div className="bg-[#f48fb1]/10 text-[#f48fb1] text-sm rounded-lg p-3 mb-4">{error}</div>
      )}

      {isTraining ? (
        <>
          {/* Exercises accumulated so far */}
          {exercises.length > 0 && (
            <div className="bg-[#252545] rounded-xl p-3 mb-4">
              {exercises.map((ex, i) => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-200">{ex.description}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-[#81c784] font-semibold">-{Math.round(ex.caloriesBurned)} cal</span>
                    <button
                      type="button"
                      onClick={() => removeExercise(i)}
                      className="text-[10px] text-gray-600 hover:text-red-400"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/[0.06] mt-2 pt-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400">Total</span>
                <span className="text-xs font-semibold text-[#81c784]">-{Math.round(totalBurned)} cal</span>
              </div>
            </div>
          )}

          {/* Input — always visible */}
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-2 border-[#252545]" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4fc3f7] animate-spin" />
              </div>
              <span className="text-sm text-gray-500">{analyzingText}</span>
            </div>
          ) : (
            <MealInput onSubmit={handleTextSubmit} onTypingChange={setShowingSuggestions} placeholder={placeholder} value={inputText} onValueChange={setInputText} />
          )}

          {/* Log button */}
          {exercises.length > 0 && !loading && (
            <button
              type="button"
              onClick={handleConfirmTraining}
              className="w-full mt-4 py-3 rounded-xl bg-[#81c784] text-[#1a1a2e] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Log Training
            </button>
          )}
        </>
      ) : loading ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-[#252545]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4fc3f7] animate-spin" />
          </div>
          <span className="text-sm text-gray-500">{analyzingText}</span>
        </div>
      ) : parsedItems ? (
        <ParsedPreview
          items={parsedItems}
          onConfirm={handleConfirmMeal}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <MealInput onSubmit={handleTextSubmit} onTypingChange={setShowingSuggestions} placeholder={placeholder} value={inputText} onValueChange={setInputText} />
          <div className={`transition-all duration-200 ${showingSuggestions ? "opacity-30 blur-sm pointer-events-none" : ""}`}>
            <ShortcutList shortcuts={shortcuts} onSelect={handleShortcutSelect} onDismiss={dismissShortcut} />
          </div>
        </>
      )}
    </div>
  );
}
