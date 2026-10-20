// AI ASSISTANCE: Drafted with Claude (Anthropic) from Malika Ray's Replit AI prototype, and reviewed by Malika Ray.
// =============================================================================
// Short pop-up message - Malika (design)
// =============================================================================
// WHAT IT DOES
//   A small status message (e.g. "Your check-in is saved.") that disappears by itself.
//
// HOW IT CONNECTS
//   - App.tsx shows it whenever a page calls notify(text).
//   - useEffect starts a 2.5-second timer; the cleanup cancels it if the message changes.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this component (unchanged apart from formatting).
// =============================================================================

import { useEffect } from 'react';

/** A short status message that disappears after 2.5 seconds. */
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-message" role="status" data-testid="status-toast">
      {message}
    </div>
  );
}
