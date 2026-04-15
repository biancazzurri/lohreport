# Training Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add training session logging that increases the daily calorie and macro budget, with ChatGPT-powered calorie burn estimation from free-text activity descriptions.

**Architecture:** New `TrainingSession` type stored in a Dexie table and synced to a Postgres table via the same pattern as meals. The parse API gets a training mode. The (+) button becomes a chooser. Training cards render alongside meals on the home screen. Effective goals = base goals + burned calories.

**Tech Stack:** Same as existing — Next.js (App Router), TypeScript, Tailwind CSS, Dexie.js, OpenAI SDK, Neon Postgres, zod.

---

## File Structure

New files:
- `src/lib/training.ts` — CRUD functions for training sessions
- `src/lib/training-parser.ts` — client-side function to call parse API in training mode
- `src/hooks/use-training-sessions.ts` — live query hook
- `src/app/api/training/route.ts` — server-side API for training sync
- `src/components/training-card.tsx` — training session card component
- `src/components/training-preview.tsx` — preview/confirm screen for parsed training

Modified files:
- `src/lib/types.ts` — add `TrainingSession` interface
- `src/lib/db.ts` — add `trainingSessions` table (version 3)
- `src/lib/db-server.ts` — add `training_sessions` Postgres table
- `src/hooks/use-daily-totals.ts` — include burned calories
- `src/app/api/parse/route.ts` — add training mode
- `src/components/add-button.tsx` — choice between meal/training
- `src/app/add/page.tsx` — handle `type=training` query param
- `src/components/meal-list.tsx` — render mixed list of meals + training
- `src/app/page.tsx` — use effective goals, pass training sessions to list
- `src/lib/sync.ts` — sync training sessions from server

---

### Task 1: Data Model & Database

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db.ts`
- Modify: `src/lib/db-server.ts`

- [ ] **Step 1: Add TrainingSession type**

In `src/lib/types.ts`, add after the `Settings` interface:

```ts
export interface TrainingSession {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  caloriesBurned: number;
  createdAt: number;
}
```

- [ ] **Step 2: Add Dexie table**

In `src/lib/db.ts`, add the table to the class and a version 3 migration:

```ts
import type { Meal, NutritionCacheEntry, Settings, TrainingSession } from "./types";

// Add to class body:
trainingSessions!: Table<TrainingSession, string>;

// Add after version(2):
this.version(3).stores({
  meals: "id, date, createdAt",
  nutritionCache: "key",
  settings: "id",
  dismissedShortcuts: "fingerprint",
  trainingSessions: "id, date, createdAt",
});
```

- [ ] **Step 3: Add Postgres table**

In `src/lib/db-server.ts`, add inside `ensureTables()` after the `user_settings` table:

```ts
await sql`
  CREATE TABLE IF NOT EXISTS training_sessions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT NOT NULL,
    calories_burned REAL NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_training_user_date ON training_sessions (user_email, date)`;
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/db.ts src/lib/db-server.ts
git commit -m "feat: add TrainingSession type and database tables"
```

---

### Task 2: Training CRUD & Hook

**Files:**
- Create: `src/lib/training.ts`
- Create: `src/hooks/use-training-sessions.ts`

- [ ] **Step 1: Create training CRUD**

Create `src/lib/training.ts`:

```ts
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import type { TrainingSession } from "./types";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function addTraining({
  description,
  caloriesBurned,
  date,
  time,
}: {
  description: string;
  caloriesBurned: number;
  date?: string;
  time?: string;
}): Promise<TrainingSession> {
  const session: TrainingSession = {
    id: uuidv4(),
    date: date ?? todayDate(),
    time: time ?? currentTime(),
    description,
    caloriesBurned,
    createdAt: Date.now(),
  };

  await db.trainingSessions.put(session);
  fetch("/api/training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  }).catch((err) => console.error("[sync] training save failed:", err));
  return session;
}

export async function deleteTraining(id: string): Promise<void> {
  await db.trainingSessions.delete(id);
  fetch("/api/training", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch((err) => console.error("[sync] training delete failed:", err));
}
```

- [ ] **Step 2: Create training hook**

Create `src/hooks/use-training-sessions.ts`:

```ts
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { TrainingSession } from "@/lib/types";

export function useTrainingSessions(date: string): TrainingSession[] {
  const sessions = useLiveQuery(
    () => db.trainingSessions.where("date").equals(date).sortBy("time"),
    [date]
  );
  return sessions ?? [];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/training.ts src/hooks/use-training-sessions.ts
git commit -m "feat: add training CRUD and useTrainingSessions hook"
```

---

### Task 3: Training Server API

**Files:**
- Create: `src/app/api/training/route.ts`

- [ ] **Step 1: Create training API route**

Create `src/app/api/training/route.ts` (mirrors the meals API):

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getDb, ensureTables } from "@/lib/db-server";
import { checkRateLimit } from "@/lib/rate-limit";

const TrainingSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  description: z.string().min(1).max(500),
  caloriesBurned: z.number().min(0).max(100_000),
  createdAt: z.number(),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const sql = getDb();
    await ensureTables();

    const rows = since
      ? await sql`SELECT * FROM training_sessions WHERE user_email = ${session.user.email} AND date >= ${since} ORDER BY date DESC, time`
      : await sql`SELECT * FROM training_sessions WHERE user_email = ${session.user.email} ORDER BY date DESC, time`;

    const sessions = rows.map((r) => ({
      id: r.id,
      date: r.date,
      time: r.time,
      description: r.description,
      caloriesBurned: r.calories_burned,
      createdAt: Number(r.created_at),
    }));

    return NextResponse.json(sessions);
  } catch (err) {
    console.error("Training GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch training sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`training:${session.user.email}`, 60_000, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = TrainingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid training data" }, { status: 400 });
    }

    const t = parsed.data;
    const sql = getDb();
    await ensureTables();

    await sql`
      INSERT INTO training_sessions (id, user_email, date, time, description, calories_burned, created_at)
      VALUES (${t.id}, ${session.user.email}, ${t.date}, ${t.time}, ${t.description}, ${t.caloriesBurned}, ${t.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        description = ${t.description},
        calories_burned = ${t.caloriesBurned}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Training POST failed:", err);
    return NextResponse.json({ error: "Failed to save training" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sql = getDb();
    await ensureTables();
    await sql`DELETE FROM training_sessions WHERE id = ${parsed.data.id} AND user_email = ${session.user.email}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Training DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete training" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/training/route.ts
git commit -m "feat: add training sessions server API"
```

---

### Task 4: Sync Training Sessions

**Files:**
- Modify: `src/lib/sync.ts`

- [ ] **Step 1: Add training sync to syncFromServer**

In `src/lib/sync.ts`, add the `TrainingSession` import and sync logic. The updated file:

```ts
import { db } from "./db";
import type { Meal, Settings, TrainingSession } from "./types";

export async function syncFromServer(): Promise<void> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 10);
    const sinceStr = since.toISOString().slice(0, 10);

    // Fetch meals
    const mealsRes = await fetch(`/api/meals?since=${sinceStr}`);
    if (!mealsRes.ok) return;
    const serverMeals: Meal[] = await mealsRes.json();

    // Fetch training sessions
    const trainingRes = await fetch(`/api/training?since=${sinceStr}`);
    const serverTraining: TrainingSession[] = trainingRes.ok ? await trainingRes.json() : [];

    // Fetch settings
    const settingsRes = await fetch("/api/backup");
    const serverSettings = settingsRes.ok ? await settingsRes.json() : null;

    // Merge meals
    const localMeals = await db.meals.toArray();
    const localMealIds = new Set(localMeals.map((m) => m.id));
    for (const meal of serverMeals) {
      if (localMealIds.has(meal.id)) {
        await db.meals.put(meal);
      } else {
        await db.meals.add(meal);
      }
    }

    // Merge training sessions
    const localTraining = await db.trainingSessions.toArray();
    const localTrainingIds = new Set(localTraining.map((t) => t.id));
    for (const session of serverTraining) {
      if (localTrainingIds.has(session.id)) {
        await db.trainingSessions.put(session);
      } else {
        await db.trainingSessions.add(session);
      }
    }

    // Sync settings
    const localSettings = await db.settings.get("settings");
    if (serverSettings && serverSettings.calorieGoal) {
      await db.settings.put({
        id: "settings",
        calorieGoal: serverSettings.calorieGoal,
        proteinGoal: serverSettings.proteinGoal,
        carbsGoal: serverSettings.carbsGoal,
        fatGoal: serverSettings.fatGoal,
        chatgptApiKey: localSettings?.chatgptApiKey ?? "",
      });
    } else if (localSettings && localSettings.calorieGoal !== 2100) {
      await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calorieGoal: localSettings.calorieGoal,
          proteinGoal: localSettings.proteinGoal,
          carbsGoal: localSettings.carbsGoal,
          fatGoal: localSettings.fatGoal,
        }),
      }).catch(() => {});
    }

    console.log("[sync] pulled", serverMeals.length, "meals and", serverTraining.length, "training sessions from server");
  } catch (err) {
    console.error("[sync] failed:", err);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sync.ts
git commit -m "feat: sync training sessions from server"
```

---

### Task 5: Parse API Training Mode

**Files:**
- Modify: `src/app/api/parse/route.ts`
- Create: `src/lib/training-parser.ts`

- [ ] **Step 1: Add training mode to parse API**

In `src/app/api/parse/route.ts`, update the request schema to accept an optional `mode` field, add a training system prompt, and branch on mode:

Update the `ParseRequestSchema`:

```ts
const ParseRequestSchema = z.object({
  text: z.string().min(1).max(500),
  mode: z.enum(["meal", "training"]).default("meal"),
});
```

Add the training system prompt after `SYSTEM_PROMPT`:

```ts
const TRAINING_SYSTEM_PROMPT = `You are a fitness assistant. The user describes a training activity. Estimate the calories burned and return ONLY a valid JSON object. No markdown, no explanation — just the raw JSON.

The JSON must have these fields:
- description: string (clean, normalized description — e.g. "45 min running", "1 hour weight training")
- caloriesBurned: number (estimated calories burned, assume an average adult)

Example output:
{"description":"45 min running","caloriesBurned":450}`;
```

Add a training response schema after `ParsedItemSchema`:

```ts
const TrainingResultSchema = z.object({
  description: z.string().max(200),
  caloriesBurned: z.number().min(0).max(100_000),
});
```

In the `POST` handler, after `const client = new OpenAI({ apiKey });`, replace the single API call block with mode-branched logic:

```ts
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
```

- [ ] **Step 2: Create training parser client**

Create `src/lib/training-parser.ts`:

```ts
interface TrainingParseResult {
  description: string;
  caloriesBurned: number;
}

export async function parseTraining(text: string): Promise<TrainingParseResult> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode: "training" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Parse failed: ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/parse/route.ts src/lib/training-parser.ts
git commit -m "feat: add training mode to parse API"
```

---

### Task 6: Daily Totals with Burned Calories

**Files:**
- Modify: `src/hooks/use-daily-totals.ts`

- [ ] **Step 1: Update useDailyTotals to include burned**

Replace `src/hooks/use-daily-totals.ts` with:

```ts
import { useMeals } from "./use-meals";
import { useTrainingSessions } from "./use-training-sessions";

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burned: number;
}

export function useDailyTotals(date: string): DailyTotals {
  const meals = useMeals(date);
  const training = useTrainingSessions(date);

  const mealTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const burned = training.reduce((sum, s) => sum + s.caloriesBurned, 0);

  return { ...mealTotals, burned };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-daily-totals.ts
git commit -m "feat: include burned calories in daily totals"
```

---

### Task 7: Training Card Component

**Files:**
- Create: `src/components/training-card.tsx`

- [ ] **Step 1: Create training card**

Create `src/components/training-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { TrainingSession } from "@/lib/types";

interface TrainingCardProps {
  session: TrainingSession;
  onDelete: (id: string) => void;
}

export function TrainingCard({ session, onDelete }: TrainingCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#1a3a2a] rounded-[10px] p-3 mb-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-gray-600 shrink-0">{session.time}</span>
            <span className="text-[13px] text-gray-200 truncate">{session.description}</span>
          </div>
          <span className="text-xs text-[#81c784] font-semibold shrink-0 ml-2">
            -{Math.round(session.caloriesBurned)} cal
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex justify-end">
          <button
            onClick={() => onDelete(session.id)}
            className="text-[10px] text-gray-600 hover:text-red-400"
            aria-label="Delete training"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/training-card.tsx
git commit -m "feat: add training card component"
```

---

### Task 8: Training Preview Component

**Files:**
- Create: `src/components/training-preview.tsx`

- [ ] **Step 1: Create training preview**

Create `src/components/training-preview.tsx`:

```tsx
"use client";

interface TrainingPreviewProps {
  description: string;
  caloriesBurned: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrainingPreview({ description, caloriesBurned, onConfirm, onCancel }: TrainingPreviewProps) {
  return (
    <div className="bg-[#252545] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">Estimated Burn</h2>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-200">{description}</span>
          <span className="text-sm text-[#81c784] font-semibold shrink-0 ml-2">
            -{Math.round(caloriesBurned)} cal
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-[#1a1a2e] text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 rounded-xl bg-[#81c784] text-[#1a1a2e] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Log Training
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/training-preview.tsx
git commit -m "feat: add training preview component"
```

---

### Task 9: Add Button Chooser

**Files:**
- Modify: `src/components/add-button.tsx`

- [ ] **Step 1: Update AddButton to show meal/training choice**

Replace `src/components/add-button.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Options */}
      {open && (
        <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-2 items-end">
          <button
            onClick={() => { setOpen(false); router.push("/add"); }}
            className="flex items-center gap-2 bg-[#252545] text-gray-200 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-[#2d2d55] transition-colors"
          >
            Meal
          </button>
          <button
            onClick={() => { setOpen(false); router.push("/add?type=training"); }}
            className="flex items-center gap-2 bg-[#1a3a2a] text-gray-200 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-[#245a3a] transition-colors"
          >
            Training
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4fc3f7] flex items-center justify-center shadow-lg text-[#1a1a2e] text-2xl font-bold hover:bg-[#38b2e0] transition-all z-30 ${open ? "rotate-45" : ""}`}
        aria-label="Add"
      >
        +
      </button>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/add-button.tsx
git commit -m "feat: add button shows meal/training chooser"
```

---

### Task 10: Add Page Training Mode

**Files:**
- Modify: `src/app/add/page.tsx`

- [ ] **Step 1: Update add page to handle training mode**

Replace `src/app/add/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MealInput } from "@/components/meal-input";
import { ShortcutList } from "@/components/shortcut-list";
import { ParsedPreview } from "@/components/parsed-preview";
import { TrainingPreview } from "@/components/training-preview";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { parseFood } from "@/lib/food-parser";
import { parseTraining } from "@/lib/training-parser";
import { addMeal } from "@/lib/meals";
import { addTraining } from "@/lib/training";
import { dismissShortcut } from "@/lib/shortcuts";
import type { MealItem } from "@/lib/types";
import type { Shortcut } from "@/lib/shortcuts";

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTraining = searchParams.get("type") === "training";

  const shortcuts = useShortcuts();
  const [parsedItems, setParsedItems] = useState<MealItem[] | null>(null);
  const [trainingResult, setTrainingResult] = useState<{ description: string; caloriesBurned: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  async function handleTextSubmit(text: string) {
    setLoading(true);
    setError("");
    try {
      if (isTraining) {
        const result = await parseTraining(text);
        setTrainingResult(result);
      } else {
        const items = await parseFood(text);
        setParsedItems(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isTraining ? "Failed to parse training" : "Failed to parse food");
    } finally {
      setLoading(false);
    }
  }

  function handleShortcutSelect(shortcut: Shortcut) {
    setParsedItems(shortcut.items);
  }

  async function handleConfirmMeal(items: MealItem[]) {
    await addMeal({ items });
    router.push("/");
  }

  async function handleConfirmTraining() {
    if (!trainingResult) return;
    await addTraining({
      description: trainingResult.description,
      caloriesBurned: trainingResult.caloriesBurned,
    });
    router.push("/");
  }

  function handleCancel() {
    setParsedItems(null);
    setTrainingResult(null);
  }

  const title = isTraining ? "Add Training" : "Add Meal";
  const placeholder = isTraining ? "What did you do?" : "What did you eat?";
  const analyzingText = isTraining ? "Estimating calories burned..." : "Analyzing your meal...";

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          aria-label="Back"
        >
          &#9664;
        </Link>
        <h1 className="text-base font-semibold text-gray-200">{title}</h1>
      </div>

      {error && (
        <div className="bg-[#f48fb1]/10 text-[#f48fb1] text-sm rounded-lg p-3 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-[#252545]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4fc3f7] animate-spin" />
          </div>
          <span className="text-sm text-gray-500">{analyzingText}</span>
        </div>
      ) : trainingResult ? (
        <TrainingPreview
          description={trainingResult.description}
          caloriesBurned={trainingResult.caloriesBurned}
          onConfirm={handleConfirmTraining}
          onCancel={handleCancel}
        />
      ) : parsedItems ? (
        <ParsedPreview
          items={parsedItems}
          onConfirm={handleConfirmMeal}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <MealInput onSubmit={handleTextSubmit} onTypingChange={setShowingSuggestions} placeholder={placeholder} />
          {!isTraining && (
            <div className={`transition-all duration-200 ${showingSuggestions ? "opacity-30 blur-sm pointer-events-none" : ""}`}>
              <ShortcutList shortcuts={shortcuts} onSelect={handleShortcutSelect} onDismiss={dismissShortcut} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add placeholder prop to MealInput**

In `src/components/meal-input.tsx`, update the props interface and the input element:

Add `placeholder?: string` to `MealInputProps`:

```ts
interface MealInputProps {
  onSubmit: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  placeholder?: string;
}
```

Update the function signature:

```ts
export function MealInput({ onSubmit, onTypingChange, placeholder }: MealInputProps) {
```

Update the `<input>` placeholder attribute:

```tsx
placeholder={placeholder ?? "What did you eat?"}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/add/page.tsx src/components/meal-input.tsx
git commit -m "feat: add page handles training mode"
```

---

### Task 11: Home Screen — Mixed List & Effective Goals

**Files:**
- Modify: `src/components/meal-list.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update MealList to accept training sessions**

Replace `src/components/meal-list.tsx` with:

```tsx
import type { Meal, TrainingSession } from "@/lib/types";
import { MealCard } from "./meal-card";
import { TrainingCard } from "./training-card";

interface MealListProps {
  meals: Meal[];
  trainingSessions: TrainingSession[];
  onDeleteMeal: (id: string) => void;
  onDeleteTraining: (id: string) => void;
}

export function MealList({ meals, trainingSessions, onDeleteMeal, onDeleteTraining }: MealListProps) {
  const mealEntries = meals.map((m) => ({ type: "meal" as const, time: m.time, data: m }));
  const trainingEntries = trainingSessions.map((t) => ({ type: "training" as const, time: t.time, data: t }));
  const all = [...mealEntries, ...trainingEntries].sort((a, b) => a.time.localeCompare(b.time));

  if (all.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No meals logged yet</div>
    );
  }

  return (
    <div className="px-4">
      {all.map((entry) =>
        entry.type === "meal" ? (
          <MealCard key={entry.data.id} meal={entry.data} onDelete={onDeleteMeal} />
        ) : (
          <TrainingCard key={entry.data.id} session={entry.data} onDelete={onDeleteTraining} />
        )
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update home page to use effective goals and pass training data**

In `src/app/page.tsx`, add the training imports at the top:

```ts
import { useTrainingSessions } from "@/hooks/use-training-sessions";
import { deleteTraining } from "@/lib/training";
```

Inside the `Home` component, after `const totals = useDailyTotals(date);`, add:

```ts
const trainingSessions = useTrainingSessions(date);
```

After the existing `const goals = ...` line, compute effective goals. Replace the block starting at `const calPerG` through `adjustedGoals` computation with:

```ts
  const calPerG = { protein: 4, carbs: 4, fat: 9 } as const;
  const effectiveCalorieGoal = settings.calorieGoal + totals.burned;
  const goalScale = settings.calorieGoal > 0 ? effectiveCalorieGoal / settings.calorieGoal : 1;
  const goals = {
    protein: Math.round(settings.proteinGoal * goalScale),
    carbs: Math.round(settings.carbsGoal * goalScale),
    fat: Math.round(settings.fatGoal * goalScale),
  };
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
```

Update the `CalorieRing` to use `effectiveCalorieGoal`:

```tsx
<CalorieRing current={totals.calories} target={effectiveCalorieGoal} />
```

Add a delete handler for training after `handleDelete`:

```ts
async function handleDeleteTraining(id: string) {
  await deleteTraining(id);
}
```

Update the `MealList` usage to pass training data:

```tsx
<MealList
  meals={meals}
  trainingSessions={trainingSessions}
  onDeleteMeal={handleDelete}
  onDeleteTraining={handleDeleteTraining}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/meal-list.tsx src/app/page.tsx
git commit -m "feat: home screen shows training sessions with effective goals"
```
