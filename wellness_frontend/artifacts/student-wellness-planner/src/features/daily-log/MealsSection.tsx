// =============================================================================
// Food section of the daily check-in (FR-06 / UC-06) - Malika
// =============================================================================
// WHAT IT DOES
//   The day's meals, each made of dishes picked with pictures (food/FoodPicker.tsx),
//   plus cups of water. No typing is needed; the note is optional. Shows a meal score
//   and a daily score as a preview.
//
// HOW IT CONNECTS
//   - LogPage.tsx renders it with value = { meals, water } and the food catalog from
//     GET /api/days/options (data/food_catalog.json on the server).
//   - Scores are calculated with food/catalog.ts the same way the server does
//     (api/sections/food.py), which recalculates them when saving.
//   - Errors: "food.items.0" (first meal) or "food.item.0.1" (first meal, second dish).
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the "Meals & little pauses" section, meal list
//   and meal type/time fields. The picture-based picker and scores are new.
// =============================================================================

import { useState } from 'react';
import { Droplets, Minus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FieldError } from '@/components/FieldError';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import { createKey } from '@/lib/constants';
import type { FoodCatalog } from '@/lib/types';
import { average, dishScore, findDish, portionText } from './food/catalog';
import { FoodImage } from './food/FoodImage';
import { FoodPicker } from './food/FoodPicker';
import type { DayForm, ItemRow, MealRow, SectionProps } from './types';

const MAX_WATER = 30;
const MAX_ICONS = 7; // ingredient pictures shown per dish before "+3"

/** A sensible meal type for a new meal, based on the time of day. */
function guessMealType() {
  const hour = new Date().getHours();
  return hour < 11 ? 'Breakfast' : hour < 16 ? 'Lunch' : hour < 21 ? 'Dinner' : 'Snack';
}

export function MealsSection({
  value,
  onChange,
  errors,
  catalog,
  mealTypes,
}: SectionProps<DayForm['food']> & { catalog: FoodCatalog; mealTypes: string[] }) {
  // Which meal the picker is adding to, and (when editing) which dish it's changing.
  const [picker, setPicker] = useState<{ mealKey: string; item?: ItemRow } | null>(null);

  const setMeals = (meals: MealRow[]) => onChange({ ...value, meals });
  const updateMeal = (key: string, changes: Partial<MealRow>) =>
    setMeals(value.meals.map((m) => (m.key === key ? { ...m, ...changes } : m)));
  const setWater = (cups: number) => onChange({ ...value, water: Math.min(MAX_WATER, Math.max(0, cups)) });

  // Preview scores (the server recalculates them on save). The filter drops dishes with no
  // ingredients (score null); `s is number` tells TypeScript only numbers remain.
  const mealScore = (meal: MealRow) =>
    average(
      meal.items.map((item) => dishScore(catalog, item.ingredients)).filter((s): s is number => s !== null),
    );
  const mealScores = value.meals.map(mealScore).filter((s): s is number => s !== null);
  const dailyScore = average(mealScores);

  // "Add meal" creates a meal card and opens the picker for it right away.
  const addMeal = () => {
    const meal: MealRow = {
      key: createKey(),
      time: new Date().toTimeString().slice(0, 5), // the current time as 'HH:MM'
      mealType: guessMealType(),
      items: [],
      note: '',
    };
    setMeals([...value.meals, meal]);
    setPicker({ mealKey: meal.key });
  };

  // The picker returns new dishes (adding) or one changed dish (editing).
  const pickerDone = (items: ItemRow[]) => {
    if (!picker) return;
    const meal = value.meals.find((m) => m.key === picker.mealKey);
    if (meal) {
      // Editing replaces that one dish; adding appends the new dishes to the meal.
      const next = picker.item
        ? meal.items.map((i) => (i.key === picker.item!.key ? items[0] : i))
        : [...meal.items, ...items];
      updateMeal(meal.key, { items: next });
    }
    setPicker(null);
  };

  const pickerMeal = picker ? value.meals.find((m) => m.key === picker.mealKey) : undefined;

  return (
    <Panel>
      <SectionHeading
        character="food"
        title="Meals & little pauses"
        subtitle={
          dailyScore !== null
            ? `Daily food score ${dailyScore} / 3`
            : 'Tap through pictures to add what you ate'
        }
        action={
          <button
            type="button"
            className="button outline small"
            onClick={addMeal}
            data-testid="button-add-meal"
          >
            <Plus size={14} /> Add meal
          </button>
        }
      />

      {value.meals.length ? (
        <div className="meal-list">
          {value.meals.map((meal, i) => {
            const score = mealScore(meal);
            return (
              <div className="meal-card" key={meal.key} data-testid={`meal-entry-${i}`}>
                <div className="meal-card-top">
                  <div className="field" style={{ width: 130 }}>
                    <label className="sr-only" htmlFor={`meal-type-${meal.key}`}>
                      Meal
                    </label>
                    <select
                      id={`meal-type-${meal.key}`}
                      value={meal.mealType}
                      onChange={(e) => updateMeal(meal.key, { mealType: e.target.value })}
                      data-testid={`select-meal-type-${i}`}
                    >
                      {mealTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ width: 110 }}>
                    <label className="sr-only" htmlFor={`meal-time-${meal.key}`}>
                      Time
                    </label>
                    <input
                      id={`meal-time-${meal.key}`}
                      type="time"
                      value={meal.time}
                      onChange={(e) => updateMeal(meal.key, { time: e.target.value })}
                      data-testid={`input-meal-time-${i}`}
                    />
                  </div>
                  <span className="meal-score">{score !== null ? `Meal score ${score} / 3` : ''}</span>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove ${meal.mealType.toLowerCase()}`}
                    onClick={() => setMeals(value.meals.filter((m) => m.key !== meal.key))}
                    data-testid={`button-remove-meal-${i}`}
                  >
                    <X size={15} />
                  </button>
                </div>

                {meal.items.map((item, j) => {
                  const found = findDish(catalog, item.dish);
                  if (!found) return null;
                  const { dish } = found;
                  const itemScore = dishScore(catalog, item.ingredients);
                  return (
                    <div className="dish-row" key={item.key} data-testid={`dish-row-${i}-${j}`}>
                      <FoodImage icon={dish.icon} image={dish.image} size={30} />
                      <div className="dish-info">
                        <strong>{dish.label}</strong>
                        <span>
                          {portionText(catalog, dish, item.portion, item.quantity)}
                          {itemScore !== null && ` · score ${itemScore}`}
                        </span>
                        <span
                          className="dish-ingredients"
                          aria-label={`Ingredients: ${item.ingredients.map((id) => catalog.ingredients[id]?.label).join(', ')}`}
                        >
                          {item.ingredients.slice(0, MAX_ICONS).map((id) => (
                            <span key={id} title={catalog.ingredients[id]?.label}>
                              <FoodImage
                                icon={catalog.ingredients[id]?.icon ?? '🍽️'}
                                image={catalog.ingredients[id]?.image}
                                size={16}
                              />
                            </span>
                          ))}
                          {item.ingredients.length > MAX_ICONS && (
                            <span className="more-count">+{item.ingredients.length - MAX_ICONS}</span>
                          )}
                        </span>
                      </div>
                      <div className="dish-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Change ${dish.label}`}
                          onClick={() => setPicker({ mealKey: meal.key, item })}
                          data-testid={`button-edit-dish-${i}-${j}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove ${dish.label}`}
                          onClick={() =>
                            updateMeal(meal.key, { items: meal.items.filter((x) => x.key !== item.key) })
                          }
                          data-testid={`button-remove-dish-${i}-${j}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <FieldError id={`dish-${item.key}-error`} message={errors[`food.item.${i}.${j}`]} />
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="add-food-button"
                  onClick={() => setPicker({ mealKey: meal.key })}
                  data-testid={`button-add-food-${i}`}
                >
                  <Plus size={15} /> {meal.items.length ? 'Add another food' : 'Add food'}
                </button>
                <FieldError
                  id={`meal-${meal.key}-error`}
                  message={
                    errors[`food.items.${i}`] ?? errors[`food.mealType.${i}`] ?? errors[`food.time.${i}`]
                  }
                />
                <div className="field">
                  <label className="sr-only" htmlFor={`meal-note-${meal.key}`}>
                    Note
                  </label>
                  <input
                    id={`meal-note-${meal.key}`}
                    maxLength={200}
                    placeholder="Add a note (optional)"
                    value={meal.note}
                    onChange={(e) => updateMeal(meal.key, { note: e.target.value })}
                    data-testid={`input-meal-note-${i}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '20px 15px' }}>
          <strong>Nothing noted yet</strong>
          <p>Add a meal and tap through pictures to show what you ate. You can leave this blank.</p>
          <button
            type="button"
            className="button primary small"
            onClick={addMeal}
            data-testid="button-add-first-meal"
          >
            <Plus size={14} /> Add a meal
          </button>
        </div>
      )}

      <div className="water-row">
        <span className="water-label">
          <Droplets size={16} /> Water today
        </span>
        <div className="stepper">
          <button
            type="button"
            className="icon-button"
            aria-label="One less cup"
            onClick={() => setWater(value.water - 1)}
            data-testid="button-water-minus"
          >
            <Minus size={15} />
          </button>
          <strong aria-live="polite" data-testid="text-water">
            {value.water} cup{value.water === 1 ? '' : 's'}
          </strong>
          <button
            type="button"
            className="icon-button"
            aria-label="One more cup"
            onClick={() => setWater(value.water + 1)}
            data-testid="button-water-plus"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <FieldError id="water-error" message={errors['food.water']} />

      {picker && pickerMeal && (
        <FoodPicker
          catalog={catalog}
          mealLabel={pickerMeal.mealType.toLowerCase()}
          editing={picker.item}
          onClose={() => setPicker(null)}
          onDone={pickerDone}
        />
      )}
    </Panel>
  );
}
