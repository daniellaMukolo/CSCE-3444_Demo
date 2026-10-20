// =============================================================================
// Section heading with its character - Shared (character rule)
// =============================================================================
// WHAT IT DOES
//   A panel heading with the section's character beside the title, so every section
//   looks the same everywhere: character, title, optional subtitle, optional button.
//
// HOW IT CONNECTS
//   - Used by every Daily log section, the Today page cards and the Your patterns charts.
//   - Styles: .section-heading, .section-title, .section-character in index.css.
// =============================================================================

import type { ReactNode } from 'react';
import type { CharacterName } from '@/lib/characters';
import { Character } from './Character';

export function SectionHeading({
  character,
  title,
  subtitle,
  action,
  size = 56,
}: {
  character: CharacterName;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  size?: number;
}) {
  return (
    <div className="panel-heading section-heading">
      <div className="section-title">
        <Character name={character} size={size} className="section-character" />
        <div>
          <h2>{title}</h2>
          {subtitle && (
            <div className="subtle" style={{ marginTop: 5 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
