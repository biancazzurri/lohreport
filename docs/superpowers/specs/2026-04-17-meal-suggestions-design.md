# Meal Suggestions Design

Date: 2026-04-17

## Goal

Add a button that asks ChatGPT for meal suggestions that fill the user's remaining daily macros. Each suggestion can be logged with a single tap, reusing the existing meal-save flow.

## UX

- A compact `✨ Suggest meal` button is rendered under the MacroBars row on the home page.
- When tapped, the button shows a loading spinner in-place; on success a modal slides up with three meal suggestion cards.
- Each card shows:
  - Meal name (e.g. "Grilled Chicken & Rice Bowl")
  - Total calories and P/C/F in the same visual style as `MealCard`
  - The list of items that compose the meal (quantity, unit, name)
  - A `Log this meal` button
- Tapping `Log this meal` saves the meal to Dexie for the current selected date and closes the modal. MacroBars update on the next render from the `useDailyTotals` hook.
- The button is disabled (dimmed) when all macros are at or above their target — label changes to `Goals met`.

## Architecture

### New files

- `src/components/suggest-meal-button.tsx`
  - Client component. Owns `open`, `loading`, `error`, `suggestions` state.
  - Props: `remaining: { calories: number; protein: number; carbs: number; fat: number }`, `date: string`.
  - Renders the pill button and the modal as its child.
- `src/components/meal-suggestions-modal.tsx`
  - Presentational. Props: `suggestions`, `loading`, `error`, `onLog(suggestion)`, `onClose()`, `onRetry()`.
  - Renders the three cards. Handles the empty/loading/error states.
- `src/lib/meal-suggestions.ts`
  - `suggestMeals(remaining) → Promise<Suggestion[]>` — POSTs `/api/suggest` and Zod-parses the response.
  - `logSuggestion(suggestion, date) → Promise<void>` — maps each `SuggestionItem` to a `MealItem` (using `displayText` as `rawText`, and setting `parsed: true`), then calls the existing `addMeal({ items, date })` helper from `src/lib/meals.ts`.
- `src/app/api/suggest/route.ts`
  - POST only. Auth via `getServerSession`. Rate-limited (`suggest:<email>`, 5/min).
  - Validates input with Zod, calls OpenAI, cleans and Zod-validates output, returns JSON.

### Modified files

- `src/app/page.tsx`
  - Compute `remaining`:
    ```ts
    const remaining = {
      calories: Math.max(0, effectiveCalorieGoal - totals.calories),
      protein: Math.max(0, adjustedGoals.protein - totals.protein),
      carbs: Math.max(0, adjustedGoals.carbs - totals.carbs),
      fat: Math.max(0, adjustedGoals.fat - totals.fat),
    };
    ```
  - Render `<SuggestMealButton remaining={remaining} date={date} />` immediately below `<MacroBars ... />` inside the existing collapsible wrapper (so it hides with the macro bars on scroll — acceptable because the macros are the context for the suggestion).

### Data flow

```
page.tsx (computes remaining)
  → SuggestMealButton (click)
    → POST /api/suggest { remaining }
      → OpenAI gpt-4o-mini
      → Zod-validated JSON
    → suggestions[]
  → MealSuggestionsModal renders 3 cards
    → Log this meal
      → logSuggestion(suggestion, date)
        → addMeal() (existing) → Dexie
  → useMeals / useDailyTotals re-renders page
```

## API Contract

### `POST /api/suggest`

Request body:

```json
{
  "remaining": {
    "calories": 420,
    "protein": 35,
    "carbs": 50,
    "fat": 10
  }
}
```

Response body (HTTP 200): array of exactly 3 suggestions.

```json
[
  {
    "name": "Grilled Chicken & Rice Bowl",
    "items": [
      {
        "name": "Chicken Breast",
        "displayText": "150g Chicken Breast",
        "quantity": 150,
        "unit": "g",
        "calories": 248,
        "protein": 46,
        "carbs": 0,
        "fat": 5
      },
      {
        "name": "Brown Rice",
        "displayText": "100g Brown Rice",
        "quantity": 100,
        "unit": "g",
        "calories": 112,
        "protein": 2,
        "carbs": 23,
        "fat": 1
      }
    ]
  }
]
```

### Zod schemas (reused shape from `/api/parse`)

```ts
const SuggestRequestSchema = z.object({
  remaining: z.object({
    calories: z.number().min(0).max(10_000),
    protein: z.number().min(0).max(1_000),
    carbs: z.number().min(0).max(1_000),
    fat: z.number().min(0).max(1_000),
  }),
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
```

### System prompt (sketch)

```
You are a nutrition assistant. The user tells you how many calories and grams
of protein, carbs, and fat they still need today. Return ONLY a JSON array of
exactly 3 meal suggestions. No markdown, no prose.

Each suggestion has:
- name: string (a short, natural meal name, capitalized properly)
- items: array of 1–5 items, each with:
  - name (clean, normalized)
  - displayText (e.g. "150g Chicken Breast")
  - quantity (number)
  - unit (g, ml, piece, tbsp, tsp, cup)
  - calories, protein, carbs, fat (grams; numbers)

Rules:
- The sum of each suggestion's item macros should approximately match the
  user's remaining macros. Prefer slight undershoots over overshoots.
- If a macro's remaining value is 0, minimize that macro in the suggestion.
- Offer variety across the 3 suggestions (different cuisines or styles).
```

The user message will be a single line, for example:
`"remaining: calories=420, protein=35g, carbs=50g, fat=10g"`.

### Auth, rate limiting, and error responses

Mirror `/api/parse`:
- 401 when `session?.user?.email` is missing.
- 429 when `checkRateLimit('suggest:<email>', 60_000, 5)` returns false.
- 500 on Zod validation failure or OpenAI error. Log to console.

## Edge Cases

- **Over-target on a macro.** The page-level `max(0, ...)` clamps remaining to 0. The system prompt tells the model to minimize any macro whose remaining is 0.
- **All macros met.** `SuggestMealButton` detects `remaining.calories === 0 && protein === 0 && carbs === 0 && fat === 0` and renders a disabled `Goals met` state. No request is made.
- **Model returns invalid JSON or wrong shape.** Strip code fences with the same regex as `/api/parse`, `JSON.parse`, then `SuggestResponseSchema.safeParse`. Failure → HTTP 500 → modal error state with retry.
- **OpenAI failure / network timeout.** Surface as the same error state. Retry re-runs the request.
- **Rate limit hit.** Modal shows "Slow down — try again in a minute".
- **Logged meal timestamp.** `addMeal({ items, date })` fills in the current time (`HH:MM`) and `createdAt: Date.now()` for the selected date, so the meal sorts naturally into the day.

## Out of scope

- Preference input ("vegetarian", "quick") — can be added later.
- Caching suggestions — each click hits OpenAI; cheap enough at 5/min rate limit.
- Editing the suggestion before logging — user logs as-is; if they want changes they can edit the meal afterwards (or skip logging and type it manually).
