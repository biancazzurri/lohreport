"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MealInput } from "@/components/meal-input";
import { ShortcutList } from "@/components/shortcut-list";
import { ParsedPreview } from "@/components/parsed-preview";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { parseFood } from "@/lib/food-parser";
import { addMeal } from "@/lib/meals";
import { dismissShortcut } from "@/lib/shortcuts";
import { scheduleBackup } from "@/lib/backup";
import type { MealItem } from "@/lib/types";
import type { Shortcut } from "@/lib/shortcuts";

export default function AddPage() {
  const router = useRouter();
  const shortcuts = useShortcuts();
  const [parsedItems, setParsedItems] = useState<MealItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  async function handleTextSubmit(text: string) {
    setLoading(true);
    setError("");
    try {
      const items = await parseFood(text);
      setParsedItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse food");
    } finally {
      setLoading(false);
    }
  }

  function handleShortcutSelect(shortcut: Shortcut) {
    setParsedItems(shortcut.items);
  }

  async function handleConfirm() {
    if (!parsedItems) return;
    await addMeal({ items: parsedItems });
    scheduleBackup();
    router.push("/");
  }

  function handleCancel() {
    setParsedItems(null);
  }

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          aria-label="Back"
        >
          &#9664;
        </Link>
        <h1 className="text-base font-semibold text-gray-200">Add Meal</h1>
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
          <span className="text-sm text-gray-500">Analyzing your meal...</span>
        </div>
      ) : parsedItems ? (
        <ParsedPreview
          items={parsedItems}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <MealInput onSubmit={handleTextSubmit} onTypingChange={setShowingSuggestions} />
          <div className={`transition-all duration-200 ${showingSuggestions ? "opacity-30 blur-sm pointer-events-none" : ""}`}>
            <ShortcutList shortcuts={shortcuts} onSelect={handleShortcutSelect} onDismiss={dismissShortcut} />
          </div>
        </>
      )}
    </div>
  );
}
