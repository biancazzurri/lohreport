import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ParsedPreview } from "@/components/parsed-preview";
import type { MealItem } from "@/lib/types";

const items: MealItem[] = [
  {
    rawText: "chicken breast 200g",
    name: "chicken breast",
    quantity: 200,
    unit: "g",
    calories: 330,
    protein: 62,
    carbs: 0,
    fat: 7.2,
    parsed: true,
  },
  {
    rawText: "brown rice 150g",
    name: "brown rice",
    quantity: 150,
    unit: "g",
    calories: 195,
    protein: 4.5,
    carbs: 40,
    fat: 1.5,
    parsed: true,
  },
];

describe("ParsedPreview", () => {
  it("renders each item name", () => {
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/chicken breast/i)).toBeInTheDocument();
    expect(screen.getByText(/brown rice/i)).toBeInTheDocument();
  });

  it("renders per-item calories", () => {
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("330 cal")).toBeInTheDocument();
    expect(screen.getByText("195 cal")).toBeInTheDocument();
  });

  it("renders per-item protein/carbs/fat macros", () => {
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("P: 62g · C: 0g · F: 7g")).toBeInTheDocument();
    expect(screen.getByText("P: 5g · C: 40g · F: 2g")).toBeInTheDocument();
  });

  it("renders total calories", () => {
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    // 330 + 195 = 525
    expect(screen.getByText("525 cal")).toBeInTheDocument();
  });

  it("renders total P/C/F", () => {
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    // protein: 62+4.5=66.5 -> 67, carbs: 0+40=40, fat: 7.2+1.5=8.7 -> 9
    expect(screen.getByText("P: 67g · C: 40g · F: 9g")).toBeInTheDocument();
  });

  it("calls onConfirm when Log Meal button is tapped", () => {
    const onConfirm = vi.fn();
    render(<ParsedPreview items={items} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /log meal/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is tapped", () => {
    const onCancel = vi.fn();
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
