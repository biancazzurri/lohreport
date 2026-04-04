# Meal Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA for daily meal tracking with macro goals, ChatGPT-powered food parsing, and automatic S3 backup.

**Architecture:** Next.js static PWA with IndexedDB for all local storage. ChatGPT API for parsing free-text food entries into structured nutrition data (cached locally). Auto-backup to S3 with credentials baked into the build. No backend server.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Dexie.js (IndexedDB wrapper), OpenAI SDK (for ChatGPT API), AWS SDK v3 (S3 client), next-pwa, Vitest + React Testing Library.

---

## File Structure

```
health/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, dark theme, mobile viewport
│   │   ├── page.tsx                # Daily view (home screen)
│   │   ├── add/
│   │   │   └── page.tsx            # Add meal screen
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings screen
│   │   └── goals/
│   │       └── page.tsx            # Macro goals calculator
│   ├── components/
│   │   ├── calorie-ring.tsx        # SVG circular progress for calories
│   │   ├── macro-bars.tsx          # P/C/F progress bars
│   │   ├── meal-card.tsx           # Single meal group card
│   │   ├── meal-list.tsx           # Chronological list of meal cards
│   │   ├── date-nav.tsx            # Date navigation (prev/next day)
│   │   ├── add-button.tsx          # Floating + button
│   │   ├── meal-input.tsx          # Text input + autocomplete for add screen
│   │   ├── shortcut-list.tsx       # Recent meal shortcuts list
│   │   ├── parsed-preview.tsx      # Preview of parsed items before logging
│   │   ├── macro-slider.tsx        # Single macro slider (used in goals)
│   │   └── calorie-breakdown.tsx   # Stacked bar for goals calculator
│   ├── lib/
│   │   ├── db.ts                   # Dexie database schema and instance
│   │   ├── meals.ts                # Meal CRUD operations
│   │   ├── settings.ts             # Settings read/write
│   │   ├── shortcuts.ts            # Shortcut ranking and expiry logic
│   │   ├── food-parser.ts          # ChatGPT API integration for food parsing
│   │   ├── nutrition-cache.ts      # Nutrition cache lookup and storage
│   │   ├── backup.ts               # S3 auto-backup and restore
│   │   └── types.ts                # Shared TypeScript types
│   └── hooks/
│       ├── use-meals.ts            # Hook for meals by date
│       ├── use-settings.ts         # Hook for settings
│       ├── use-shortcuts.ts        # Hook for ranked shortcuts
│       └── use-daily-totals.ts     # Hook for daily macro totals
├── scripts/
│   └── setup-s3.ts                 # CLI script for S3 bucket + IAM setup
└── tests/
    ├── lib/
    │   ├── db.test.ts
    │   ├── meals.test.ts
    │   ├── shortcuts.test.ts
    │   ├── food-parser.test.ts
    │   ├── nutrition-cache.test.ts
    │   └── backup.test.ts
    └── components/
        ├── calorie-ring.test.tsx
        ├── macro-bars.test.tsx
        ├── meal-card.test.tsx
        ├── meal-input.test.tsx
        └── parsed-preview.test.tsx
```

---

### Task 1: Project Scaffold and PWA Setup

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `public/manifest.json`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/romansmelyansky/_dev/health
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```
Expected: Project scaffolded with Next.js, TypeScript, Tailwind.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install dexie dexie-react-hooks openai @aws-sdk/client-s3 uuid
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/uuid fake-indexeddb
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Configure PWA manifest**

Replace `public/manifest.json`:

```json
{
  "name": "Health Tracker",
  "short_name": "Health",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 5: Configure dark theme root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Tracker",
  description: "Track your daily meals and macros",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a2e] text-gray-200 min-h-screen max-w-[375px] mx-auto font-sans">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Set up Tailwind globals**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 7: Create placeholder home page**

Replace `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold text-center">Health Tracker</h1>
    </div>
  );
}
```

- [ ] **Step 8: Verify it runs**

Run: `npm run dev`
Expected: App loads at localhost:3000 with dark background and "Health Tracker" text.

- [ ] **Step 9: Initialize git and commit**

Run:
```bash
cd /Users/romansmelyansky/_dev/health
git init
echo "node_modules/\n.next/\n.env.local\n.superpowers/" > .gitignore
git add -A
git commit -m "feat: scaffold Next.js PWA with dark theme"
```

---

### Task 2: Types and Database Layer

**Files:**
- Create: `src/lib/types.ts`, `src/lib/db.ts`
- Test: `tests/lib/db.test.ts`

- [ ] **Step 1: Write the failing test for database schema**

Create `tests/lib/db.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("db", () => {
  it("stores and retrieves a meal", async () => {
    const meal = {
      id: "test-1",
      date: "2026-04-04",
      time: "08:30",
      items: [
        {
          rawText: "200g cottage cheese",
          name: "cottage cheese",
          quantity: 200,
          unit: "g",
          calories: 206,
          protein: 28,
          carbs: 6,
          fat: 9,
          parsed: true,
        },
      ],
      totalCalories: 206,
      totalProtein: 28,
      totalCarbs: 6,
      totalFat: 9,
      createdAt: Date.now(),
    };

    await db.meals.add(meal);
    const retrieved = await db.meals.get("test-1");
    expect(retrieved).toEqual(meal);
  });

  it("stores and retrieves a nutrition cache entry", async () => {
    const entry = {
      key: "200g cottage cheese",
      name: "cottage cheese",
      quantity: 200,
      unit: "g",
      calories: 206,
      protein: 28,
      carbs: 6,
      fat: 9,
      cachedAt: Date.now(),
    };

    await db.nutritionCache.add(entry);
    const retrieved = await db.nutritionCache.get("200g cottage cheese");
    expect(retrieved).toEqual(entry);
  });

  it("stores and retrieves settings", async () => {
    await db.settings.put({
      id: "default",
      calorieGoal: 2100,
      proteinGoal: 150,
      carbsGoal: 220,
      fatGoal: 70,
      chatgptApiKey: "sk-test",
    });

    const settings = await db.settings.get("default");
    expect(settings?.calorieGoal).toBe(2100);
  });

  it("queries meals by date", async () => {
    await db.meals.bulkAdd([
      {
        id: "m1",
        date: "2026-04-04",
        time: "08:30",
        items: [],
        totalCalories: 100,
        totalProtein: 10,
        totalCarbs: 10,
        totalFat: 5,
        createdAt: Date.now(),
      },
      {
        id: "m2",
        date: "2026-04-04",
        time: "13:00",
        items: [],
        totalCalories: 200,
        totalProtein: 20,
        totalCarbs: 20,
        totalFat: 10,
        createdAt: Date.now(),
      },
      {
        id: "m3",
        date: "2026-04-05",
        time: "09:00",
        items: [],
        totalCalories: 300,
        totalProtein: 30,
        totalCarbs: 30,
        totalFat: 15,
        createdAt: Date.now(),
      },
    ]);

    const todayMeals = await db.meals.where("date").equals("2026-04-04").toArray();
    expect(todayMeals).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/db.test.ts`
Expected: FAIL — cannot resolve `@/lib/db`

- [ ] **Step 3: Create types**

Create `src/lib/types.ts`:

```typescript
export interface MealItem {
  rawText: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  parsed: boolean;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: number;
}

export interface NutritionCacheEntry {
  key: string; // normalized food description
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cachedAt: number;
}

export interface Settings {
  id: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  chatgptApiKey: string;
}
```

- [ ] **Step 4: Create Dexie database**

Create `src/lib/db.ts`:

```typescript
import Dexie, { type EntityTable } from "dexie";
import type { Meal, NutritionCacheEntry, Settings } from "./types";

const db = new Dexie("HealthTracker") as Dexie & {
  meals: EntityTable<Meal, "id">;
  nutritionCache: EntityTable<NutritionCacheEntry, "key">;
  settings: EntityTable<Settings, "id">;
};

db.version(1).stores({
  meals: "id, date, createdAt",
  nutritionCache: "key",
  settings: "id",
});

export { db };
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/lib/db.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/db.ts tests/lib/db.test.ts tests/setup.ts vitest.config.ts
git commit -m "feat: add TypeScript types and Dexie database schema"
```

---

### Task 3: Meal CRUD Operations

**Files:**
- Create: `src/lib/meals.ts`
- Test: `tests/lib/meals.test.ts`

- [ ] **Step 1: Write failing tests for meal operations**

Create `tests/lib/meals.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { addMeal, getMealsByDate, deleteMeal, updateMeal } from "@/lib/meals";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("addMeal", () => {
  it("creates a meal with computed totals", async () => {
    const meal = await addMeal({
      items: [
        { rawText: "200g cottage cheese", name: "cottage cheese", quantity: 200, unit: "g", calories: 206, protein: 28, carbs: 6, fat: 9, parsed: true },
        { rawText: "3 corn crackers", name: "corn crackers", quantity: 3, unit: "piece", calories: 314, protein: 4, carbs: 62, fat: 6, parsed: true },
      ],
    });

    expect(meal.totalCalories).toBe(520);
    expect(meal.totalProtein).toBe(32);
    expect(meal.totalCarbs).toBe(68);
    expect(meal.totalFat).toBe(15);
    expect(meal.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(meal.time).toMatch(/^\d{2}:\d{2}$/);
    expect(meal.id).toBeTruthy();
  });
});

describe("getMealsByDate", () => {
  it("returns meals for a specific date sorted by time", async () => {
    await addMeal({ items: [{ rawText: "lunch", name: "lunch", quantity: 1, unit: "meal", calories: 500, protein: 30, carbs: 50, fat: 20, parsed: true }], date: "2026-04-04", time: "13:00" });
    await addMeal({ items: [{ rawText: "breakfast", name: "breakfast", quantity: 1, unit: "meal", calories: 300, protein: 20, carbs: 30, fat: 10, parsed: true }], date: "2026-04-04", time: "08:00" });
    await addMeal({ items: [{ rawText: "other day", name: "other", quantity: 1, unit: "meal", calories: 100, protein: 10, carbs: 10, fat: 5, parsed: true }], date: "2026-04-05", time: "09:00" });

    const meals = await getMealsByDate("2026-04-04");
    expect(meals).toHaveLength(2);
    expect(meals[0].time).toBe("08:00");
    expect(meals[1].time).toBe("13:00");
  });
});

describe("deleteMeal", () => {
  it("removes a meal by id", async () => {
    const meal = await addMeal({ items: [{ rawText: "test", name: "test", quantity: 1, unit: "piece", calories: 100, protein: 10, carbs: 10, fat: 5, parsed: true }] });
    await deleteMeal(meal.id);
    const meals = await getMealsByDate(meal.date);
    expect(meals).toHaveLength(0);
  });
});

describe("updateMeal", () => {
  it("updates items and recomputes totals", async () => {
    const meal = await addMeal({ items: [{ rawText: "test", name: "test", quantity: 1, unit: "piece", calories: 100, protein: 10, carbs: 10, fat: 5, parsed: true }] });
    const updated = await updateMeal(meal.id, {
      items: [{ rawText: "bigger test", name: "bigger test", quantity: 2, unit: "piece", calories: 300, protein: 30, carbs: 30, fat: 15, parsed: true }],
    });
    expect(updated.totalCalories).toBe(300);
    expect(updated.totalProtein).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/meals.test.ts`
Expected: FAIL — cannot resolve `@/lib/meals`

- [ ] **Step 3: Implement meal operations**

Create `src/lib/meals.ts`:

```typescript
import { v4 as uuid } from "uuid";
import { db } from "./db";
import type { Meal, MealItem } from "./types";

function computeTotals(items: MealItem[]) {
  return {
    totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
    totalProtein: items.reduce((sum, i) => sum + i.protein, 0),
    totalCarbs: items.reduce((sum, i) => sum + i.carbs, 0),
    totalFat: items.reduce((sum, i) => sum + i.fat, 0),
  };
}

function nowDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export async function addMeal(input: {
  items: MealItem[];
  date?: string;
  time?: string;
}): Promise<Meal> {
  const meal: Meal = {
    id: uuid(),
    date: input.date ?? nowDate(),
    time: input.time ?? nowTime(),
    items: input.items,
    ...computeTotals(input.items),
    createdAt: Date.now(),
  };
  await db.meals.add(meal);
  return meal;
}

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const meals = await db.meals.where("date").equals(date).toArray();
  return meals.sort((a, b) => a.time.localeCompare(b.time));
}

export async function deleteMeal(id: string): Promise<void> {
  await db.meals.delete(id);
}

export async function updateMeal(
  id: string,
  updates: { items?: MealItem[] }
): Promise<Meal> {
  const existing = await db.meals.get(id);
  if (!existing) throw new Error(`Meal ${id} not found`);

  const items = updates.items ?? existing.items;
  const updated: Meal = {
    ...existing,
    items,
    ...computeTotals(items),
  };
  await db.meals.put(updated);
  return updated;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/meals.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/meals.ts tests/lib/meals.test.ts
git commit -m "feat: add meal CRUD operations with computed totals"
```

---

### Task 4: Settings and Nutrition Cache

**Files:**
- Create: `src/lib/settings.ts`, `src/lib/nutrition-cache.ts`
- Test: `tests/lib/nutrition-cache.test.ts`

- [ ] **Step 1: Write failing test for nutrition cache**

Create `tests/lib/nutrition-cache.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { cacheNutrition, lookupCache } from "@/lib/nutrition-cache";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("cacheNutrition", () => {
  it("stores a parsed food item in cache", async () => {
    await cacheNutrition({
      key: "200g cottage cheese",
      name: "cottage cheese",
      quantity: 200,
      unit: "g",
      calories: 206,
      protein: 28,
      carbs: 6,
      fat: 9,
    });

    const entry = await db.nutritionCache.get("200g cottage cheese");
    expect(entry?.calories).toBe(206);
    expect(entry?.cachedAt).toBeGreaterThan(0);
  });
});

describe("lookupCache", () => {
  it("returns exact match from cache", async () => {
    await cacheNutrition({
      key: "200g cottage cheese",
      name: "cottage cheese",
      quantity: 200,
      unit: "g",
      calories: 206,
      protein: 28,
      carbs: 6,
      fat: 9,
    });

    const result = await lookupCache("200g cottage cheese");
    expect(result).not.toBeNull();
    expect(result?.calories).toBe(206);
  });

  it("returns null for cache miss", async () => {
    const result = await lookupCache("something unknown");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/nutrition-cache.test.ts`
Expected: FAIL — cannot resolve `@/lib/nutrition-cache`

- [ ] **Step 3: Implement nutrition cache**

Create `src/lib/nutrition-cache.ts`:

```typescript
import { db } from "./db";
import type { NutritionCacheEntry } from "./types";

export async function cacheNutrition(
  entry: Omit<NutritionCacheEntry, "cachedAt">
): Promise<void> {
  await db.nutritionCache.put({
    ...entry,
    cachedAt: Date.now(),
  });
}

export async function lookupCache(
  key: string
): Promise<NutritionCacheEntry | null> {
  const entry = await db.nutritionCache.get(key);
  return entry ?? null;
}

export async function getAllCachedFoods(): Promise<NutritionCacheEntry[]> {
  return db.nutritionCache.toArray();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/nutrition-cache.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Implement settings**

Create `src/lib/settings.ts`:

```typescript
import { db } from "./db";
import type { Settings } from "./types";

const DEFAULT_SETTINGS: Settings = {
  id: "default",
  calorieGoal: 2100,
  proteinGoal: 150,
  carbsGoal: 220,
  fatGoal: 70,
  chatgptApiKey: "",
};

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get("default");
  return settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(
  updates: Partial<Omit<Settings, "id">>
): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...updates };
  await db.settings.put(updated);
  return updated;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/nutrition-cache.ts src/lib/settings.ts tests/lib/nutrition-cache.test.ts
git commit -m "feat: add nutrition cache and settings layer"
```

---

### Task 5: Shortcut Ranking Logic

**Files:**
- Create: `src/lib/shortcuts.ts`
- Test: `tests/lib/shortcuts.test.ts`

- [ ] **Step 1: Write failing tests for shortcut ranking**

Create `tests/lib/shortcuts.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { addMeal } from "@/lib/meals";
import { getShortcuts } from "@/lib/shortcuts";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const items = [
  { rawText: "200g cottage cheese", name: "cottage cheese", quantity: 200, unit: "g", calories: 206, protein: 28, carbs: 6, fat: 9, parsed: true },
  { rawText: "3 corn crackers", name: "corn crackers", quantity: 3, unit: "piece", calories: 314, protein: 4, carbs: 62, fat: 6, parsed: true },
];

describe("getShortcuts", () => {
  it("returns recent meals as shortcuts", async () => {
    await addMeal({ items, date: "2026-04-04", time: "08:30" });

    const shortcuts = await getShortcuts();
    expect(shortcuts).toHaveLength(1);
    expect(shortcuts[0].items).toHaveLength(2);
    expect(shortcuts[0].totalCalories).toBe(520);
  });

  it("ranks more frequent meals higher", async () => {
    const rareItems = [{ rawText: "banana", name: "banana", quantity: 1, unit: "piece", calories: 105, protein: 1, carbs: 27, fat: 0, parsed: true }];

    await addMeal({ items, date: "2026-04-01", time: "08:00" });
    await addMeal({ items, date: "2026-04-02", time: "08:00" });
    await addMeal({ items, date: "2026-04-03", time: "08:00" });
    await addMeal({ items: rareItems, date: "2026-04-04", time: "08:00" });

    const shortcuts = await getShortcuts();
    expect(shortcuts[0].totalCalories).toBe(520); // cottage+crackers ranked first
  });

  it("excludes meals older than 7 days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T08:00:00"));
    await addMeal({ items, date: "2026-04-01", time: "08:00" });

    vi.setSystemTime(new Date("2026-04-09T08:00:00"));
    const shortcuts = await getShortcuts();
    expect(shortcuts).toHaveLength(0);
    vi.useRealTimers();
  });

  it("deduplicates identical meals", async () => {
    await addMeal({ items, date: "2026-04-03", time: "08:00" });
    await addMeal({ items, date: "2026-04-04", time: "08:00" });

    const shortcuts = await getShortcuts();
    expect(shortcuts).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/shortcuts.test.ts`
Expected: FAIL — cannot resolve `@/lib/shortcuts`

- [ ] **Step 3: Implement shortcut ranking**

Create `src/lib/shortcuts.ts`:

```typescript
import { db } from "./db";
import type { Meal } from "./types";

const EXPIRY_DAYS = 7;
const MAX_SHORTCUTS = 10;

function mealFingerprint(meal: Meal): string {
  return meal.items
    .map((i) => i.rawText.toLowerCase().trim())
    .sort()
    .join("|");
}

export interface Shortcut {
  fingerprint: string;
  items: Meal["items"];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  count: number;
  lastUsed: number;
}

export async function getShortcuts(): Promise<Shortcut[]> {
  const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const recentMeals = await db.meals
    .where("createdAt")
    .above(cutoff)
    .toArray();

  const grouped = new Map<string, { meal: Meal; count: number; lastUsed: number }>();

  for (const meal of recentMeals) {
    if (meal.items.length === 0) continue;
    const fp = mealFingerprint(meal);
    const existing = grouped.get(fp);
    if (existing) {
      existing.count++;
      existing.lastUsed = Math.max(existing.lastUsed, meal.createdAt);
    } else {
      grouped.set(fp, { meal, count: 1, lastUsed: meal.createdAt });
    }
  }

  const shortcuts: Shortcut[] = Array.from(grouped.entries()).map(
    ([fingerprint, { meal, count, lastUsed }]) => ({
      fingerprint,
      items: meal.items,
      totalCalories: meal.totalCalories,
      totalProtein: meal.totalProtein,
      totalCarbs: meal.totalCarbs,
      totalFat: meal.totalFat,
      count,
      lastUsed,
    })
  );

  // Sort by count (desc), then by lastUsed (desc)
  shortcuts.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);

  return shortcuts.slice(0, MAX_SHORTCUTS);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/shortcuts.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shortcuts.ts tests/lib/shortcuts.test.ts
git commit -m "feat: add smart shortcut ranking with recency and frequency"
```

---

### Task 6: ChatGPT Food Parser

**Files:**
- Create: `src/lib/food-parser.ts`
- Test: `tests/lib/food-parser.test.ts`

- [ ] **Step 1: Write failing tests for food parser**

Create `tests/lib/food-parser.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { parseFood } from "@/lib/food-parser";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

// Mock the OpenAI SDK
vi.mock("openai", () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify([
                    { name: "cottage cheese", quantity: 200, unit: "g", calories: 206, protein: 28, carbs: 6, fat: 9 },
                    { name: "corn crackers", quantity: 3, unit: "piece", calories: 314, protein: 4, carbs: 62, fat: 6 },
                  ]),
                },
              },
            ],
          }),
        },
      };
    },
  };
});

describe("parseFood", () => {
  it("parses free text into structured food items", async () => {
    await db.settings.put({
      id: "default",
      calorieGoal: 2100,
      proteinGoal: 150,
      carbsGoal: 220,
      fatGoal: 70,
      chatgptApiKey: "sk-test-key",
    });

    const items = await parseFood("200g cottage cheese and 3 corn crackers");
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe("cottage cheese");
    expect(items[0].calories).toBe(206);
    expect(items[0].parsed).toBe(true);
    expect(items[1].name).toBe("corn crackers");
  });

  it("returns unparsed items when offline", async () => {
    await db.settings.put({
      id: "default",
      calorieGoal: 2100,
      proteinGoal: 150,
      carbsGoal: 220,
      fatGoal: 70,
      chatgptApiKey: "",
    });

    const items = await parseFood("200g cottage cheese");
    expect(items).toHaveLength(1);
    expect(items[0].parsed).toBe(false);
    expect(items[0].rawText).toBe("200g cottage cheese");
    expect(items[0].calories).toBe(0);
  });

  it("uses cached results when available", async () => {
    await db.nutritionCache.put({
      key: "200g cottage cheese",
      name: "cottage cheese",
      quantity: 200,
      unit: "g",
      calories: 206,
      protein: 28,
      carbs: 6,
      fat: 9,
      cachedAt: Date.now(),
    });

    // No API key needed — should use cache
    const items = await parseFood("200g cottage cheese");
    expect(items).toHaveLength(1);
    expect(items[0].parsed).toBe(true);
    expect(items[0].calories).toBe(206);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/food-parser.test.ts`
Expected: FAIL — cannot resolve `@/lib/food-parser`

- [ ] **Step 3: Implement food parser**

Create `src/lib/food-parser.ts`:

```typescript
import OpenAI from "openai";
import { getSettings } from "./settings";
import { lookupCache, cacheNutrition } from "./nutrition-cache";
import type { MealItem } from "./types";

const SYSTEM_PROMPT = `You are a nutrition parser. Given a free-text description of food, return a JSON array of items. Each item must have:
- name (string): the food name
- quantity (number): the amount
- unit (string): the unit (g, ml, piece, cup, etc.)
- calories (number): estimated total calories for the given quantity
- protein (number): grams of protein
- carbs (number): grams of carbohydrates
- fat (number): grams of fat

Return ONLY valid JSON, no other text. Example:
Input: "200g cottage cheese and 3 corn crackers"
Output: [{"name":"cottage cheese","quantity":200,"unit":"g","calories":206,"protein":28,"carbs":6,"fat":9},{"name":"corn crackers","quantity":3,"unit":"piece","calories":314,"protein":4,"carbs":62,"fat":6}]`;

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function parseFood(text: string): Promise<MealItem[]> {
  const trimmed = text.trim();

  // Check cache for exact match (single-item input)
  const cached = await lookupCache(trimmed);
  if (cached) {
    return [
      {
        rawText: trimmed,
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

  // Try API
  const settings = await getSettings();
  if (!settings.chatgptApiKey) {
    return [
      {
        rawText: trimmed,
        name: trimmed,
        quantity: 0,
        unit: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        parsed: false,
      },
    ];
  }

  try {
    const client = new OpenAI({
      apiKey: settings.chatgptApiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from API");

    const parsed: ParsedItem[] = JSON.parse(content);

    const items: MealItem[] = parsed.map((p) => ({
      rawText: `${p.quantity}${p.unit} ${p.name}`,
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      calories: p.calories,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
      parsed: true,
    }));

    // Cache each item
    for (const item of items) {
      await cacheNutrition({
        key: item.rawText,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      });
    }

    return items;
  } catch {
    return [
      {
        rawText: trimmed,
        name: trimmed,
        quantity: 0,
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/food-parser.test.ts`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/food-parser.ts tests/lib/food-parser.test.ts
git commit -m "feat: add ChatGPT food parser with caching and offline fallback"
```

---

### Task 7: S3 Backup Module

**Files:**
- Create: `src/lib/backup.ts`
- Test: `tests/lib/backup.test.ts`

- [ ] **Step 1: Write failing tests for backup**

Create `tests/lib/backup.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { exportData, importData } from "@/lib/backup";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("exportData", () => {
  it("exports all data as JSON", async () => {
    await db.meals.add({
      id: "m1",
      date: "2026-04-04",
      time: "08:30",
      items: [],
      totalCalories: 100,
      totalProtein: 10,
      totalCarbs: 10,
      totalFat: 5,
      createdAt: Date.now(),
    });
    await db.settings.put({
      id: "default",
      calorieGoal: 2100,
      proteinGoal: 150,
      carbsGoal: 220,
      fatGoal: 70,
      chatgptApiKey: "sk-test",
    });

    const data = await exportData();
    const parsed = JSON.parse(data);
    expect(parsed.meals).toHaveLength(1);
    expect(parsed.settings).toHaveLength(1);
    expect(parsed.nutritionCache).toBeDefined();
  });
});

describe("importData", () => {
  it("replaces local data with imported data", async () => {
    await db.meals.add({
      id: "old",
      date: "2026-04-01",
      time: "08:00",
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      createdAt: Date.now(),
    });

    const importJson = JSON.stringify({
      meals: [
        { id: "new", date: "2026-04-04", time: "12:00", items: [], totalCalories: 500, totalProtein: 30, totalCarbs: 50, totalFat: 20, createdAt: Date.now() },
      ],
      nutritionCache: [],
      settings: [{ id: "default", calorieGoal: 2000, proteinGoal: 140, carbsGoal: 200, fatGoal: 65, chatgptApiKey: "" }],
    });

    await importData(importJson);

    const meals = await db.meals.toArray();
    expect(meals).toHaveLength(1);
    expect(meals[0].id).toBe("new");

    const settings = await db.settings.get("default");
    expect(settings?.calorieGoal).toBe(2000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/backup.test.ts`
Expected: FAIL — cannot resolve `@/lib/backup`

- [ ] **Step 3: Implement backup module**

Create `src/lib/backup.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db";

const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET ?? "";
const S3_REGION = process.env.NEXT_PUBLIC_S3_REGION ?? "us-east-1";
const S3_ACCESS_KEY = process.env.NEXT_PUBLIC_S3_ACCESS_KEY ?? "";
const S3_SECRET_KEY = process.env.NEXT_PUBLIC_S3_SECRET_KEY ?? "";

function getS3Client(): S3Client | null {
  if (!S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) return null;
  return new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
  });
}

export async function exportData(): Promise<string> {
  const [meals, nutritionCache, settings] = await Promise.all([
    db.meals.toArray(),
    db.nutritionCache.toArray(),
    db.settings.toArray(),
  ]);
  return JSON.stringify({ meals, nutritionCache, settings });
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json);
  await db.transaction("rw", db.meals, db.nutritionCache, db.settings, async () => {
    await db.meals.clear();
    await db.nutritionCache.clear();
    await db.settings.clear();
    if (data.meals?.length) await db.meals.bulkAdd(data.meals);
    if (data.nutritionCache?.length) await db.nutritionCache.bulkAdd(data.nutritionCache);
    if (data.settings?.length) await db.settings.bulkAdd(data.settings);
  });
}

export async function uploadBackup(): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  try {
    const data = await exportData();
    const now = new Date().toISOString().replace(/[:.]/g, "-");

    await Promise.all([
      client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: "health-backup/latest.json",
          Body: data,
          ContentType: "application/json",
        })
      ),
      client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: `health-backup/archive/${now}.json`,
          Body: data,
          ContentType: "application/json",
        })
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function downloadBackup(): Promise<string | null> {
  const client = getS3Client();
  if (!client) return null;

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: "health-backup/latest.json",
      })
    );
    return (await response.Body?.transformToString()) ?? null;
  } catch {
    return null;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleBackup(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    uploadBackup();
  }, 5000);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/backup.test.ts`
Expected: All 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup.ts tests/lib/backup.test.ts
git commit -m "feat: add S3 backup with auto-upload debounce and restore"
```

---

### Task 8: React Hooks

**Files:**
- Create: `src/hooks/use-meals.ts`, `src/hooks/use-settings.ts`, `src/hooks/use-shortcuts.ts`, `src/hooks/use-daily-totals.ts`

- [ ] **Step 1: Create use-meals hook**

Create `src/hooks/use-meals.ts`:

```typescript
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Meal } from "@/lib/types";

export function useMeals(date: string): Meal[] {
  const meals = useLiveQuery(
    () => db.meals.where("date").equals(date).sortBy("time"),
    [date]
  );
  return meals ?? [];
}
```

- [ ] **Step 2: Create use-settings hook**

Create `src/hooks/use-settings.ts`:

```typescript
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Settings } from "@/lib/types";

const DEFAULTS: Settings = {
  id: "default",
  calorieGoal: 2100,
  proteinGoal: 150,
  carbsGoal: 220,
  fatGoal: 70,
  chatgptApiKey: "",
};

export function useSettings(): Settings {
  const settings = useLiveQuery(() => db.settings.get("default"));
  return settings ?? DEFAULTS;
}
```

- [ ] **Step 3: Create use-daily-totals hook**

Create `src/hooks/use-daily-totals.ts`:

```typescript
import { useMeals } from "./use-meals";

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function useDailyTotals(date: string): DailyTotals {
  const meals = useMeals(date);
  return {
    calories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
    protein: meals.reduce((sum, m) => sum + m.totalProtein, 0),
    carbs: meals.reduce((sum, m) => sum + m.totalCarbs, 0),
    fat: meals.reduce((sum, m) => sum + m.totalFat, 0),
  };
}
```

- [ ] **Step 4: Create use-shortcuts hook**

Create `src/hooks/use-shortcuts.ts`:

```typescript
import { useLiveQuery } from "dexie-react-hooks";
import { getShortcuts, type Shortcut } from "@/lib/shortcuts";
import { db } from "@/lib/db";

export function useShortcuts(): Shortcut[] {
  // Re-run when meals table changes
  const shortcuts = useLiveQuery(
    () => getShortcuts(),
    [],
    []
  );
  return shortcuts ?? [];
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React hooks for meals, settings, totals, and shortcuts"
```

---

### Task 9: Calorie Ring and Macro Bars Components

**Files:**
- Create: `src/components/calorie-ring.tsx`, `src/components/macro-bars.tsx`
- Test: `tests/components/calorie-ring.test.tsx`, `tests/components/macro-bars.test.tsx`

- [ ] **Step 1: Write failing test for calorie ring**

Create `tests/components/calorie-ring.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalorieRing } from "@/components/calorie-ring";

describe("CalorieRing", () => {
  it("renders current and target calories", () => {
    render(<CalorieRing current={1240} target={2100} />);
    expect(screen.getByText("1,240")).toBeInTheDocument();
    expect(screen.getByText("/ 2,100 cal")).toBeInTheDocument();
  });

  it("handles zero target without error", () => {
    render(<CalorieRing current={0} target={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/calorie-ring.test.tsx`
Expected: FAIL — cannot resolve `@/components/calorie-ring`

- [ ] **Step 3: Implement calorie ring**

Create `src/components/calorie-ring.tsx`:

```tsx
const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

export function CalorieRing({ current, target }: { current: number; target: number }) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex justify-center mb-3.5">
      <div className="relative inline-block w-[120px] h-[120px]">
        <svg viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#252545" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#4fc3f7"
            strokeWidth="10"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-[22px] font-bold">{current.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">/ {target.toLocaleString()} cal</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/calorie-ring.test.tsx`
Expected: All 2 tests PASS.

- [ ] **Step 5: Write failing test for macro bars**

Create `tests/components/macro-bars.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MacroBars } from "@/components/macro-bars";

describe("MacroBars", () => {
  it("renders all three macros with current/target", () => {
    render(
      <MacroBars
        protein={{ current: 92, target: 150 }}
        carbs={{ current: 130, target: 220 }}
        fat={{ current: 48, target: 70 }}
      />
    );
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("92/150g")).toBeInTheDocument();
    expect(screen.getByText("Carbs")).toBeInTheDocument();
    expect(screen.getByText("130/220g")).toBeInTheDocument();
    expect(screen.getByText("Fat")).toBeInTheDocument();
    expect(screen.getByText("48/70g")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/components/macro-bars.test.tsx`
Expected: FAIL — cannot resolve `@/components/macro-bars`

- [ ] **Step 7: Implement macro bars**

Create `src/components/macro-bars.tsx`:

```tsx
interface MacroValue {
  current: number;
  target: number;
}

function Bar({ label, value, color }: { label: string; value: MacroValue; color: string }) {
  const pct = value.target > 0 ? Math.min((value.current / value.target) * 100, 100) : 0;

  return (
    <div className="flex-1 text-center">
      <div className="text-[10px]" style={{ color }}>{label}</div>
      <div className="text-[13px] font-semibold">{value.current}/{value.target}g</div>
      <div className="bg-[#333] rounded-sm h-1 mt-1">
        <div className="rounded-sm h-1" style={{ background: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MacroBars({
  protein,
  carbs,
  fat,
}: {
  protein: MacroValue;
  carbs: MacroValue;
  fat: MacroValue;
}) {
  return (
    <div className="flex gap-2 mb-5 px-2">
      <Bar label="Protein" value={protein} color="#81c784" />
      <Bar label="Carbs" value={carbs} color="#ffb74d" />
      <Bar label="Fat" value={fat} color="#f48fb1" />
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/components/macro-bars.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/calorie-ring.tsx src/components/macro-bars.tsx tests/components/
git commit -m "feat: add CalorieRing and MacroBars components"
```

---

### Task 10: Meal Card and Meal List Components

**Files:**
- Create: `src/components/meal-card.tsx`, `src/components/meal-list.tsx`, `src/components/date-nav.tsx`, `src/components/add-button.tsx`
- Test: `tests/components/meal-card.test.tsx`

- [ ] **Step 1: Write failing test for meal card**

Create `tests/components/meal-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MealCard } from "@/components/meal-card";
import type { Meal } from "@/lib/types";

const meal: Meal = {
  id: "m1",
  date: "2026-04-04",
  time: "08:30",
  items: [
    { rawText: "200g cottage cheese", name: "cottage cheese", quantity: 200, unit: "g", calories: 206, protein: 28, carbs: 6, fat: 9, parsed: true },
    { rawText: "3 corn crackers", name: "corn crackers", quantity: 3, unit: "piece", calories: 314, protein: 4, carbs: 62, fat: 6, parsed: true },
  ],
  totalCalories: 520,
  totalProtein: 32,
  totalCarbs: 68,
  totalFat: 15,
  createdAt: Date.now(),
};

describe("MealCard", () => {
  it("renders meal time and total calories", () => {
    render(<MealCard meal={meal} onDelete={vi.fn()} />);
    expect(screen.getByText("8:30")).toBeInTheDocument();
    expect(screen.getByText("520 cal")).toBeInTheDocument();
  });

  it("renders all food items", () => {
    render(<MealCard meal={meal} onDelete={vi.fn()} />);
    expect(screen.getByText("200g cottage cheese")).toBeInTheDocument();
    expect(screen.getByText("3 corn crackers")).toBeInTheDocument();
  });

  it("renders per-item macros", () => {
    render(<MealCard meal={meal} onDelete={vi.fn()} />);
    expect(screen.getByText("206 cal")).toBeInTheDocument();
    expect(screen.getByText("314 cal")).toBeInTheDocument();
  });

  it("renders meal total macros", () => {
    render(<MealCard meal={meal} onDelete={vi.fn()} />);
    expect(screen.getByText("P 32g")).toBeInTheDocument();
    expect(screen.getByText("C 68g")).toBeInTheDocument();
    expect(screen.getByText("F 15g")).toBeInTheDocument();
  });

  it("shows pending indicator for unparsed items", () => {
    const unparsedMeal: Meal = {
      ...meal,
      items: [{ rawText: "something new", name: "something new", quantity: 0, unit: "", calories: 0, protein: 0, carbs: 0, fat: 0, parsed: false }],
    };
    render(<MealCard meal={unparsedMeal} onDelete={vi.fn()} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/meal-card.test.tsx`
Expected: FAIL — cannot resolve `@/components/meal-card`

- [ ] **Step 3: Implement meal card**

Create `src/components/meal-card.tsx`:

```tsx
"use client";

import type { Meal } from "@/lib/types";

export function MealCard({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  return (
    <div className="bg-[#252545] rounded-[10px] p-3 mb-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] text-gray-600">{meal.time}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4fc3f7] font-semibold">{meal.totalCalories} cal</span>
          <button
            onClick={() => onDelete(meal.id)}
            className="text-[10px] text-gray-600 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Items */}
      {meal.items.map((item, i) => (
        <div
          key={i}
          className={i < meal.items.length - 1 ? "mb-2 pb-2 border-b border-white/[0.06]" : ""}
        >
          <div className="flex justify-between items-baseline mb-0.5">
            <span className="text-[13px]">{item.rawText}</span>
            {item.parsed ? (
              <span className="text-[11px] text-gray-500">{item.calories} cal</span>
            ) : (
              <span className="text-[10px] text-yellow-600 italic">pending</span>
            )}
          </div>
          {item.parsed && (
            <div className="flex gap-3 text-[10px] text-gray-500">
              <span><span className="text-[#81c784]">P</span> {item.protein}g</span>
              <span><span className="text-[#ffb74d]">C</span> {item.carbs}g</span>
              <span><span className="text-[#f48fb1]">F</span> {item.fat}g</span>
            </div>
          )}
        </div>
      ))}

      {/* Meal total */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex gap-3 text-[10px] font-semibold">
        <span className="text-[#81c784]">P {meal.totalProtein}g</span>
        <span className="text-[#ffb74d]">C {meal.totalCarbs}g</span>
        <span className="text-[#f48fb1]">F {meal.totalFat}g</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/meal-card.test.tsx`
Expected: All 5 tests PASS.

- [ ] **Step 5: Implement supporting components**

Create `src/components/meal-list.tsx`:

```tsx
"use client";

import type { Meal } from "@/lib/types";
import { MealCard } from "./meal-card";

export function MealList({ meals, onDelete }: { meals: Meal[]; onDelete: (id: string) => void }) {
  if (meals.length === 0) {
    return (
      <div className="text-center text-gray-600 text-sm py-8">
        No meals logged yet. Tap + to add one.
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2 pl-1">
        Today&apos;s Log
      </div>
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

Create `src/components/date-nav.tsx`:

```tsx
"use client";

export function DateNav({
  date,
  onPrev,
  onNext,
}: {
  date: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const d = new Date(date + "T00:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  const label = isToday
    ? `Today, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="flex justify-between items-center mb-4">
      <button onClick={onPrev} className="text-[15px] text-gray-500 p-2">◀</button>
      <span className="font-semibold text-[15px]">{label}</span>
      <button onClick={onNext} className="text-[15px] text-gray-500 p-2">▶</button>
    </div>
  );
}
```

Create `src/components/add-button.tsx`:

```tsx
"use client";

import Link from "next/link";

export function AddButton() {
  return (
    <div className="text-center mt-4">
      <Link
        href="/add"
        className="bg-[#4fc3f7] text-[#1a1a2e] rounded-full w-[52px] h-[52px] inline-flex items-center justify-center text-[26px] font-bold shadow-[0_4px_12px_rgba(79,195,247,0.3)]"
      >
        +
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/meal-card.tsx src/components/meal-list.tsx src/components/date-nav.tsx src/components/add-button.tsx tests/components/meal-card.test.tsx
git commit -m "feat: add MealCard, MealList, DateNav, and AddButton components"
```

---

### Task 11: Daily View (Home Screen)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Implement the daily view page**

Replace `src/app/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMeals } from "@/hooks/use-meals";
import { useSettings } from "@/hooks/use-settings";
import { useDailyTotals } from "@/hooks/use-daily-totals";
import { deleteMeal } from "@/lib/meals";
import { scheduleBackup } from "@/lib/backup";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBars } from "@/components/macro-bars";
import { MealList } from "@/components/meal-list";
import { DateNav } from "@/components/date-nav";
import { AddButton } from "@/components/add-button";
import Link from "next/link";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const [date, setDate] = useState(todayStr);
  const meals = useMeals(date);
  const settings = useSettings();
  const totals = useDailyTotals(date);

  async function handleDelete(id: string) {
    await deleteMeal(id);
    scheduleBackup();
  }

  return (
    <div className="p-4 pb-24">
      {/* Settings gear */}
      <div className="flex justify-end mb-2">
        <Link href="/settings" className="text-gray-600 text-lg">⚙</Link>
      </div>

      <DateNav
        date={date}
        onPrev={() => setDate((d) => shiftDate(d, -1))}
        onNext={() => setDate((d) => shiftDate(d, 1))}
      />

      <CalorieRing current={totals.calories} target={settings.calorieGoal} />

      <MacroBars
        protein={{ current: totals.protein, target: settings.proteinGoal }}
        carbs={{ current: totals.carbs, target: settings.carbsGoal }}
        fat={{ current: totals.fat, target: settings.fatGoal }}
      />

      <MealList meals={meals} onDelete={handleDelete} />

      <AddButton />
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev`
Open localhost:3000. Expected: dark screen with calorie ring (0/2100), empty macro bars, "No meals logged yet" message, and + button.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: implement daily view home screen"
```

---

### Task 12: Add Meal Screen (Input + Shortcuts + Autocomplete + Parsed Preview)

**Files:**
- Create: `src/app/add/page.tsx`, `src/components/meal-input.tsx`, `src/components/shortcut-list.tsx`, `src/components/parsed-preview.tsx`
- Test: `tests/components/meal-input.test.tsx`, `tests/components/parsed-preview.test.tsx`

- [ ] **Step 1: Write failing test for parsed preview**

Create `tests/components/parsed-preview.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParsedPreview } from "@/components/parsed-preview";
import type { MealItem } from "@/lib/types";

const items: MealItem[] = [
  { rawText: "200g cottage cheese", name: "cottage cheese", quantity: 200, unit: "g", calories: 206, protein: 28, carbs: 6, fat: 9, parsed: true },
  { rawText: "3 corn crackers", name: "corn crackers", quantity: 3, unit: "piece", calories: 314, protein: 4, carbs: 62, fat: 6, parsed: true },
];

describe("ParsedPreview", () => {
  it("renders parsed items with macros", () => {
    render(<ParsedPreview items={items} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("200g cottage cheese")).toBeInTheDocument();
    expect(screen.getByText("3 corn crackers")).toBeInTheDocument();
    expect(screen.getByText("520 cal")).toBeInTheDocument();
  });

  it("calls onConfirm when Log Meal is tapped", () => {
    const onConfirm = vi.fn();
    render(<ParsedPreview items={items} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText("Log Meal"));
    expect(onConfirm).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/parsed-preview.test.tsx`
Expected: FAIL — cannot resolve `@/components/parsed-preview`

- [ ] **Step 3: Implement parsed preview**

Create `src/components/parsed-preview.tsx`:

```tsx
"use client";

import type { MealItem } from "@/lib/types";

export function ParsedPreview({
  items,
  onConfirm,
  onCancel,
}: {
  items: MealItem[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const totalCal = items.reduce((s, i) => s + i.calories, 0);
  const totalP = items.reduce((s, i) => s + i.protein, 0);
  const totalC = items.reduce((s, i) => s + i.carbs, 0);
  const totalF = items.reduce((s, i) => s + i.fat, 0);

  return (
    <div>
      <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">Parsed items</div>

      <div className="bg-[#252545] rounded-[10px] p-3 mb-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={i < items.length - 1 ? "mb-2 pb-2 border-b border-white/[0.06]" : ""}
          >
            <div className="flex justify-between items-baseline mb-0.5">
              <span className="text-[13px]">{item.rawText}</span>
              <span className="text-[11px] text-gray-500">{item.calories} cal</span>
            </div>
            <div className="flex gap-3 text-[10px] text-gray-500">
              <span><span className="text-[#81c784]">P</span> {item.protein}g</span>
              <span><span className="text-[#ffb74d]">C</span> {item.carbs}g</span>
              <span><span className="text-[#f48fb1]">F</span> {item.fat}g</span>
            </div>
          </div>
        ))}

        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex justify-between items-center">
          <div className="flex gap-3 text-[10px] font-semibold">
            <span className="text-[#81c784]">P {totalP}g</span>
            <span className="text-[#ffb74d]">C {totalC}g</span>
            <span className="text-[#f48fb1]">F {totalF}g</span>
          </div>
          <span className="text-xs text-[#4fc3f7] font-bold">{totalCal} cal</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-[#333] rounded-[10px] py-3 text-center text-[13px] text-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] bg-[#4fc3f7] rounded-[10px] py-3 text-center text-[13px] text-[#1a1a2e] font-semibold"
        >
          Log Meal
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/parsed-preview.test.tsx`
Expected: All 2 tests PASS.

- [ ] **Step 5: Implement shortcut list**

Create `src/components/shortcut-list.tsx`:

```tsx
"use client";

import type { Shortcut } from "@/lib/shortcuts";

export function ShortcutList({
  shortcuts,
  onSelect,
}: {
  shortcuts: Shortcut[];
  onSelect: (shortcut: Shortcut) => void;
}) {
  if (shortcuts.length === 0) return null;

  return (
    <div>
      <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">Recent meals</div>
      {shortcuts.map((s) => (
        <button
          key={s.fingerprint}
          onClick={() => onSelect(s)}
          className="w-full text-left bg-[#252545] rounded-lg p-2.5 mb-1.5 border border-transparent active:border-[#4fc3f7]"
        >
          <div className="text-[13px] mb-1">
            {s.items.map((i) => i.rawText).join(" + ")}
          </div>
          <div className="flex gap-2.5 text-[10px] text-gray-500">
            <span className="text-[#4fc3f7]">{s.totalCalories} cal</span>
            <span><span className="text-[#81c784]">P</span> {s.totalProtein}g</span>
            <span><span className="text-[#ffb74d]">C</span> {s.totalCarbs}g</span>
            <span><span className="text-[#f48fb1]">F</span> {s.totalFat}g</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Implement meal input with autocomplete**

Create `src/components/meal-input.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import type { NutritionCacheEntry } from "@/lib/types";
import { getAllCachedFoods } from "@/lib/nutrition-cache";

export function MealInput({
  onSubmit,
}: {
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<NutritionCacheEntry[]>([]);
  const [allCached, setAllCached] = useState<NutritionCacheEntry[]>([]);

  useEffect(() => {
    getAllCachedFoods().then(setAllCached);
  }, []);

  useEffect(() => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    const lower = text.toLowerCase();
    const matches = allCached
      .filter((e) => e.key.toLowerCase().includes(lower))
      .slice(0, 5);
    setSuggestions(matches);
  }, [text, allCached]);

  function handleSubmit() {
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
      setSuggestions([]);
    }
  }

  function handleSuggestionClick(entry: NutritionCacheEntry) {
    onSubmit(entry.key);
    setText("");
    setSuggestions([]);
  }

  return (
    <div>
      <div className="bg-[#252545] rounded-[10px] p-3 mb-1 border border-[#4fc3f7]">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What did you eat?"
          className="w-full bg-transparent text-[13px] text-gray-200 placeholder-gray-600 outline-none"
          autoFocus
        />
      </div>

      {suggestions.length > 0 && (
        <div className="bg-[#2a2a4a] rounded-lg border border-[#333] mb-4 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.key}
              onClick={() => handleSuggestionClick(s)}
              className={`w-full text-left p-2.5 ${i < suggestions.length - 1 ? "border-b border-[#333]" : ""} active:bg-[#303060]`}
            >
              <div className="text-[13px]">{s.key}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                <span className="text-[#4fc3f7]">{s.calories} cal</span>
                {" · "}
                <span className="text-[#81c784]">P</span> {s.protein}g
                {" · "}
                <span className="text-[#ffb74d]">C</span> {s.carbs}g
                {" · "}
                <span className="text-[#f48fb1]">F</span> {s.fat}g
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Implement add meal page**

Create `src/app/add/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { addMeal } from "@/lib/meals";
import { parseFood } from "@/lib/food-parser";
import { scheduleBackup } from "@/lib/backup";
import { MealInput } from "@/components/meal-input";
import { ShortcutList } from "@/components/shortcut-list";
import { ParsedPreview } from "@/components/parsed-preview";
import type { MealItem } from "@/lib/types";
import type { Shortcut } from "@/lib/shortcuts";

export default function AddMealPage() {
  const router = useRouter();
  const shortcuts = useShortcuts();
  const [parsedItems, setParsedItems] = useState<MealItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTextSubmit(text: string) {
    setLoading(true);
    const items = await parseFood(text);
    setParsedItems(items);
    setLoading(false);
  }

  async function handleShortcutSelect(shortcut: Shortcut) {
    await addMeal({ items: shortcut.items });
    scheduleBackup();
    router.push("/");
  }

  async function handleConfirm() {
    if (!parsedItems) return;
    await addMeal({ items: parsedItems });
    scheduleBackup();
    router.push("/");
  }

  function handleCancel() {
    setParsedItems(null);
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={() => router.push("/")} className="text-gray-500 text-[15px] mr-3">
          ◀
        </button>
        <span className="font-semibold text-[15px]">Add Meal</span>
      </div>

      {!parsedItems && (
        <>
          <MealInput onSubmit={handleTextSubmit} />
          {loading && (
            <div className="text-center text-gray-500 text-sm py-4">Parsing...</div>
          )}
          {!loading && <ShortcutList shortcuts={shortcuts} onSelect={handleShortcutSelect} />}
        </>
      )}

      {parsedItems && (
        <ParsedPreview items={parsedItems} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  );
}
```

- [ ] **Step 8: Verify the add meal flow**

Run: `npm run dev`
Navigate to localhost:3000, tap +. Expected: input field with placeholder, empty shortcuts (first run). Type something, press Enter — should show "Parsing..." then parsed preview (requires API key in settings).

- [ ] **Step 9: Commit**

```bash
git add src/app/add/ src/components/meal-input.tsx src/components/shortcut-list.tsx src/components/parsed-preview.tsx tests/components/parsed-preview.test.tsx tests/components/meal-input.test.tsx
git commit -m "feat: implement add meal screen with shortcuts, autocomplete, and parsing"
```

---

### Task 13: Macro Goals Calculator

**Files:**
- Create: `src/app/goals/page.tsx`, `src/components/macro-slider.tsx`, `src/components/calorie-breakdown.tsx`

- [ ] **Step 1: Implement macro slider component**

Create `src/components/macro-slider.tsx`:

```tsx
"use client";

interface MacroSliderProps {
  label: string;
  color: string;
  grams: number;
  calPerGram: number;
  totalCalories: number;
  onChange: (grams: number) => void;
}

export function MacroSlider({ label, color, grams, calPerGram, totalCalories, onChange }: MacroSliderProps) {
  const calories = grams * calPerGram;
  const pct = totalCalories > 0 ? Math.round((calories / totalCalories) * 100) : 0;

  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[13px] font-semibold" style={{ color }}>{label}</span>
        <span className="text-xs text-gray-500">{grams}g · {calories} cal · {pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={500}
        value={grams}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
        style={{ accentColor: color }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement calorie breakdown bar**

Create `src/components/calorie-breakdown.tsx`:

```tsx
"use client";

export function CalorieBreakdown({
  protein,
  carbs,
  fat,
  target,
}: {
  protein: number;
  carbs: number;
  fat: number;
  target: number;
}) {
  const pCal = protein * 4;
  const cCal = carbs * 4;
  const fCal = fat * 9;
  const total = pCal + cCal + fCal;
  const diff = total - target;

  const pPct = total > 0 ? (pCal / total) * 100 : 0;
  const cPct = total > 0 ? (cCal / total) * 100 : 0;
  const fPct = total > 0 ? (fCal / total) * 100 : 0;

  return (
    <div className="bg-[#252545] rounded-[10px] p-3">
      <div className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">Calorie Breakdown</div>

      <div className="flex rounded h-5 overflow-hidden mb-2">
        <div
          className="flex items-center justify-center text-[9px] font-semibold text-[#1a1a2e]"
          style={{ background: "#81c784", width: `${pPct}%` }}
        >
          {pCal > 0 && pCal}
        </div>
        <div
          className="flex items-center justify-center text-[9px] font-semibold text-[#1a1a2e]"
          style={{ background: "#ffb74d", width: `${cPct}%` }}
        >
          {cCal > 0 && cCal}
        </div>
        <div
          className="flex items-center justify-center text-[9px] font-semibold text-[#1a1a2e]"
          style={{ background: "#f48fb1", width: `${fPct}%` }}
        >
          {fCal > 0 && fCal}
        </div>
      </div>

      <div className="flex justify-between text-xs">
        <span>Macro total:</span>
        <span className="font-semibold text-[#4fc3f7]">{total.toLocaleString()} cal</span>
      </div>
      <div className="flex justify-between text-xs mt-0.5">
        <span>Target:</span>
        <span>{target.toLocaleString()} cal</span>
      </div>
      <div className="flex justify-between text-[11px] mt-0.5">
        <span>Difference:</span>
        <span className={diff === 0 ? "text-green-400" : "text-[#ffb74d]"}>
          {diff > 0 ? "+" : ""}{diff} cal
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement goals page**

Create `src/app/goals/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import { saveSettings } from "@/lib/settings";
import { scheduleBackup } from "@/lib/backup";
import { MacroSlider } from "@/components/macro-slider";
import { CalorieBreakdown } from "@/components/calorie-breakdown";

export default function GoalsPage() {
  const router = useRouter();
  const settings = useSettings();
  const [calories, setCalories] = useState(settings.calorieGoal);
  const [protein, setProtein] = useState(settings.proteinGoal);
  const [carbs, setCarbs] = useState(settings.carbsGoal);
  const [fat, setFat] = useState(settings.fatGoal);

  useEffect(() => {
    setCalories(settings.calorieGoal);
    setProtein(settings.proteinGoal);
    setCarbs(settings.carbsGoal);
    setFat(settings.fatGoal);
  }, [settings]);

  async function handleSave() {
    await saveSettings({
      calorieGoal: calories,
      proteinGoal: protein,
      carbsGoal: carbs,
      fatGoal: fat,
    });
    scheduleBackup();
    router.push("/settings");
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={() => router.push("/settings")} className="text-gray-500 text-[15px] mr-3">
          ◀
        </button>
        <span className="font-semibold text-[15px]">Daily Goals</span>
      </div>

      {/* Calorie stepper */}
      <div className="mb-4">
        <div className="text-[13px] text-[#4fc3f7] font-semibold mb-1.5">Total Calories</div>
        <div className="bg-[#252545] rounded-lg p-3 flex items-center justify-center gap-3">
          <button
            onClick={() => setCalories((c) => Math.max(0, c - 50))}
            className="bg-[#333] rounded-md w-8 h-8 flex items-center justify-center text-lg text-gray-500"
          >
            −
          </button>
          <span className="text-2xl font-bold min-w-[80px] text-center">
            {calories.toLocaleString()}
          </span>
          <button
            onClick={() => setCalories((c) => c + 50)}
            className="bg-[#333] rounded-md w-8 h-8 flex items-center justify-center text-lg text-gray-500"
          >
            +
          </button>
        </div>
      </div>

      {/* Macro sliders */}
      <MacroSlider label="Protein" color="#81c784" grams={protein} calPerGram={4} totalCalories={calories} onChange={setProtein} />
      <MacroSlider label="Carbs" color="#ffb74d" grams={carbs} calPerGram={4} totalCalories={calories} onChange={setCarbs} />
      <MacroSlider label="Fat" color="#f48fb1" grams={fat} calPerGram={9} totalCalories={calories} onChange={setFat} />

      {/* Breakdown */}
      <CalorieBreakdown protein={protein} carbs={carbs} fat={fat} target={calories} />

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full mt-4 bg-[#4fc3f7] rounded-[10px] py-3 text-center text-[13px] text-[#1a1a2e] font-semibold"
      >
        Save Goals
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Verify goals calculator**

Run: `npm run dev`
Navigate to localhost:3000/goals. Expected: calorie stepper, three sliders, stacked bar showing breakdown and difference.

- [ ] **Step 5: Commit**

```bash
git add src/app/goals/ src/components/macro-slider.tsx src/components/calorie-breakdown.tsx
git commit -m "feat: implement macro goals calculator with calorie breakdown"
```

---

### Task 14: Settings Screen

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Implement settings page**

Create `src/app/settings/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import { saveSettings } from "@/lib/settings";
import { downloadBackup, importData } from "@/lib/backup";
import { scheduleBackup } from "@/lib/backup";
import { db } from "@/lib/db";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const settings = useSettings();
  const [apiKey, setApiKey] = useState(settings.chatgptApiKey);
  const [restoring, setRestoring] = useState(false);

  const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET;

  async function handleSaveApiKey() {
    await saveSettings({ chatgptApiKey: apiKey });
    scheduleBackup();
  }

  async function handleRestore() {
    if (!confirm("This will replace all local data with the latest backup. Continue?")) return;
    setRestoring(true);
    const data = await downloadBackup();
    if (data) {
      await importData(data);
      alert("Data restored successfully.");
    } else {
      alert("No backup found or failed to download.");
    }
    setRestoring(false);
  }

  async function handleClearAll() {
    if (!confirm("This will permanently delete all your data. Are you sure?")) return;
    if (!confirm("Really? This cannot be undone.")) return;
    await db.delete();
    window.location.href = "/";
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={() => router.push("/")} className="text-gray-500 text-[15px] mr-3">
          ◀
        </button>
        <span className="font-semibold text-[15px]">Settings</span>
      </div>

      {/* Macro Goals */}
      <Link href="/goals" className="block bg-[#252545] rounded-[10px] p-3.5 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[13px] font-medium">Macro Goals</div>
            <div className="text-[11px] text-gray-500">
              {settings.calorieGoal.toLocaleString()} cal · P {settings.proteinGoal}g · C {settings.carbsGoal}g · F {settings.fatGoal}g
            </div>
          </div>
          <span className="text-gray-500">›</span>
        </div>
      </Link>

      {/* API Key */}
      <div className="bg-[#252545] rounded-[10px] p-3.5 mb-2">
        <div className="text-[13px] font-medium mb-2">ChatGPT API Key</div>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 bg-[#333] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none"
          />
          <button
            onClick={handleSaveApiKey}
            className="bg-[#4fc3f7] rounded-lg px-3 py-2 text-xs text-[#1a1a2e] font-semibold"
          >
            Save
          </button>
        </div>
        <div className="text-[11px] mt-1.5">
          {settings.chatgptApiKey ? (
            <span className="text-[#81c784]">Connected · {settings.chatgptApiKey.slice(0, 5)}...{settings.chatgptApiKey.slice(-4)}</span>
          ) : (
            <span className="text-gray-600">Not configured</span>
          )}
        </div>
      </div>

      {/* Backup */}
      <div className="text-[11px] text-gray-600 uppercase tracking-wider mt-4 mb-2">Data</div>

      <div className="bg-[#252545] rounded-[10px] p-3.5 mb-2">
        <div className="text-[13px] font-medium">S3 Backup</div>
        <div className="text-[11px] text-gray-500 mt-1">
          {s3Bucket ? (
            <>Bucket: {s3Bucket} · Auto-backup enabled</>
          ) : (
            <>Not configured — run setup script</>
          )}
        </div>
      </div>

      <button
        onClick={handleRestore}
        disabled={restoring || !s3Bucket}
        className="w-full bg-[#252545] rounded-[10px] p-3.5 mb-2 text-left disabled:opacity-50"
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[13px] font-medium">Restore from Backup</div>
            <div className="text-[11px] text-gray-500">Replace local data with S3 backup</div>
          </div>
          <span className="text-gray-500">›</span>
        </div>
      </button>

      {/* Danger */}
      <div className="text-[11px] text-gray-600 uppercase tracking-wider mt-4 mb-2">Danger Zone</div>

      <button
        onClick={handleClearAll}
        className="w-full bg-[#252545] rounded-[10px] p-3.5 border border-[#f48fb1]/20 text-left"
      >
        <div className="text-[13px] font-medium text-[#f48fb1]">Clear All Data</div>
        <div className="text-[11px] text-gray-500">Delete all local meals and settings</div>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify settings screen**

Run: `npm run dev`
Navigate to localhost:3000/settings. Expected: Macro goals link (showing defaults), API key input, S3 backup status, restore button, clear data button.

- [ ] **Step 3: Commit**

```bash
git add src/app/settings/
git commit -m "feat: implement settings screen with API key, backup, and restore"
```

---

### Task 15: S3 Setup CLI Script

**Files:**
- Create: `scripts/setup-s3.ts`

- [ ] **Step 1: Implement the setup script**

Create `scripts/setup-s3.ts`:

```typescript
#!/usr/bin/env npx tsx

import { execSync } from "child_process";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
const bucketName = args[0];

if (!bucketName) {
  console.error("Usage: npx tsx scripts/setup-s3.ts <bucket-name> [region]");
  process.exit(1);
}

const region = args[1] ?? "us-east-1";
const iamUser = `health-tracker-${bucketName}`;
const policyName = `health-tracker-${bucketName}-policy`;

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8" }).trim();
  } catch (e: unknown) {
    const err = e as { stderr?: string };
    console.error(`Command failed: ${cmd}`);
    console.error(err.stderr ?? "");
    process.exit(1);
  }
}

console.log(`\n🪣 Creating S3 bucket: ${bucketName} (${region})...\n`);

try {
  if (region === "us-east-1") {
    run(`aws s3api create-bucket --bucket ${bucketName} --region ${region}`);
  } else {
    run(`aws s3api create-bucket --bucket ${bucketName} --region ${region} --create-bucket-configuration LocationConstraint=${region}`);
  }
  console.log("Bucket created.");
} catch {
  console.log("Bucket may already exist, continuing...");
}

// Block public access
run(`aws s3api put-public-access-block --bucket ${bucketName} --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true`);

// Enable CORS for browser access
const corsConfig = JSON.stringify({
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT"],
      AllowedOrigins: ["*"],
      MaxAgeSeconds: 3600,
    },
  ],
});
run(`aws s3api put-bucket-cors --bucket ${bucketName} --cors-configuration '${corsConfig}'`);

console.log(`\n👤 Creating IAM user: ${iamUser}...\n`);

run(`aws iam create-user --user-name ${iamUser}`);

const policy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      Resource: [
        `arn:aws:s3:::${bucketName}`,
        `arn:aws:s3:::${bucketName}/*`,
      ],
    },
  ],
});

run(`aws iam put-user-policy --user-name ${iamUser} --policy-name ${policyName} --policy-document '${policy}'`);
console.log("Policy attached.");

console.log("\n🔑 Generating access keys...\n");

const keysJson = run(`aws iam create-access-key --user-name ${iamUser}`);
const keys = JSON.parse(keysJson);
const accessKey = keys.AccessKey.AccessKeyId;
const secretKey = keys.AccessKey.SecretAccessKey;

// Write to .env.local
const envPath = resolve(process.cwd(), ".env.local");
let envContent = "";
if (existsSync(envPath)) {
  envContent = readFileSync(envPath, "utf-8");
  // Remove existing S3 vars
  envContent = envContent
    .split("\n")
    .filter((line) => !line.startsWith("NEXT_PUBLIC_S3_"))
    .join("\n");
  if (envContent && !envContent.endsWith("\n")) envContent += "\n";
}

envContent += `NEXT_PUBLIC_S3_BUCKET=${bucketName}\n`;
envContent += `NEXT_PUBLIC_S3_REGION=${region}\n`;
envContent += `NEXT_PUBLIC_S3_ACCESS_KEY=${accessKey}\n`;
envContent += `NEXT_PUBLIC_S3_SECRET_KEY=${secretKey}\n`;

writeFileSync(envPath, envContent);

console.log("✅ Done! Credentials written to .env.local:\n");
console.log(`  NEXT_PUBLIC_S3_BUCKET=${bucketName}`);
console.log(`  NEXT_PUBLIC_S3_REGION=${region}`);
console.log(`  NEXT_PUBLIC_S3_ACCESS_KEY=${accessKey}`);
console.log(`  NEXT_PUBLIC_S3_SECRET_KEY=****`);
console.log("\nRestart your dev server to pick up the new environment variables.");
```

- [ ] **Step 2: Verify script is parseable**

Run: `npx tsx --check scripts/setup-s3.ts`
Expected: No syntax errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-s3.ts
git commit -m "feat: add S3 setup CLI script for bucket and IAM creation"
```

---

### Task 16: PWA Service Worker and Offline Support

**Files:**
- Modify: `next.config.ts`
- Create: `public/sw.js`

- [ ] **Step 1: Install next-pwa**

Run: `npm install next-pwa`

- [ ] **Step 2: Configure Next.js for PWA**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "export",
};

export default withPWA(nextConfig);
```

- [ ] **Step 3: Build and verify static export**

Run: `npm run build`
Expected: Static export generated in `out/` directory with service worker.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "feat: configure PWA with service worker and static export"
```

---

### Task 17: End-to-End Manual Smoke Test

- [ ] **Step 1: Start dev server and test full flow**

Run: `npm run dev`

Test these flows in order:
1. Open localhost:3000 — see empty daily view with ring at 0
2. Go to Settings → set API key
3. Go to Goals → set calories to 2100, adjust sliders, verify breakdown, save
4. Go home → ring should show /2,100
5. Tap + → type "200g cottage cheese and 3 corn crackers" → submit → see parsed preview → Log Meal
6. Verify meal appears on daily view with macros and ring updates
7. Tap + again → see the meal as a shortcut → tap it → logs instantly
8. Browse to previous day with ◀ → should be empty
9. Browse back to today → meals are there

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: smoke test fixes"
```

---
