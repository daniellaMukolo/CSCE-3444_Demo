// =============================================================================
// One saved day in the list - Shared
// =============================================================================
// WHAT IT DOES
//   A row with the date chip, a short summary (sleep, movement, meals), and edit and
//   delete buttons.
//
// HOW IT CONNECTS
//   - SavedDaysList.tsx renders one per saved day; the summary comes from GET /api/days.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this row's layout and styling.
// =============================================================================

import { Pencil, Trash2 } from 'lucide-react';
import { dateLabel, fromISODate } from '@/lib/dates';
import type { DaySummary } from '@/lib/types';

export function LogItem({
  day,
  selected,
  onSelect,
  onDelete,
}: {
  day: DaySummary;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const date = fromISODate(day.date);
  return (
    <div className="log-item" data-testid={`log-row-${day.date}`}>
      <button
        type="button"
        className="log-date-chip"
        onClick={onSelect}
        aria-label={`Open ${dateLabel(day.date)}`}
        style={{ border: 0, outline: selected ? '2px solid #71977a' : undefined }}
        data-testid={`button-select-log-${day.date}`}
      >
        <span>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
        <strong>{date.getDate()}</strong>
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="log-summary"
        style={{ background: 'none', border: 0, textAlign: 'left', padding: 0 }}
      >
        <strong>{dateLabel(day.date, { weekday: 'long' })}</strong>
        <span>
          {day.sleepHours ?? '–'} hrs sleep · {day.exerciseMinutes} min movement · {day.mealCount} meals
        </span>
      </button>
      <div className="log-actions">
        <button
          className="icon-button"
          aria-label="Edit check-in"
          onClick={onSelect}
          data-testid={`button-edit-log-${day.date}`}
        >
          <Pencil size={14} />
        </button>
        <button
          className="icon-button"
          aria-label="Delete check-in"
          onClick={onDelete}
          data-testid={`button-delete-log-${day.date}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
