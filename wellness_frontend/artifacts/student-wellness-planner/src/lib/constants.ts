// =============================================================================
// Shared lists - Shared
// =============================================================================
// WHAT IT DOES
//   Small lists more than one page needs: day names, the sections that make a
//   "complete" day, the schedule color markers, and a key maker for form rows.
//
// HOW IT CONNECTS
//   - TRACKED_SECTIONS must match TRACKED_SECTIONS in api/days.py.
//   - COLORS must stay valid hex colors; api/schedule.py checks them.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the COLORS palette and the day-name lists.
// =============================================================================

/** Day keys used by the API (schedule items) and by Date.getDay(): index 0 = Sunday. */
export const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Check-in sections that count toward a "complete" day (same list as TRACKED_SECTIONS in api/days.py). */
export const TRACKED_SECTIONS = ['sleep', 'stress', 'exercise', 'food', 'screenTime'];

/** Color markers a student can pick for a schedule item. */
export const COLORS = ['#d88b72', '#82a28a', '#d2a957', '#7d9aa0', '#ab8b9e', '#8b9d68'];

/** A unique key for list rows in a form (meals, activities). Never sent to the server. */
export const createKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
