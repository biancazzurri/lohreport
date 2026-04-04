import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";

const mockCreate = vi.fn();

// Mock the OpenAI SDK
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

import { parseFood } from "@/lib/food-parser";
import { saveSettings } from "@/lib/settings";
import { cacheNutrition } from "@/lib/nutrition-cache";

beforeEach(async () => {
  await db.meals.clear();
  await db.nutritionCache.clear();
  await db.settings.clear();
  vi.clearAllMocks();
});

describe("parseFood", () => {
  it("returns unparsed items when no API key is configured", async () => {
    const result = await parseFood("100g chicken breast");

    expect(result).toHaveLength(1);
    expect(result[0].parsed).toBe(false);
    expect(result[0].calories).toBe(0);
    expect(result[0].rawText).toBe("100g chicken breast");
  });

  it("parses free text into structured items using OpenAI", async () => {
    await saveSettings({ chatgptApiKey: "sk-test-key" });

    const mockResponseItems = [
      {
        name: "chicken breast",
        quantity: 100,
        unit: "g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      },
    ];

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockResponseItems),
          },
        },
      ],
    });

    const result = await parseFood("100g chicken breast");

    expect(result).toHaveLength(1);
    expect(result[0].parsed).toBe(true);
    expect(result[0].name).toBe("chicken breast");
    expect(result[0].calories).toBe(165);
    expect(result[0].protein).toBe(31);
    expect(result[0].carbs).toBe(0);
    expect(result[0].fat).toBeCloseTo(3.6);
    expect(result[0].rawText).toBe("100g chicken breast");
  });

  it("uses cached results when available", async () => {
    await saveSettings({ chatgptApiKey: "sk-test-key" });

    // Pre-populate the cache
    await cacheNutrition({
      key: "100g chicken breast",
      name: "chicken breast",
      quantity: 100,
      unit: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    });

    const result = await parseFood("100g chicken breast");

    // OpenAI should NOT have been called
    expect(mockCreate).not.toHaveBeenCalled();

    expect(result).toHaveLength(1);
    expect(result[0].parsed).toBe(true);
    expect(result[0].name).toBe("chicken breast");
    expect(result[0].calories).toBe(165);
  });

  it("caches parsed results from OpenAI", async () => {
    await saveSettings({ chatgptApiKey: "sk-test-key" });

    const mockResponseItems = [
      {
        name: "oats",
        quantity: 50,
        unit: "g",
        calories: 190,
        protein: 6,
        carbs: 34,
        fat: 3,
      },
    ];

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockResponseItems),
          },
        },
      ],
    });

    await parseFood("50g oats");

    // Check item is in cache
    const cached = await db.nutritionCache.get("50g oats");
    expect(cached).toBeDefined();
    expect(cached?.calories).toBe(190);
  });
});
