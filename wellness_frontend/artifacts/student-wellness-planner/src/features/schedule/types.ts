// AI ASSISTANCE: Drafted with Claude (Anthropic) from Malika Ray's Replit AI prototype, and reviewed by Malika Ray.
// =============================================================================
// Schedule form helpers - Malika
// =============================================================================
// WHAT IT DOES
//   The shape of an item being added or edited, and a blank item to start from.
//
// HOW IT CONNECTS
//   - Used by SchedulePage.tsx and ClassDialog.tsx.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the blank-item starting values.
// =============================================================================

import { COLORS } from '@/lib/constants';
import type { ScheduleItem } from '@/lib/types';

/** An item being added (no id yet) or edited (has an id). */
export type ScheduleDraft = Omit<ScheduleItem, 'id'> & { id?: number };

export const emptyItem: ScheduleDraft = {
  name: '',
  itemType: 'Class',
  days: ['Mon'],
  startTime: '09:00',
  endTime: '10:00',
  location: '',
  color: COLORS[0],
};
