import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { parseFood } from "@/lib/food-parser";
import { cacheNutrition } from "@/lib/nutrition-cache";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(async () => {
  await db.meals.clear();
  await db.nutritionCache.clear();
  await db.settings.clear();
  vi.clearAllMocks();
});

describe("parseFood", () => {
  it("parses free text via the API route", async () => {
    const apiResponse = [
      {
        name: "Chicken Breast",
        displayText: "100g Chicken Breast",
        quantity: 100,
        unit: "g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    });

    const result = await parseFood("100g chicken breast");

    expect(mockFetch).toHaveBeenCalledWith("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "100g chicken breast" }),
    });

    expect(result).toHaveLength(1);
    expect(result[0].parsed).toBe(true);
    expect(result[0].name).toBe("Chicken Breast");
    expect(result[0].rawText).toBe("100g Chicken Breast");
    expect(result[0].calories).toBe(165);
  });

  it("uses cached results when available (no API call)", async () => {
    await cacheNutrition({
      key: "100g chicken breast",
      name: "Chicken Breast",
      quantity: 100,
      unit: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    });

    const result = await parseFood("100g chicken breast");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].parsed).toBe(true);
    expect(result[0].calories).toBe(165);
  });

  it("caches parsed results from API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          name: "Oats",
          displayText: "50g Oats",
          quantity: 50,
          unit: "g",
          calories: 190,
          protein: 6,
          carbs: 34,
          fat: 3,
        },
      ],
    });

    await parseFood("50g oats");

    const cached = await db.nutritionCache.get("50g Oats");
    expect(cached).toBeDefined();
    expect(cached?.calories).toBe(190);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    await expect(parseFood("something")).rejects.toThrow("Server error");
  });
});
