// =============================================================================
// Step-by-step food picker (FR-06 / UC-06) - Malika
// =============================================================================
// WHAT IT DOES
//   A pop-up that adds dishes to a meal without typing:
//     1. What kind of food?   (cuisine tiles: American, Mexican, ...)
//     2. Which dishes?        (pick one or more, e.g. tacos AND nachos)
//     3. For each dish: what was in it?  (usual ingredients pre-selected; tap to change)
//     4. For each dish: how much?        (a count like "3 tacos", or a size like "medium plate")
//   Editing an existing dish opens straight at step 3 for that dish.
//
// HOW IT CONNECTS
//   - MealsSection.tsx opens it and receives the finished dishes through onDone.
//   - All choices come from the food catalog (data/food_catalog.json on the server);
//     catalog.ts has the helpers and the score math.
// =============================================================================

import { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Minus, Plus, X } from 'lucide-react';
import { createKey } from '@/lib/constants';
import type { Dish, FoodCatalog } from '@/lib/types';
import type { ItemRow } from '../types';
import { dishScore, findDish, ingredientChoices } from './catalog';
import { FoodImage } from './FoodImage';
import { PortionIcon } from './PortionIcon';

/** The choices made so far for one dish (ingredients and how much). */
interface Draft {
  ingredients: string[];
  portion: string | null;
  quantity: number | null;
}

/** Which screen of the picker is showing; `index` is which chosen dish we're on. */
type Step =
  | { kind: 'cuisine' }
  | { kind: 'dishes' }
  | { kind: 'ingredients'; index: number }
  | { kind: 'portion'; index: number };

/** A dish's starting choices: its usual ingredients and its default portion. */
const defaultDraft = (dish: Dish): Draft => ({
  ingredients: [...dish.ingredients],
  portion: dish.portion.type === 'size' ? dish.portion.default : null,
  quantity: dish.portion.type === 'count' ? dish.portion.default : null,
});

export function FoodPicker({
  catalog,
  mealLabel,
  editing,
  onClose,
  onDone,
}: {
  catalog: FoodCatalog;
  mealLabel: string;
  editing?: ItemRow; // set when changing a dish that's already in the meal
  onClose: () => void;
  onDone: (items: ItemRow[]) => void;
}) {
  const editingDish = editing ? findDish(catalog, editing.dish) : undefined;
  const [step, setStep] = useState<Step>(
    editingDish ? { kind: 'ingredients', index: 0 } : { kind: 'cuisine' },
  );
  const [cuisineId, setCuisineId] = useState(editingDish?.cuisine.id ?? '');
  const [dishIds, setDishIds] = useState<string[]>(editing ? [editing.dish] : []);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    editing
      ? {
          [editing.dish]: {
            ingredients: editing.ingredients,
            portion: editing.portion,
            quantity: editing.quantity,
          },
        }
      : {},
  );
  const [showMore, setShowMore] = useState(false);

  const cuisine = catalog.cuisines.find((c) => c.id === cuisineId);
  const dishOf = (id: string) => findDish(catalog, id)!.dish;
  const isDetail = step.kind === 'ingredients' || step.kind === 'portion';
  const currentDish = isDetail ? dishOf(dishIds[step.index]) : undefined;
  const draft = currentDish ? drafts[currentDish.id] : undefined;
  const setDraft = (changes: Partial<Draft>) =>
    currentDish && setDrafts((all) => ({ ...all, [currentDish.id]: { ...all[currentDish.id], ...changes } }));

  // ----- moving between steps -----
  const goToDetails = (ids: string[]) => {
    setDrafts((all) => Object.fromEntries(ids.map((id) => [id, all[id] ?? defaultDraft(dishOf(id))])));
    setDishIds(ids);
    setShowMore(false);
    setStep({ kind: 'ingredients', index: 0 });
  };

  const chooseCuisine = (id: string) => {
    const chosen = catalog.cuisines.find((c) => c.id === id)!;
    setCuisineId(id);
    if (chosen.dishes.length === 1)
      goToDetails([chosen.dishes[0].id]); // e.g. "Build your own"
    else {
      setDishIds([]);
      setStep({ kind: 'dishes' });
    }
  };

  const finish = () =>
    onDone(dishIds.map((id) => ({ key: editing?.key ?? createKey(), dish: id, ...drafts[id] })));

  const next = () => {
    if (step.kind === 'dishes') goToDetails(dishIds);
    else if (step.kind === 'ingredients') setStep({ kind: 'portion', index: step.index });
    else if (step.kind === 'portion') {
      if (step.index + 1 < dishIds.length) {
        setShowMore(false);
        setStep({ kind: 'ingredients', index: step.index + 1 });
      } else finish();
    }
  };

  const back = () => {
    if (step.kind === 'dishes') setStep({ kind: 'cuisine' });
    else if (step.kind === 'portion') setStep({ kind: 'ingredients', index: step.index });
    else if (step.kind === 'ingredients') {
      if (step.index > 0) setStep({ kind: 'portion', index: step.index - 1 });
      else if (editing) onClose();
      else setStep(cuisine && cuisine.dishes.length > 1 ? { kind: 'dishes' } : { kind: 'cuisine' });
    }
  };

  // ----- what each step shows -----
  let title = '';
  let subtitle = '';
  let body = null;
  let canContinue = true;

  if (step.kind === 'cuisine') {
    title = 'What kind of food?';
    subtitle = `Adding to ${mealLabel}.`;
    body = (
      <div className="pick-grid">
        {catalog.cuisines.map((c) => (
          <button
            key={c.id}
            type="button"
            className="pick-tile"
            onClick={() => chooseCuisine(c.id)}
            data-testid={`pick-cuisine-${c.id}`}
          >
            <FoodImage icon={c.icon} image={c.image} size={34} />
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    );
  } else if (step.kind === 'dishes' && cuisine) {
    title = 'Which dishes?';
    subtitle = 'Pick everything you had. You can choose more than one.';
    canContinue = dishIds.length > 0;
    body = (
      <div className="pick-grid">
        {cuisine.dishes.map((dish) => {
          const selected = dishIds.includes(dish.id);
          return (
            <button
              key={dish.id}
              type="button"
              className={`pick-tile ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              onClick={() =>
                setDishIds(selected ? dishIds.filter((d) => d !== dish.id) : [...dishIds, dish.id])
              }
              data-testid={`pick-dish-${dish.id}`}
            >
              <FoodImage icon={dish.icon} image={dish.image} size={34} />
              <span>{dish.label}</span>
              {selected && (
                <span className="pick-check">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  } else if (step.kind === 'ingredients' && currentDish && draft) {
    const { main, groups } = ingredientChoices(catalog, currentDish);
    const score = dishScore(catalog, draft.ingredients);
    const toggle = (id: string) =>
      setDraft({
        ingredients: draft.ingredients.includes(id)
          ? draft.ingredients.filter((i) => i !== id)
          : [...draft.ingredients, id],
      });
    const tile = (id: string) => {
      const ingredient = catalog.ingredients[id];
      const selected = draft.ingredients.includes(id);
      return (
        <button
          key={id}
          type="button"
          className={`pick-tile small ${selected ? 'selected' : ''}`}
          aria-pressed={selected}
          onClick={() => toggle(id)}
          data-testid={`pick-ingredient-${id}`}
        >
          <FoodImage icon={ingredient.icon} image={ingredient.image} size={26} />
          <span>{ingredient.label}</span>
          {selected && (
            <span className="pick-check">
              <Check size={11} strokeWidth={3} />
            </span>
          )}
        </button>
      );
    };
    title = currentDish.allIngredients
      ? 'What was on your plate?'
      : `What was in your ${currentDish.label.toLowerCase()}?`;
    subtitle = currentDish.allIngredients
      ? 'Tap everything you had.'
      : 'We picked the usual ingredients. Tap to add or remove.';
    canContinue = draft.ingredients.length > 0;
    body = (
      <>
        {main.length > 0 && <div className="pick-grid">{main.map(tile)}</div>}
        {!currentDish.allIngredients && (
          <button
            type="button"
            className="link-button pick-more"
            aria-expanded={showMore}
            onClick={() => setShowMore(!showMore)}
            data-testid="button-more-ingredients"
          >
            {showMore ? 'Fewer ingredients' : 'More ingredients'}{' '}
            <ChevronDown size={14} className={showMore ? 'rotated' : ''} />
          </button>
        )}
        {(showMore || currentDish.allIngredients) &&
          groups.map((group) => (
            <div key={group.id} className="pick-group">
              <div className="pick-group-label">{group.label}</div>
              <div className="pick-grid">{group.ingredients.map(tile)}</div>
            </div>
          ))}
        <p className="pick-score" aria-live="polite">
          {score !== null ? `Health score ${score} / 3` : 'Pick at least one ingredient.'}
        </p>
      </>
    );
  } else if (step.kind === 'portion' && currentDish && draft) {
    const rule = currentDish.portion;
    if (rule.type === 'count') {
      const n = draft.quantity ?? rule.default;
      title = `How many ${rule.unit}?`;
      subtitle = `Your ${currentDish.label.toLowerCase()}.`;
      body = (
        <div className="count-picker">
          <div className="count-icons" aria-hidden="true">
            {Array.from({ length: Math.min(n, 10) }, (_, i) => (
              <FoodImage key={i} icon={currentDish.icon} image={currentDish.image} size={30} />
            ))}
          </div>
          <div className="stepper">
            <button
              type="button"
              className="icon-button"
              aria-label="One fewer"
              disabled={n <= 1}
              onClick={() => setDraft({ quantity: Math.max(1, n - 1) })}
              data-testid="button-count-minus"
            >
              <Minus size={16} />
            </button>
            <strong className="count-number" aria-live="polite" data-testid="text-count">
              {n}
            </strong>
            <button
              type="button"
              className="icon-button"
              aria-label="One more"
              disabled={n >= rule.max}
              onClick={() => setDraft({ quantity: Math.min(rule.max, n + 1) })}
              data-testid="button-count-plus"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      );
    } else {
      title = `Pick a portion for your ${currentDish.label.toLowerCase()}`;
      subtitle = 'Pick the closest size.';
      body = (
        <div className="pick-grid">
          {rule.options.map((id) => {
            const selected = (draft.portion ?? rule.default) === id;
            return (
              <button
                key={id}
                type="button"
                className={`pick-tile ${selected ? 'selected' : ''}`}
                aria-pressed={selected}
                onClick={() => setDraft({ portion: id })}
                data-testid={`pick-portion-${id}`}
              >
                <PortionIcon portion={catalog.portions[id]} />
                <span>{catalog.portions[id].label}</span>
                {selected && (
                  <span className="pick-check">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    }
  }

  const lastStep = step.kind === 'portion' && step.index === dishIds.length - 1;
  const showBack = step.kind !== 'cuisine';
  const showNext = step.kind !== 'cuisine';

  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <section
        className="dialog picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <div className="dialog-head">
          <div>
            <div className="eyebrow">
              {isDetail && dishIds.length > 1 ? `Dish ${step.index + 1} of ${dishIds.length} · ` : ''}
              {currentDish?.label ?? cuisine?.label ?? 'Add food'}
            </div>
            <h2 id="picker-title">{title}</h2>
            <p className="subtle" style={{ margin: '6px 0 0' }}>
              {subtitle}
            </p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close food picker"
            data-testid="button-close-picker"
          >
            <X size={17} />
          </button>
        </div>
        <div className="picker-body">{body}</div>
        {(showBack || showNext) && (
          <div className="dialog-actions">
            {showBack && (
              <button type="button" className="button ghost" onClick={back} data-testid="button-picker-back">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {showNext && (
              <button
                type="button"
                className="button primary"
                onClick={next}
                disabled={!canContinue}
                data-testid="button-picker-next"
              >
                {lastStep ? (editing ? 'Save changes' : 'Add to meal') : 'Next'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
