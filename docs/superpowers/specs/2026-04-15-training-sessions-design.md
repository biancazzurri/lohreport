# Training Sessions

Add the ability to log training sessions that increase the daily calorie (and macro) budget.

## Data Model

New `TrainingSession` interface in `src/lib/types.ts`:

```ts
interface TrainingSession {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  description: string; // free text, e.g. "45 min running"
  caloriesBurned: number;
  createdAt: number;
}
```

New Dexie table `trainingSessions` indexed on `date`. DB version bump to 3.

## Daily Totals

`useDailyTotals` queries both `meals` and `trainingSessions` for the selected date. Returns existing fields plus `burned: number`.

Effective goals on the home page:

- `effectiveCalorieGoal = calorieGoal + totalBurned`
- Macro goals scale proportionally: `effectiveMacroGoal = macroGoal * (effectiveCalorieGoal / calorieGoal)`

The calorie ring and macro bars use the effective goals.

## UI: Add Flow

The (+) button opens a choice screen: **Meal** or **Training**.

Selecting **Training** navigates to `/add?type=training`, reusing the existing add page with mode-aware behavior. The flow:

1. User types free text describing the activity (e.g. "1 hour weight training")
2. Text is sent to ChatGPT API with a prompt asking it to estimate calories burned
3. User sees the estimate and confirms
4. A `TrainingSession` record is saved to Dexie

## UI: Home Screen

Training sessions appear in the meal list, sorted chronologically by `time` alongside meals. Training cards are visually distinct:

- Different accent color (green) to distinguish from meal cards (blue)
- Activity description and calories burned displayed
- No macro breakdown (training has no macros)
- Expandable with a delete option, same pattern as meal cards

## Sync & Backup

Training sessions are included in the server sync/backup flow alongside meals. The backup API route and `syncFromServer` handle the new table.

## Hook: useTrainingSessions

New hook `useTrainingSessions(date: string)` that live-queries the `trainingSessions` table filtered by date, matching the pattern of `useMeals`.

## Parse API

The existing `/api/parse` route gets a mode parameter. When `mode=training`, the ChatGPT prompt asks for estimated calories burned instead of nutritional info. Response shape: `{ description: string, caloriesBurned: number }`.

## Scope Exclusions

- No training types/categories taxonomy
- No duration tracking as a separate field
- No macro impact from training (only calories)
- No integration with fitness devices/APIs
