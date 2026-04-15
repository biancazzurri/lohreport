"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MealInput } from "@/components/meal-input";
import { ShortcutList } from "@/components/shortcut-list";
import { ParsedPreview } from "@/components/parsed-preview";
import { TrainingPreview } from "@/components/training-preview";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { parseFood } from "@/lib/food-parser";
import { parseTraining } from "@/lib/training-parser";
import { addMeal } from "@/lib/meals";
import { addTraining } from "@/lib/training";
import { dismissShortcut } from "@/lib/shortcuts";
import type { MealItem } from "@/lib/types";
import type { Shortcut } from "@/lib/shortcuts";

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTraining = searchParams.get("type") === "training";

  const shortcuts = useShortcuts();
  const [parsedItems, setParsedItems] = useState<MealItem[] | null>(null);
  const [trainingResult, setTrainingResult] = useState<{ description: string; caloriesBurned: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  async function handleTextSubmit(text: string) {
    setLoading(true);
    setError("");
    try {
      if (isTraining) {
        const result = await parseTraining(text);
        setTrainingResult(result);
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
    if (!trainingResult) return;
    await addTraining({
      description: trainingResult.description,
      caloriesBurned: trainingResult.caloriesBurned,
    });
    router.push("/");
  }

  function handleCancel() {
    setParsedItems(null);
    setTrainingResult(null);
  }

  const title = isTraining ? "Add Training" : "Add Meal";
  const placeholder = isTraining ? "What did you do?" : "What did you eat?";
  const analyzingText = isTraining ? "Estimating calories burned..." : "Analyzing your meal...";

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

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-[#252545]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4fc3f7] animate-spin" />
          </div>
          <span className="text-sm text-gray-500">{analyzingText}</span>
        </div>
      ) : trainingResult ? (
        <TrainingPreview
          description={trainingResult.description}
          caloriesBurned={trainingResult.caloriesBurned}
          onConfirm={handleConfirmTraining}
          onCancel={handleCancel}
        />
      ) : parsedItems ? (
        <ParsedPreview
          items={parsedItems}
          onConfirm={handleConfirmMeal}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <MealInput onSubmit={handleTextSubmit} onTypingChange={setShowingSuggestions} placeholder={placeholder} />
          {!isTraining && (
            <div className={`transition-all duration-200 ${showingSuggestions ? "opacity-30 blur-sm pointer-events-none" : ""}`}>
              <ShortcutList shortcuts={shortcuts} onSelect={handleShortcutSelect} onDismiss={dismissShortcut} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
