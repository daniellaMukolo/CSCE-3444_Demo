// AI ASSISTANCE: Drafted with Claude (Anthropic) from Malika Ray's Replit AI prototype, and reviewed by Malika Ray.
// =============================================================================
// Page title block - Malika (design)
// =============================================================================
// WHAT IT DOES
//   The heading at the top of each page: a small "eyebrow" line, the big title, a
//   subtitle, and an optional button on the right.
//
// HOW IT CONNECTS
//   - Used by the Daily log, My week, Your patterns, Compare and Profile pages.
//   - Styles: .page-head, .eyebrow, .page-title, .page-subtitle in index.css.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this component (unchanged apart from formatting).
// =============================================================================

import type { ReactNode } from 'react';

/** Page title block with an optional button on the right. */
export function Heading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
