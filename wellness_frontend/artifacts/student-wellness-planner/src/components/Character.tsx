// =============================================================================
// Section character image - Shared (character rule)
// =============================================================================
// WHAT IT DOES
//   Draws a section's character (pillow for sleep, tea for stress, ...) at any size.
//   CharacterNote adds a speech bubble beside a character (used for tips and notes).
//
// HOW IT CONNECTS
//   - Which character belongs to which section is decided in lib/characters.ts.
//   - Characters are decoration beside a heading, so screen readers skip them unless
//     `describe` is set (then the image's label is read out).
//   - Images are in public/images/characters/. Styles: .character, .character-note.
// =============================================================================

import type { ReactNode } from 'react';
import { CHARACTERS, type CharacterName } from '@/lib/characters';

export function Character({
  name,
  size,
  className = '',
  describe = false,
}: {
  name: CharacterName;
  size?: number; // height in pixels (width follows the image's shape); leave out to size it with CSS
  className?: string;
  describe?: boolean; // true when the image carries meaning on its own
}) {
  const character = CHARACTERS[name];
  return (
    <img
      src={character.src}
      alt={describe ? character.label : ''}
      aria-hidden={describe ? undefined : true}
      className={`character ${className}`}
      style={size ? { height: size } : undefined}
      draggable={false}
    />
  );
}

/** A character with a short note in a speech bubble (used for tips and gentle reminders). */
export function CharacterNote({
  name,
  children,
  size = 58,
}: {
  name: CharacterName;
  children: ReactNode;
  size?: number;
}) {
  return (
    <div className="character-note">
      <Character name={name} size={size} />
      <div className="note-bubble">{children}</div>
    </div>
  );
}
