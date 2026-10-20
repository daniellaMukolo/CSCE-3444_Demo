// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Progress (FR-03, Bobby) and Compare Routines (FR-09, Daniella) requests
// =============================================================================
// WHAT IT DOES
//   getProgress (Bobby): the 7- or 30-day summary and tips for Your patterns.
//   getCompare (Daniella): two date ranges compared side by side.
//
// HOW IT CONNECTS
//   - Match wellness_planner/wellness/api/progress.py and api/compare.py.
//   - Used by features/progress/ProgressPage.tsx and features/compare/ComparePage.tsx.
// =============================================================================

import type { CompareResponse, ProgressResponse } from '../types';
import { api } from './client';

export const getProgress = (days: 7 | 30) => api<ProgressResponse>(`/progress?days=${days}`);

export interface CompareDates {
  aStart?: string;
  aEnd?: string;
  bStart?: string;
  bEnd?: string;
}

/** Compare two date ranges. Missing dates use the server's defaults (last week vs the week before). */
export function compareRoutines(dates: CompareDates = {}) {
  const query = new URLSearchParams(
    Object.entries(dates).filter(([, value]) => value) as [string, string][],
  ).toString();
  return api<CompareResponse>(`/compare${query ? `?${query}` : ''}`);
}
