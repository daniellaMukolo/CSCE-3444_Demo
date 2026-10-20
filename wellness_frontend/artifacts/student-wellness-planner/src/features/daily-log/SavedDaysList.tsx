// =============================================================================
// "Your saved days" list - Shared
// =============================================================================
// WHAT IT DOES
//   The panel beside the form listing the student's saved days (newest first),
//   each with open and delete buttons.
//
// HOW IT CONNECTS
//   - LogPage.tsx loads the days with listDays() (GET /api/days) and passes them in.
//   - Each row is a LogItem.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this panel, its wording and empty state.
// =============================================================================

import { BookOpen } from 'lucide-react';
import { Empty } from '@/components/Empty';
import { Panel } from '@/components/Panel';
import type { DaySummary } from '@/lib/types';
import { LogItem } from './LogItem';

export function SavedDaysList({
  days,
  selected,
  onSelect,
  onDelete,
}: {
  days: DaySummary[];
  selected: string;
  onSelect: (date: string) => void;
  onDelete: (date: string) => void;
}) {
  return (
    <Panel>
      <div className="panel-heading">
        <div>
          <h2>Your saved days</h2>
          <div className="subtle" style={{ marginTop: 5 }}>
            Only your own check-ins appear here
          </div>
        </div>
        <span className="subtle">{days.length}</span>
      </div>
      {days.length ? (
        <div className="log-list">
          {days.map((day) => (
            <LogItem
              key={day.date}
              day={day}
              selected={selected === day.date}
              onSelect={() => onSelect(day.date)}
              onDelete={() => onDelete(day.date)}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Your page starts here"
          body="Saved days will gather here, ready whenever you want to look back."
          icon={BookOpen}
        />
      )}
    </Panel>
  );
}
