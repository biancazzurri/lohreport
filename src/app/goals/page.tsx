"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MacroSlider } from "@/components/macro-slider";
import { CalorieBreakdown } from "@/components/calorie-breakdown";
import { useSettings } from "@/hooks/use-settings";
import { saveSettings } from "@/lib/settings";
import { scheduleBackup } from "@/lib/backup";

export default function GoalsPage() {
  const router = useRouter();
  const settings = useSettings();

  const [calories, setCalories] = useState(settings.calorieGoal);
  const [protein, setProtein] = useState(settings.proteinGoal);
  const [carbs, setCarbs] = useState(settings.carbsGoal);
  const [fat, setFat] = useState(settings.fatGoal);

  // Sync from settings on mount / when settings load
  useEffect(() => {
    setCalories(settings.calorieGoal);
    setProtein(settings.proteinGoal);
    setCarbs(settings.carbsGoal);
    setFat(settings.fatGoal);
  }, [
    settings.calorieGoal,
    settings.proteinGoal,
    settings.carbsGoal,
    settings.fatGoal,
  ]);

  async function handleSave() {
    await saveSettings({
      calorieGoal: calories,
      proteinGoal: protein,
      carbsGoal: carbs,
      fatGoal: fat,
    });
    scheduleBackup();
    router.push("/settings");
  }

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          aria-label="Back"
        >
          &#9664;
        </Link>
        <h1 className="text-base font-semibold text-gray-200">Macro Goals</h1>
      </div>

      {/* Calorie Stepper */}
      <div className="bg-[#252545] rounded-xl p-4 mb-6">
        <div className="text-xs text-gray-500 mb-2">Daily Calorie Goal</div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCalories((c) => Math.max(0, c - 50))}
            className="w-10 h-10 rounded-full bg-[#1a1a2e] text-gray-300 text-lg font-bold hover:bg-[#2d2d55] transition-colors"
            aria-label="Decrease calories"
          >
            −
          </button>
          <span className="text-2xl font-bold text-[#4fc3f7]">
            {calories.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={() => setCalories((c) => c + 50)}
            className="w-10 h-10 rounded-full bg-[#1a1a2e] text-gray-300 text-lg font-bold hover:bg-[#2d2d55] transition-colors"
            aria-label="Increase calories"
          >
            +
          </button>
        </div>
      </div>

      {/* Macro Sliders */}
      <div className="bg-[#252545] rounded-xl p-4 mb-4">
        <MacroSlider
          label="Protein"
          color="#81c784"
          grams={protein}
          calPerGram={4}
          totalCalories={calories}
          onChange={setProtein}
        />
        <MacroSlider
          label="Carbs"
          color="#ffb74d"
          grams={carbs}
          calPerGram={4}
          totalCalories={calories}
          onChange={setCarbs}
        />
        <MacroSlider
          label="Fat"
          color="#f48fb1"
          grams={fat}
          calPerGram={9}
          totalCalories={calories}
          onChange={setFat}
        />
      </div>

      {/* Calorie Breakdown */}
      <div className="mb-6">
        <CalorieBreakdown
          protein={protein}
          carbs={carbs}
          fat={fat}
          target={calories}
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-[#4fc3f7] text-[#1a1a2e] font-semibold hover:opacity-90 transition-opacity"
      >
        Save Goals
      </button>
    </div>
  );
}
