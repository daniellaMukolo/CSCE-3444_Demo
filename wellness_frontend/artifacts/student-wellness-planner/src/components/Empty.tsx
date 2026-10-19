// =============================================================================
// Friendly empty state - Malika (design)
// =============================================================================
// WHAT IT DOES
//   The gentle placeholder shown when a list or chart has nothing in it yet,
//   with an icon, a title, a sentence, and an optional button.
//
// HOW IT CONNECTS
//   - Used by SavedDaysList, Chart, the Today page and others. Style: .empty-state.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this component (unchanged apart from formatting).
// =============================================================================

import type { ReactNode } from 'react';
import { Heart, Sparkles } from 'lucide-react';

/** Friendly placeholder shown when a list or chart has no data yet. */
export function Empty({
  title,
  body,
  action,
  icon: Icon = Sparkles,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: typeof Heart;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={19} />
      </div>
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}
