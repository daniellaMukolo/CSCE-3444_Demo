// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// One row in "Today, in a nutshell" - Shared
// =============================================================================
// WHAT IT DOES
//   Shows a section's character, its label, today's value, and a short note.
//
// HOW IT CONNECTS
//   - DashboardPage.tsx renders one per section.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this row's layout and styling (her version used icons).
// =============================================================================

import { Character } from '@/components/Character';
import type { CharacterName } from '@/lib/characters';

/** One row in "Today, in a nutshell": the section's character, label, value, and a short note. */
export function Metric({
  character,
  label,
  value,
  meta,
}: {
  character: CharacterName;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="metric-row">
      <div className="metric-icon">
        <Character name={character} size={34} />
      </div>
      <div className="metric-text">
        <div className="metric-label">{label}</div>
        <div className="metric-value" data-testid={`value-${label.toLowerCase().replace(' ', '-')}`}>
          {value}
        </div>
      </div>
      <div className="metric-meta">{meta}</div>
    </div>
  );
}

/** Turns a 1-5 stress rating into words. */
export function stressLabel(value: number) {
  return value <= 2 ? 'Light' : value === 3 ? 'In the middle' : 'A lot';
}
