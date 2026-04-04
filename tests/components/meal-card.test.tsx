import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MealCard } from "@/components/meal-card";
import type { Meal } from "@/lib/types";

const parsedMeal: Meal = {
  id: "meal-1",
  date: "2024-04-04",
  time: "08:30",
  items: [
    {
      rawText: "oatmeal with berries",
      name: "oatmeal",
      quantity: 1,
      unit: "bowl",
      calories: 300,
      protein: 8,
      carbs: 54,
      fat: 5,
      parsed: true,
    },
    {
      rawText: "protein shake",
      name: "protein shake",
      quantity: 1,
      unit: "scoop",
      calories: 150,
      protein: 25,
      carbs: 8,
      fat: 2,
      parsed: true,
    },
  ],
  totalCalories: 450,
  totalProtein: 33,
  totalCarbs: 62,
  totalFat: 7,
  createdAt: Date.now(),
};

const mealWithPending: Meal = {
  id: "meal-2",
  date: "2024-04-04",
  time: "12:00",
  items: [
    {
      rawText: "chicken salad",
      name: "",
      quantity: 0,
      unit: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      parsed: false,
    },
  ],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  createdAt: Date.now(),
};

describe("MealCard", () => {
  it("renders the meal time", () => {
    render(<MealCard meal={parsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("08:30")).toBeInTheDocument();
  });

  it("renders total calories", () => {
    render(<MealCard meal={parsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("450 cal")).toBeInTheDocument();
  });

  it("renders food item rawText", () => {
    render(<MealCard meal={parsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("oatmeal with berries")).toBeInTheDocument();
    expect(screen.getByText("protein shake")).toBeInTheDocument();
  });

  it("renders per-item calories for parsed items", () => {
    render(<MealCard meal={parsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("300 cal")).toBeInTheDocument();
    expect(screen.getByText("150 cal")).toBeInTheDocument();
  });

  it("renders per-item macros for parsed items", () => {
    render(<MealCard meal={parsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("P 33g")).toBeInTheDocument();
    expect(screen.getByText("C 62g")).toBeInTheDocument();
    expect(screen.getByText("F 7g")).toBeInTheDocument();
  });

  it("renders meal total macros", () => {
    render(<MealCard meal={parsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("P 33g")).toBeInTheDocument();
    expect(screen.getByText("C 62g")).toBeInTheDocument();
    expect(screen.getByText("F 7g")).toBeInTheDocument();
  });

  it("shows 'pending' for unparsed items", () => {
    render(<MealCard meal={mealWithPending} onDelete={vi.fn()} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("does not show per-item calories for unparsed items", () => {
    render(<MealCard meal={mealWithPending} onDelete={vi.fn()} />);
    // The "pending" text appears; no per-item calorie span adjacent to the item
    const pendingEl = screen.getByText("pending");
    expect(pendingEl).toBeInTheDocument();
    // The item row should not show a calorie figure next to the rawText
    const itemRow = pendingEl.closest("div");
    expect(itemRow).not.toHaveTextContent(/\d+ cal/);
  });

  it("calls onDelete with meal id when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<MealCard meal={parsedMeal} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /delete meal/i }));
    expect(onDelete).toHaveBeenCalledWith("meal-1");
  });
});
