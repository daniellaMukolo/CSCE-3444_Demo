// =============================================================================
// Reflection: "Anything else?" - Shared
// =============================================================================
// WHAT IT DOES
//   An optional free-text note for the day (up to 1,000 characters).
//
// HOW IT CONNECTS
//   - Saved by api/sections/notes.py; the Today page shows today's note.
//   - The label is visually hidden (sr-only) but still read by screen readers.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the reflection box and its wording.
// =============================================================================

import { FieldError } from '@/components/FieldError';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import type { SectionProps } from './types';

export function ReflectionSection({ value, onChange, errors }: SectionProps<string>) {
  return (
    <Panel>
      <SectionHeading
        character="today"
        title="Anything else?"
        subtitle="A win, a worry, or something to remember."
      />
      <div className="field">
        <label htmlFor="reflection" className="sr-only">
          Anything else you want to remember?
        </label>
        <textarea
          id="reflection"
          maxLength={1000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="A win, a worry, or something you want to make space for..."
          data-testid="input-reflection"
        />
        <span className="field-help">{value.length}/1,000 characters</span>
        <FieldError id="reflection-error" message={errors['note.note']} />
      </div>
    </Panel>
  );
}
