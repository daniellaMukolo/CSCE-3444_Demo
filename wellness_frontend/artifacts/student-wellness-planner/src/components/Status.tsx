// =============================================================================
// Loading and error boxes - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   Loading shows "Loading…" while a page waits for the server. LoadError shows what
//   went wrong, with a Try again button.
//
// HOW IT CONNECTS
//   - Pages use these with hooks/use-api.ts (which gives loading, error and reload).
// =============================================================================

import { RotateCw } from 'lucide-react';
import { Panel } from './Panel';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <Panel>
      <div className="subtle" role="status">
        {label}
      </div>
    </Panel>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Panel>
      <div className="form-alert" role="alert">
        <span>{message}</span>
        {onRetry && (
          <button type="button" className="button outline small" onClick={onRetry}>
            <RotateCw size={14} /> Try again
          </button>
        )}
      </div>
    </Panel>
  );
}
