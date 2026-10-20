// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes. Character images created by Bobby Hughes with ChatGPT Codex.
// =============================================================================
// The character rule - Shared
// =============================================================================
// WHAT IT DOES
//   Decides which character belongs to which section, used on every page:
//   sleep = pillow, stress = tea, movement = dumbbell, food = bowl, screen time = phone,
//   schedule = calendar, progress = bars, Today/reflection = student.
//
// HOW IT CONNECTS
//   - components/Character.tsx draws them; SectionHeading puts them beside titles.
//   - CATEGORY_CHARACTER maps the progress/compare category keys to characters.
//   - Images live in public/images/characters/ (transparent WebP files).
//
// CREDIT
//   Character images created by Bobby using Codex AI.
// =============================================================================

import type { CategoryKey } from './types';

export type CharacterName =
  'today' | 'sleep' | 'stress' | 'movement' | 'food' | 'screen' | 'schedule' | 'progress';

export const CHARACTERS: Record<CharacterName, { src: string; label: string }> = {
  today: { src: '/images/characters/today.webp', label: 'A cheerful student in a graduation cap' },
  sleep: { src: '/images/characters/sleep.webp', label: 'A sleepy pillow in a starry nightcap' },
  stress: { src: '/images/characters/stress.webp', label: 'A calm cup of tea' },
  movement: { src: '/images/characters/movement.webp', label: 'A dumbbell in sneakers and a headband' },
  food: { src: '/images/characters/food.webp', label: 'A happy bowl of vegetables' },
  screen: { src: '/images/characters/screen-time.webp', label: 'A tired phone' },
  schedule: { src: '/images/characters/schedule.webp', label: 'A cheerful calendar' },
  progress: { src: '/images/characters/progress.webp', label: 'Growing bar-chart blocks' },
};

/** The character for each progress/compare category key. */
export const CATEGORY_CHARACTER: Record<CategoryKey, CharacterName> = {
  sleep: 'sleep',
  stress: 'stress',
  exercise: 'movement',
  food: 'food',
  screen: 'screen',
};
