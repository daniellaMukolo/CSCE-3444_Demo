// =============================================================================
// Daily check-in requests - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   One small function per Daily log address: the form's choice lists, the list of
//   saved days, and loading, saving or deleting one day.
//
// HOW IT CONNECTS
//   - Matches wellness_planner/wellness/api/days.py.
//   - Used by the Daily log page (features/daily-log) and the Today page.
// =============================================================================

import type { Day, DayOptions, DaySummary } from '../types';
import { api } from './client';

export const getDayOptions = () => api<DayOptions>('/days/options');

export const listDays = (limit = 30) =>
  api<{ days: DaySummary[] }>(`/days?limit=${limit}`).then((r) => r.days);

export const getDay = (date: string) => api<Day>(`/days/${date}`);

/** Save the whole day. Errors: 400 {errors}, or 409 {confirm: "longSleep", totalHours}. */
export const saveDay = (date: string, payload: unknown) =>
  api<Day>(`/days/${date}`, { method: 'PUT', body: payload });

export const deleteDay = (date: string) => api(`/days/${date}`, { method: 'DELETE' });
