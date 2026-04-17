import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const SuggestRequestSchema = z.object({
  remaining: z.object({
    calories: z.number().min(0).max(10_000),
    protein: z.number().min(0).max(1_000),
    carbs: z.number().min(0).max(1_000),
    fat: z.number().min(0).max(1_000),
  }),
  recentMeals: z.array(z.string().max(500)).max(20).optional(),
});

const SuggestionItemSchema = z.object({
  name: z.string().max(100),
  displayText: z.string().max(200),
  quantity: z.number().min(0).max(100_000),
  unit: z.string().max(20),
  calories: z.number().min(0).max(100_000),
  protein: z.number().min(0).max(10_000),
  carbs: z.number().min(0).max(10_000),
  fat: z.number().min(0).max(10_000),
});

const SuggestionSchema = z.object({
  name: z.string().max(100),
  items: z.array(SuggestionItemSchema).min(1).max(5),
});

const SuggestResponseSchema = z.array(SuggestionSchema).length(3);

const SYSTEM_PROMPT = `You are a nutrition assistant. The user tells you how many calories and grams of protein, carbs, and fat they still need today, plus a list of their recently logged meals (most recent first). Use the recent meals to match their taste, cuisine, and typical portion sizes. Return ONLY a valid JSON array of exactly 3 meal suggestions. No markdown, no explanation — just the raw JSON array.

Each suggestion must have:
- name: string (short, natural meal name, capitalized properly — e.g. "Grilled Chicken & Rice Bowl")
- items: array of 1–5 items, each with:
  - name: string (clean, normalized — e.g. "Chicken Breast")
  - displayText: string (human-friendly label with quantity — e.g. "150g Chicken Breast")
  - quantity: number
  - unit: string (short units: g, ml, piece, tbsp, tsp, cup)
  - calories: number
  - protein: number (grams)
  - carbs: number (grams)
  - fat: number (grams)

Rules:
- The sum of each suggestion's item macros should approximately match the user's remaining macros. Prefer slight undershoots over overshoots.
- If a macro's remaining value is 0, minimize that macro in the suggestion.
- Prefer foods and portion sizes similar to the user's recent meals. Lean toward ingredients they clearly eat.
- Offer variety across the 3 suggestions (different cuisines, protein sources, or styles), but keep all 3 plausible given their history.
- Don't suggest a meal identical to the most recent one.

Example output:
[{"name":"Chicken & Rice Bowl","items":[{"name":"Chicken Breast","displayText":"150g Chicken Breast","quantity":150,"unit":"g","calories":248,"protein":46,"carbs":0,"fat":5},{"name":"Brown Rice","displayText":"100g Brown Rice","quantity":100,"unit":"g","calories":112,"protein":2,"carbs":23,"fat":1}]}]`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`suggest:${session.user.email}`, 60_000, 5)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const parsed = SuggestRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { remaining, recentMeals } = parsed.data;
    const remainingLine = `remaining: calories=${Math.round(remaining.calories)}, protein=${Math.round(remaining.protein)}g, carbs=${Math.round(remaining.carbs)}g, fat=${Math.round(remaining.fat)}g`;
    const mealsBlock =
      recentMeals && recentMeals.length > 0
        ? `\n\nrecent meals (most recent first):\n${recentMeals.map((m) => `- ${m}`).join("\n")}`
        : "";
    const userMessage = remainingLine + mealsBlock;

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const cleaned = content.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim();
    const raw = JSON.parse(cleaned);

    const result = SuggestResponseSchema.safeParse(raw);
    if (!result.success) {
      console.error("Suggest validation failed:", result.error);
      return NextResponse.json({ error: "Failed to parse suggestions" }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Suggest API failed:", err);
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 });
  }
}
