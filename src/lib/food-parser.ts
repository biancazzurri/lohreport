import OpenAI from "openai";
import { lookupCache, cacheNutrition } from "./nutrition-cache";
import { getSettings } from "./settings";
import type { MealItem } from "./types";

const SYSTEM_PROMPT = `You are a nutrition analysis assistant. Parse the user's food description and return ONLY a valid JSON array of food items. No markdown, no explanation — just the raw JSON array.

Each item in the array must have these fields:
- name: string (clean, normalized name — e.g. "Cottage Cheese", "Corn Crackers", "Chicken Breast")
- displayText: string (human-friendly label with quantity — e.g. "200g Cottage Cheese", "3 Corn Crackers")
- quantity: number
- unit: string (use short units: g, ml, piece, tbsp, tsp, cup)
- calories: number
- protein: number (grams)
- carbs: number (grams)
- fat: number (grams)

Normalize names: capitalize properly, use common English names, remove redundant words.

Example output:
[{"name":"Chicken Breast","displayText":"100g Chicken Breast","quantity":100,"unit":"g","calories":165,"protein":31,"carbs":0,"fat":3.6}]`;

interface ParsedItem {
  name: string;
  displayText: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function parseFood(text: string): Promise<MealItem[]> {
  // 1. Check cache first
  const cached = await lookupCache(text);
  if (cached) {
    return [
      {
        rawText: text,
        name: cached.name,
        quantity: cached.quantity,
        unit: cached.unit,
        calories: cached.calories,
        protein: cached.protein,
        carbs: cached.carbs,
        fat: cached.fat,
        parsed: true,
      },
    ];
  }

  // 2. Check for API key
  const settings = await getSettings();
  if (!settings.chatgptApiKey) {
    return [
      {
        rawText: text,
        name: text,
        quantity: 1,
        unit: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        parsed: false,
      },
    ];
  }

  // 3. Call OpenAI
  try {
    const client = new OpenAI({
      apiKey: settings.chatgptApiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    console.log("[food-parser] model:", "gpt-5");
    console.log("[food-parser] input:", text);
    console.log("[food-parser] raw response:", content);
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim();
    console.log("[food-parser] cleaned:", cleaned);
    const parsedItems: ParsedItem[] = JSON.parse(cleaned);

    // 4. Cache each parsed item and build result
    const mealItems: MealItem[] = [];

    for (const item of parsedItems) {
      const displayText = item.displayText || `${item.quantity} ${item.unit} ${item.name}`;
      await cacheNutrition({
        key: displayText,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      });

      mealItems.push({
        rawText: displayText,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        parsed: true,
      });
    }

    return mealItems;
  } catch (err) {
    console.error("Food parsing failed:", err);
    return [
      {
        rawText: text,
        name: text,
        quantity: 1,
        unit: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        parsed: false,
      },
    ];
  }
}
