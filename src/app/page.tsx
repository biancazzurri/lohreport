"use client";

import { useState } from "react";
import Link from "next/link";
import { useMeals } from "@/hooks/use-meals";
import { useSettings } from "@/hooks/use-settings";
import { useDailyTotals } from "@/hooks/use-daily-totals";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBars } from "@/components/macro-bars";
import { MealList } from "@/components/meal-list";
import { DateNav } from "@/components/date-nav";
import { AddButton } from "@/components/add-button";
import { deleteMeal } from "@/lib/meals";
import { scheduleBackup } from "@/lib/backup";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [date, setDate] = useState(todayDate);
  const meals = useMeals(date);
  const settings = useSettings();
  const totals = useDailyTotals(date);

  async function handleDelete(id: string) {
    await deleteMeal(id);
    scheduleBackup();
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-gray-200">Health Tracker</h1>
        <Link
          href="/settings"
          className="text-gray-400 hover:text-gray-200 text-xl"
          aria-label="Settings"
        >
          ⚙
        </Link>
      </div>

      {/* Date Navigation */}
      <DateNav
        date={date}
        onPrev={() => setDate((d) => shiftDate(d, -1))}
        onNext={() => setDate((d) => shiftDate(d, 1))}
      />

      {/* Calorie Ring */}
      <CalorieRing current={totals.calories} target={settings.calorieGoal} />

      {/* Macro Bars */}
      <MacroBars
        protein={{ current: totals.protein, target: settings.proteinGoal }}
        carbs={{ current: totals.carbs, target: settings.carbsGoal }}
        fat={{ current: totals.fat, target: settings.fatGoal }}
      />

      {/* Meal List */}
      <MealList meals={meals} onDelete={handleDelete} />

      {/* Floating Add Button */}
      <AddButton />
    </div>
  );
}
