import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const ParseRequestSchema = z.object({
  text: z.string().min(1).max(500),
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

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: parsed.data.text },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const cleaned = content.replace(/^```(?:json)?\n?/g, "").replace(/\n?```$/g, "").trim();
    const raw = JSON.parse(cleaned);

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
