// =============================================================================
// One schedule item in a list - Malika
// =============================================================================
// WHAT IT DOES
//   Shows an item's color, name, time and place. Edit and delete buttons appear only
//   when handlers are passed (My week passes them; the Today page does not).
//
// HOW IT CONNECTS
//   - Used by SchedulePage.tsx and DashboardPage.tsx.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this row's layout and styling.
// =============================================================================

import { Pencil, Trash2 } from 'lucide-react';
import { COLORS } from '@/lib/constants';
import type { ScheduleItem } from '@/lib/types';

export function ScheduleRow({
  item,
  onEdit,
  onDelete,
}: {
  item: ScheduleItem;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="schedule-item" data-testid={`schedule-entry-${item.id}`}>
      <div className="schedule-color" style={{ background: item.color || COLORS[0] }} />
      <div className="schedule-info">
        <strong>{item.name}</strong>
        <span>
          {item.itemType} · {item.location || 'Location not set'}
        </span>
      </div>
      <div className="schedule-time">
        {item.startTime}–{item.endTime}
      </div>
      {onEdit && (
        <button
          className="icon-button"
          aria-label={`Edit ${item.name}`}
          data-testid={`button-edit-class-${item.id}`}
          onClick={onEdit}
        >
          <Pencil size={14} />
        </button>
      )}
      {onDelete && (
        <button
          className="icon-button"
          aria-label={`Delete ${item.name}`}
          data-testid={`button-delete-class-${item.id}`}
          onClick={onDelete}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
