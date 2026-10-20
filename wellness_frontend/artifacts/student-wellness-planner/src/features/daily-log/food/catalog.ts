// AI ASSISTANCE: Drafted with Claude (Anthropic) from Malika Ray's Replit AI prototype, and reviewed by Malika Ray.
// =============================================================================
// Food catalog helpers and scores - Malika
// =============================================================================
// WHAT IT DOES
//   Finds dishes, calculates dish and meal scores, writes portion text ("3 tacos"),
//   and lists the ingredient choices for a dish.
//
// HOW IT CONNECTS
//   - The scoring matches wellness_planner/wellness/api/sections/food.py exactly
//     (including round1's halves-up rounding), so previews equal saved scores.
//   - Used by MealsSection.tsx and FoodPicker.tsx.
// =============================================================================

import type { Cuisine, Dish, FoodCatalog } from '@/lib/types';

/** Round to 1 decimal, halves up (2.65 -> 2.7) — same as round1() in food.py. */
export const round1 = (value: number) => Math.floor(value * 10 + 0.5 + 1e-9) / 10;

export function findDish(catalog: FoodCatalog, dishId: string): { dish: Dish; cuisine: Cuisine } | undefined {
  for (const cuisine of catalog.cuisines) {
    const dish = cuisine.dishes.find((d) => d.id === dishId);
    if (dish) return { dish, cuisine };
  }
  return undefined;
}

/** A dish's score: the average points of its ingredients' food groups (null with no ingredients). */
export function dishScore(catalog: FoodCatalog, ingredients: string[]) {
  if (!ingredients.length) return null;
  const points = ingredients.map((id) => catalog.foodGroups[catalog.ingredients[id]?.group]?.points ?? 0);
  return round1(points.reduce((a, b) => a + b, 0) / points.length);
}

export function average(scores: number[]) {
  return scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

/** "3 tacos" for countable dishes, or the portion's label ("Medium plate") for the rest. */
export function portionText(
  catalog: FoodCatalog,
  dish: Dish,
  portion: string | null,
  quantity: number | null,
) {
  if (dish.portion.type === 'count') {
    const n = quantity ?? dish.portion.default;
    // "1 taco" vs "3 tacos": drop a trailing "s" for one.
    const unit = n === 1 ? dish.portion.unit.replace(/s$/, '') : dish.portion.unit;
    return `${n} ${unit}`;
  }
  return catalog.portions[portion ?? dish.portion.default]?.label ?? '';
}

/**
 * The ingredient choices for a dish in the picker:
 *   main  = its usual ingredients plus common extras (or every ingredient for "Build your own")
 *   more  = every other ingredient, grouped by food group, behind "More ingredients"
 */
export function ingredientChoices(catalog: FoodCatalog, dish: Dish) {
  const all = Object.keys(catalog.ingredients);
  const main = dish.allIngredients ? [] : [...dish.ingredients, ...dish.extras];
  const rest = all.filter((id) => !main.includes(id));
  const groups = Object.entries(catalog.foodGroups)
    .map(([groupId, group]) => ({
      id: groupId,
      label: group.label,
      ingredients: rest.filter((id) => catalog.ingredients[id].group === groupId),
    }))
    .filter((group) => group.ingredients.length);
  return { main, groups };
}
