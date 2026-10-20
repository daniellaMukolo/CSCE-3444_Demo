// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Week strip status icon - Shared
// =============================================================================
// WHAT IT DOES
//   The icon for one day in "This week, at a glance":
//     complete -> green circle with a check mark (every tracked section logged)
//     partial  -> a ring filled in proportion to the sections logged (e.g. 3 of 5)
//     none     -> an empty dashed circle (nothing logged)
//
// HOW IT CONNECTS
//   - The tracked sections are TRACKED_SECTIONS in lib/constants.ts (same as api/days.py).
//   - DashboardPage.tsx passes how many sections were logged that day.
// =============================================================================

import { Check } from 'lucide-react';

const RADIUS = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // the ring's length, used to draw a partial ring

export function dayStatusLabel(done: number, total: number) {
  if (done >= total) return `All ${total} sections logged`;
  if (done > 0) return `${done} of ${total} sections logged`;
  return 'Not logged';
}

export function DayStatusIcon({ done, total }: { done: number; total: number }) {
  const label = dayStatusLabel(done, total);

  if (done >= total) {
    return (
      <span className="day-status complete" role="img" aria-label={label} title={label}>
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }

  if (done > 0) {
    const filled = (done / total) * CIRCUMFERENCE;
    return (
      <span className="day-status partial" role="img" aria-label={label} title={label}>
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <circle cx="10" cy="10" r={RADIUS} className="ring-track" />
          {/* The arc starts at the top (rotate -90°) and covers done/total of the circle. */}
          <circle
            cx="10"
            cy="10"
            r={RADIUS}
            className="ring-fill"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            transform="rotate(-90 10 10)"
          />
        </svg>
      </span>
    );
  }

  return <span className="day-status none" role="img" aria-label={label} title={label} />;
}
