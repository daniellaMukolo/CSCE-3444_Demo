// =============================================================================
// Class name helper - Replit template
// =============================================================================
// WHAT IT DOES
//   cn() joins CSS class names and merges conflicting Tailwind classes.
//
// HOW IT CONNECTS
//   - Used by the UI kit in components/ui/ (not by our own pages).
//
// CREDIT
//   Replit's React template (came with the project; not written by the team).
// =============================================================================

import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
