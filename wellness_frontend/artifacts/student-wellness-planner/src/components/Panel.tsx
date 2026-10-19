// =============================================================================
// Card section - Malika (design)
// =============================================================================
// WHAT IT DOES
//   The rounded card ("panel") that holds each section on every page.
//
// HOW IT CONNECTS
//   - Used everywhere. Style: .panel in index.css.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this component (unchanged apart from formatting).
// =============================================================================

import type { CSSProperties, ReactNode } from 'react';

/** A white card section used throughout the app. */
export function Panel({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`panel ${className}`} style={style}>
      {children}
    </section>
  );
}
