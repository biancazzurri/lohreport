import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const ParseRequestSchema = z.object({
  text: z.string().min(1).max(500),
  mode: z.enum(["meal", "training"]).default("meal"),
});

const ParsedItemSchema = z.object({
  name: z.string().max(100),
  displayText: z.string().max(200),
  quantity: z.number().min(0).max(100_000),
  unit: z.string().max(20),
  calories: z.number().min(0).max(100_000),
  protein: z.number().min(0).max(10_000),
  carbs: z.number().min(0).max(10_000),
  fat: z.number().min(0).max(10_000),
});

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

const TRAINING_SYSTEM_PROMPT = `You are a fitness assistant. The user describes a training activity. Estimate the calories burned and return ONLY a valid JSON object. No markdown, no explanation — just the raw JSON.

The user often logs weight training using rep notation: "AxB" means A sets of B reps. Examples:
- "4x6 backsquat 80 kilo" = 4 sets of 6 reps of back squat at 80 kg
- "3x10 bench press 60kg" = 3 sets of 10 reps of bench press at 60 kg
- "5x5 deadlift 100" = 5 sets of 5 reps of deadlift at 100 kg

For weight training, estimate calories based on total volume (sets × reps), exercise type, and weight used. An average adult burns roughly 3-6 calories per set of compound lifts and 2-4 per set of isolation exercises, but scale with weight and rep count.

The user may also log cardio like "45 min running" or "30 min cycling".

The JSON must have these fields:
- description: string (clean, normalized description — e.g. "Back Squat 4×6 @ 80 kg", "45 min Running")
- caloriesBurned: number (estimated calories burned, assume an average adult male)

Example outputs:
{"description":"Back Squat 4×6 @ 80 kg","caloriesBurned":120}
{"description":"45 min Running","caloriesBurned":450}`;

const TrainingResultSchema = z.object({
  description: z.string().max(200),
  caloriesBurned: z.number().min(0).max(100_000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`parse:${session.user.email}`, 60_000, 10)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const parsed = ParseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const systemPrompt = parsed.data.mode === "training" ? TRAINING_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: parsed.data.text },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const cleaned = content.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim();
    const raw = JSON.parse(cleaned);

    if (parsed.data.mode === "training") {
      const result = TrainingResultSchema.safeParse(raw);
      if (!result.success) {
        return NextResponse.json({ error: "Failed to parse training" }, { status: 500 });
      }
      return NextResponse.json(result.data);
    }

    const items = z.array(ParsedItemSchema).safeParse(raw);
    if (!items.success) {
      return NextResponse.json({ error: "Failed to parse food" }, { status: 500 });
    }

    return NextResponse.json(items.data);
  } catch (err) {
    console.error("Parse API failed:", err);
    return NextResponse.json({ error: "Failed to parse food" }, { status: 500 });
  }
}
