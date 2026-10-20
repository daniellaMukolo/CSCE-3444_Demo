// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Daily log form state - Shared (each section's part is its owner's)
// =============================================================================
// WHAT IT DOES
//   Describes the form's data (DayForm) and converts it to and from the API's JSON.
//   Numbers are kept as text while typing and turned into numbers when saving.
//
// HOW IT CONNECTS
//   - LogPage.tsx keeps one DayForm; each section component receives only its slice.
//   - toForm(day) fills the form from GET /api/days/<date>;
//     toPayload(form) builds the JSON for PUT /api/days/<date>.
//   - Errors are keyed like the server's: "sleep.bedtime", "exercise.minutes.0".
// =============================================================================

import { createKey } from '@/lib/constants';
import type { Day } from '@/lib/types';

export interface ActivityRow {
  key: string; // only for React lists; never sent to the server
  activityType: string;
  minutes: string; // kept as text while typing; converted on save
}

/** One dish in a meal on the form (picked with the food picker). */
export interface ItemRow {
  key: string;
  dish: string;
  ingredients: string[];
  portion: string | null;
  quantity: number | null;
}

export interface MealRow {
  key: string;
  time: string;
  mealType: string;
  items: ItemRow[];
  note: string;
}

export interface DayForm {
  sleep: { bedtime: string; wakeTime: string; quality: number | null };
  stress: { level: number | null; answers: (boolean | null)[]; note: string };
  exercise: ActivityRow[];
  food: { meals: MealRow[]; water: number };
  screenTime: { hours: string };
  note: string;
}

/** Field errors from the API, keyed like "sleep.bedtime" or "exercise.minutes.0". */
export type Errors = Record<string, string>;

/** Props every section component receives. */
export interface SectionProps<T> {
  value: T;
  onChange: (value: T) => void;
  errors: Errors;
}

/** A blank form for a day with nothing saved. */
export function emptyForm(questionCount: number): DayForm {
  return {
    sleep: { bedtime: '', wakeTime: '', quality: null },
    stress: { level: null, answers: Array(questionCount).fill(null), note: '' },
    exercise: [],
    food: { meals: [], water: 0 },
    screenTime: { hours: '' },
    note: '',
  };
}

/** Fill the form from a saved day. */
export function toForm(day: Day, questionCount: number): DayForm {
  const form = emptyForm(questionCount);
  if (day.sleep)
    form.sleep = { bedtime: day.sleep.bedtime, wakeTime: day.sleep.wakeTime, quality: day.sleep.quality };
  if (day.stress)
    form.stress = { level: day.stress.level, answers: day.stress.answers, note: day.stress.note };
  form.exercise = day.exercise.map((a) => ({
    key: createKey(),
    activityType: a.activityType,
    minutes: String(a.minutes),
  }));
  if (day.food) {
    form.food = {
      water: day.food.water,
      meals: day.food.meals.map((m) => ({
        key: createKey(),
        time: m.time,
        mealType: m.mealType,
        note: m.note,
        items: m.items.map((item) => ({
          key: createKey(),
          dish: item.dish,
          ingredients: item.ingredients,
          portion: item.portion,
          quantity: item.quantity,
        })),
      })),
    };
  }
  if (day.screenTime) form.screenTime = { hours: String(day.screenTime.hours) };
  form.note = day.note ?? '';
  return form;
}

// A blank box stays '' (the server reads it as "not logged"); anything else becomes a number.
const asNumber = (text: string) => (text.trim() === '' ? '' : Number(text));

/** The JSON the API expects (PUT /api/days/<date>). Empty sections are sent as empty so they're cleared. */
export function toPayload(form: DayForm) {
  return {
    sleep: form.sleep.bedtime || form.sleep.wakeTime ? form.sleep : null,
    stress: form.stress.level ? form.stress : null,
    exercise: form.exercise.map(({ activityType, minutes }) => ({
      activityType,
      minutes: asNumber(minutes),
    })),
    food: {
      // Remove the React-only `key` from each meal and dish before sending.
      meals: form.food.meals.map(({ key: _key, items, ...meal }) => ({
        ...meal,
        items: items.map(({ key: _itemKey, ...item }) => item),
      })),
      water: form.food.water,
    },
    screenTime: { hours: asNumber(form.screenTime.hours) },
    note: form.note,
  };
}
