# Meal Tracking — Design Spec

## Overview

A mobile-first PWA for tracking daily food intake with macro goals. Offline-first with automatic S3 backup. Uses ChatGPT API for natural language food parsing with local caching.

## Architecture

- **Frontend:** Next.js (React) as a Progressive Web App — installable on home screen
- **Storage:** IndexedDB for all local data (meals, cached nutrition data, settings)
- **Food parsing:** ChatGPT API parses free-text food descriptions into structured items with macros. Results cached locally in IndexedDB so repeat foods never hit the API again.
- **Backup:** Auto-backup IndexedDB snapshot to S3 on every data change (debounced). Credentials baked into the build via a one-time CLI setup script. Restore from S3 available in settings.
- **No backend server.** The app is a static PWA. Only external calls are ChatGPT API and S3.

## Screens

### 1. Daily View (Home Screen)

The main screen. Shows today's food log and macro progress.

**Layout (top to bottom):**
- **Date navigation** — left/right arrows to browse days, "Today" label
- **Calorie ring** — circular progress showing consumed / target calories
- **Macro bars** — three inline progress bars for Protein, Carbs, Fat (showing current/target grams)
- **Meal list** — chronological list of meal cards
- **Add button** — floating + button at bottom

**Meal cards:**
- Items logged together are grouped in a single card
- Each card shows: timestamp, total calories, individual food items
- Each food item shows: name, calories, P/C/F breakdown
- Meal total P/C/F summarized at the bottom of the card
- Tapping a meal card allows editing or deleting it

### 2. Add Meal (Tap + Button)

The primary interaction — used multiple times per day.

**Initial state:**
- Text input field at top ("What did you eat?")
- Below: list of recent meal shortcuts, sorted by relevancy

**Shortcuts:**
- Smart, self-managing list — no manual favorite/unfavorite
- Ranked by recency + frequency of use
- Auto-expire after ~1 week of non-use
- Each shortcut shows: meal description, total calories, P/C/F
- Tapping a shortcut logs the entire meal instantly (no confirmation needed)

**Typing state:**
- As the user types, autocomplete suggestions appear from cached history
- Suggestions show food name + macros, matched from previously parsed foods
- Selecting a suggestion fills the input

**Submit state (new food, online):**
- User submits free text (e.g., "200g cottage cheese and 3 corn crackers")
- Text sent to ChatGPT API for parsing
- Returns: list of parsed items, each with name, quantity, calories, P/C/F
- User sees parsed results for review
- "Log Meal" button to confirm and save

**Offline + never-seen food:**
- Cannot parse — entry queued with a "pending" indicator
- Parsed automatically when connectivity returns
- The meal is still logged with the raw text visible, macros show as "—" until parsed

### 3. Macro Goals Calculator (Settings)

**Layout:**
- Total daily calories — stepper control (+/- buttons)
- Three macro sliders: Protein, Carbs, Fat
- Each slider shows: grams, calories (grams × multiplier), percentage of total
  - Protein: 4 cal/g
  - Carbs: 4 cal/g
  - Fat: 9 cal/g
- Stacked bar visualization showing how macros fill up the calorie target
- Difference indicator: shows if macro calories exceed or fall short of the calorie target
- "Save Goals" button

**Behavior:**
- One set of goals, same every day
- Adjusting a slider updates calories and percentage in real time
- The calculator helps the user see the math and balance macros against their calorie target

### 4. Settings

**Sections:**
- **Macro Goals** — link to the goals calculator, shows current targets inline
- **ChatGPT API Key** — input field, stored locally in IndexedDB (entered at runtime, not baked into build), shows connection status
- **S3 Backup** — read-only display of bucket name, last backup timestamp, backup status
- **Restore from Backup** — replace local data with latest S3 snapshot (with confirmation)
- **Clear All Data** — danger zone, deletes all local data (with confirmation)

## Data Model (IndexedDB)

### Meals store
```
{
  id: string (uuid)
  date: string (YYYY-MM-DD)
  time: string (HH:mm)
  items: [
    {
      rawText: string
      name: string (parsed)
      quantity: number
      unit: string
      calories: number
      protein: number
      carbs: number
      fat: number
      parsed: boolean
    }
  ]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  createdAt: timestamp
}
```

### Nutrition cache store
```
{
  key: string (normalized food description, e.g., "200g cottage cheese")
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  cachedAt: timestamp
}
```

### Settings store
```
{
  calorieGoal: number
  proteinGoal: number (grams)
  carbsGoal: number (grams)
  fatGoal: number (grams)
  chatgptApiKey: string
}
```

## S3 Backup

### Setup (one-time CLI script)

A CLI tool (`npx health-setup s3`) that:
1. Takes a bucket name as input (creates it if it doesn't exist)
2. Creates an IAM policy scoped only to that bucket (PutObject, GetObject, ListBucket)
3. Creates an IAM user with that policy attached
4. Generates access key + secret key
5. Writes credentials into the app's config (environment variables or config file baked into the build)

Requires: AWS CLI configured with an account that has IAM and S3 permissions. Run once.

### Runtime behavior

- On every data change (meal logged, edited, deleted, settings changed), debounce 5 seconds then export full IndexedDB as JSON and upload to S3
- S3 key format: `health-backup/latest.json` (overwritten each time) + `health-backup/archive/YYYY-MM-DD-HHmmss.json` (daily snapshots)
- Upload happens silently in the background when online
- Settings screen shows bucket name (read-only) and "Last backup: X ago" status
- Restore: download `latest.json` from S3, replace local IndexedDB (with user confirmation)

## Food Parsing (ChatGPT API)

### Prompt structure

Send user's raw text to ChatGPT with a system prompt requesting structured JSON output:
- Parse into individual food items
- For each item: name, quantity, unit, estimated calories, protein (g), carbs (g), fat (g)
- Return as JSON array

### Caching strategy

- Before calling the API, check the nutrition cache for exact or fuzzy matches
- After a successful API call, cache each parsed item individually
- Shortcuts reference cached data — never re-parsed
- Cache entries have no expiry (food nutrition doesn't change)

### Offline behavior

- If offline and food is not in cache: log the meal with raw text, mark items as `parsed: false`
- When connectivity returns: automatically parse pending items and update the meal
- Macro totals for the day update once parsing completes

## Design Language

- **Dark theme** — dark navy background (#1a1a2e), card backgrounds (#252545)
- **Accent color** — light blue (#4fc3f7) for calories and primary actions
- **Macro colors** — Protein: green (#81c784), Carbs: orange (#ffb74d), Fat: pink (#f48fb1)
- **Typography** — system font stack, minimal weight variation
- **Cards** — rounded corners (10px), subtle separation
- **Mobile-first** — max-width ~375px content area, thumb-friendly tap targets
