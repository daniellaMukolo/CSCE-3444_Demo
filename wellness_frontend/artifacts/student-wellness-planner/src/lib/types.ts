// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Data shapes from the server - Shared (each teammate keeps their section's shapes)
// =============================================================================
// WHAT IT DOES
//   TypeScript descriptions of every JSON answer the API sends, so the editor can
//   warn about typos like day.sleep.bedTime. Field names match the API's JSON exactly.
//
// HOW IT CONNECTS
//   - Each section's shapes are marked by comments: sleep and progress (Bobby),
//     stress, food and schedule (Malika), exercise, screen time and compare (Daniella).
//   - If a server module changes its JSON, update its shape here too.
// =============================================================================

// Accounts (Bobby)
export interface User {
  id: number;
  name: string;
  email: string;
  year: string;
}

// ----- Daily check-in sections (api/sections/*.py) -----

// Sleep (Bobby)
export interface SleepData {
  bedtime: string;
  wakeTime: string;
  quality: number | null;
  totalHours: number;
}

// Stress (Malika)
export interface StressData {
  level: number;
  answers: boolean[];
  note: string;
}

// Exercise (Daniella)
export interface Activity {
  activityType: string;
  minutes: number;
}

// Food (Malika)
/** One dish in a meal, e.g. 3 tacos or a medium plate of nachos. */
export interface FoodItem {
  dish: string;
  ingredients: string[];
  portion: string | null; // portion id for size-based dishes (e.g. "medium_plate")
  quantity: number | null; // how many, for countable dishes (e.g. 3 tacos)
  score: number;
}

export interface Meal {
  time: string;
  mealType: string;
  items: FoodItem[];
  note: string;
  score: number;
}

export interface FoodData {
  meals: Meal[];
  water: number;
  dailyScore: number | null;
}

// The whole day (shared). screenTime is Daniella's; note is the reflection.
/** Everything saved for one day (GET /api/days/<date>). Empty sections are null or []. */
export interface Day {
  date: string;
  sleep: SleepData | null;
  stress: StressData | null;
  exercise: Activity[];
  food: FoodData | null;
  screenTime: { hours: number } | null;
  note: string | null;
  saved: boolean;
  supportMessage: boolean;
}

/** One row in the saved-days list (GET /api/days). */
export interface DaySummary {
  date: string;
  sleepHours: number | null;
  exerciseMinutes: number;
  mealCount: number;
  /** Which tracked sections have data that day, e.g. ["sleep", "food"]. */
  sections: string[];
}

// ----- Food catalog (wellness_planner/wellness/data/food_catalog.json) - Malika -----

export interface FoodGroup {
  label: string;
  points: number;
}

export interface Ingredient {
  label: string;
  icon: string; // emoji, used when there's no image
  image?: string;
  group: string; // food group id
}

export interface Portion {
  label: string;
  shape: 'snack' | 'plate' | 'bowl' | 'cup';
  scale?: number; // 1 = small, 2 = medium, 3 = large
}

export type PortionRule =
  | { type: 'count'; unit: string; max: number; default: number }
  | { type: 'size'; options: string[]; default: string };

export interface Dish {
  id: string;
  label: string;
  icon: string;
  image?: string;
  ingredients: string[]; // usual ingredients, pre-selected in the picker
  extras: string[]; // common add-ons, shown but not selected
  allIngredients?: boolean; // "Build your own": show every ingredient
  portion: PortionRule;
}

export interface Cuisine {
  id: string;
  label: string;
  icon: string;
  image?: string;
  dishes: Dish[];
}

export interface FoodCatalog {
  foodGroups: Record<string, FoodGroup>;
  portions: Record<string, Portion>;
  ingredients: Record<string, Ingredient>;
  cuisines: Cuisine[];
}

/** Choice lists for the Daily log form (GET /api/days/options). */
export interface DayOptions {
  activityTypes: string[];
  mealTypes: string[];
  foodCatalog: FoodCatalog;
  stressQuestions: string[];
  longSleepHours: number;
}

// ----- Schedule (api/schedule.py) - Malika -----

export interface ScheduleItem {
  id: number;
  name: string;
  itemType: string;
  days: string[];
  startTime: string;
  endTime: string;
  location: string;
  color: string;
}

// ----- Progress (api/progress.py, Bobby) and Compare (api/compare.py, Daniella) -----

export type CategoryKey = 'sleep' | 'stress' | 'exercise' | 'food' | 'screen';

export interface ProgressCategory {
  label: string;
  unit: string;
  score: number | null;
  series: (number | null)[];
}

export interface Summary {
  start: string;
  end: string;
  days: string[];
  categories: Record<CategoryKey, ProgressCategory>;
  logged_days: number;
}

export interface Recommendation {
  id: string;
  category: CategoryKey;
  title: string;
  summary: string;
  details: string;
  source: string;
}

export interface ProgressResponse {
  period: number;
  summary: Summary;
  enoughData: boolean;
  minDays: number;
  recommendations: Recommendation[];
  /** The most important matching tip for each category (for the note in its chart box). */
  categoryTips: Partial<Record<CategoryKey, Recommendation>>;
}

// Compare Routines (Daniella)
export interface CompareRow {
  key: CategoryKey;
  label: string;
  unit: string;
  a: number | null;
  b: number | null;
  change: number | null;
  direction: 'better' | 'worse' | 'same' | 'none';
}

export interface CompareRange {
  start: string;
  end: string;
  loggedDays: number;
}

export interface CompareResponse {
  a: CompareRange;
  b: CompareRange;
  enoughData: boolean;
  minDays: number;
  rows: CompareRow[];
}
