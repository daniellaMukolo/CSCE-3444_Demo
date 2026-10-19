// =============================================================================
// Weekly schedule requests (FR-04) - Malika
// =============================================================================
// WHAT IT DOES
//   List, add, edit and delete schedule items. allowOverlap: true saves an item even
//   if it overlaps another one (after the student confirms).
//
// HOW IT CONNECTS
//   - Matches wellness_planner/wellness/api/schedule.py.
//   - Used by features/schedule/SchedulePage.tsx and the Today page.
// =============================================================================

import type { ScheduleItem } from '../types';
import { api } from './client';

export type ScheduleInput = Omit<ScheduleItem, 'id'> & { allowOverlap?: boolean };

export const listSchedule = () =>
  api<{ items: ScheduleItem[]; days: string[]; itemTypes: string[] }>('/schedule');

/** Add (no id) or edit (with id). Errors: 400 {errors}, or 409 {warning: "overlap", conflicts}. */
export const saveScheduleItem = (input: ScheduleInput, id?: number) =>
  api<{ item: ScheduleItem }>(id ? `/schedule/${id}` : '/schedule', {
    method: id ? 'PUT' : 'POST',
    body: input,
  });

export const deleteScheduleItem = (id: number) => api(`/schedule/${id}`, { method: 'DELETE' });
