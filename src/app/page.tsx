"use client";

import { useState, useEffect } from "react";
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
import { syncFromServer } from "@/lib/sync";
import { AuthGuard } from "@/components/auth-guard";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function Home() {
  const [date, setDate] = useState(todayDate);
  const [scrolled, setScrolled] = useState(false);
  const meals = useMeals(date);
  const settings = useSettings();
  const totals = useDailyTotals(date);

  useEffect(() => {
    syncFromServer();
  }, []);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Adjust macro goals: if a macro is overdosed, reduce others to stay within calorie budget
  const calPerG = { protein: 4, carbs: 4, fat: 9 } as const;
  const goals = { protein: settings.proteinGoal, carbs: settings.carbsGoal, fat: settings.fatGoal };
  const cur = { protein: totals.protein, carbs: totals.carbs, fat: totals.fat };
  const keys = ["protein", "carbs", "fat"] as const;

  let excessCals = 0;
  for (const k of keys) {
    if (cur[k] > goals[k]) excessCals += (cur[k] - goals[k]) * calPerG[k];
  }

  const adjustedGoals = { ...goals };
  if (excessCals > 0) {
    const under = keys.filter((k) => cur[k] <= goals[k]);
    const underCals = under.reduce((s, k) => s + goals[k] * calPerG[k], 0);
    if (underCals > 0) {
      const scale = Math.max(0, (underCals - excessCals) / underCals);
      for (const k of under) adjustedGoals[k] = Math.round(goals[k] * scale);
    }
  }

  async function handleDelete(id: string) {
    await deleteMeal(id);
  }

  return (
    <AuthGuard>
    <div className="pb-24">
      {/* Sticky header */}
      <div className={`sticky top-0 z-10 bg-[#1a1a2e] transition-all duration-200 ${scrolled ? "pb-2 shadow-lg shadow-black/20" : "pb-0"}`}>
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-base font-semibold text-gray-200">Loh Report</h1>
          <Link
            href="/settings"
            className="text-gray-400 hover:text-gray-200 text-xl"
            aria-label="Settings"
          >
            ⚙
          </Link>
        </div>

        <DateNav
          date={date}
          onPrev={() => {
            const minDate = shiftDate(todayDate(), -10);
            setDate((d) => {
              const prev = shiftDate(d, -1);
              return prev >= minDate ? prev : d;
            });
          }}
          onNext={() => {
            const today = todayDate();
            setDate((d) => {
              const next = shiftDate(d, 1);
              return next <= today ? next : d;
            });
          }}
        />

        <CalorieRing current={totals.calories} target={settings.calorieGoal} />

        <div className="transition-all duration-300 ease-in-out overflow-hidden"
          style={{ maxHeight: scrolled ? 0 : 60, opacity: scrolled ? 0 : 1 }}>
          <MacroBars
            protein={{ current: totals.protein, target: adjustedGoals.protein }}
            carbs={{ current: totals.carbs, target: adjustedGoals.carbs }}
            fat={{ current: totals.fat, target: adjustedGoals.fat }}
          />
        </div>
      </div>

      {/* Meal List */}
      <div className="px-4">
        <MealList meals={meals} onDelete={handleDelete} />
      </div>

      {/* Floating Add Button */}
      <AddButton />
    </div>
    </AuthGuard>
  );
}
