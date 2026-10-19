// DRAFT FOR DANIELLA: a temporary working draft written with Claude AI so that every
// planned feature of the app could be run and tested together. This section is Daniella's
// to design and write. She can keep, change or replace any part of it, or none of it.
// Every part is explained in the comments below, so pieces are easy to reuse or rewrite.

// =============================================================================
// Screen time section of the daily check-in (FR-08 / UC-08) - Daniella
// =============================================================================
// WHAT IT DOES
//   One box for today's total screen time in hours (quarter hours allowed).
//   Leaving it blank means "not logged today".
//
// HOW IT CONNECTS
//   - LogPage.tsx renders <ScreenTimeSection ... /> and passes its slice of the
//     form: value = { hours: "4.5" }. The hours are kept as text while typing;
//     types.ts (toPayload) turns them into a number when saving.
//   - The server checks the value in
//     wellness_planner/wellness/api/sections/screen_time.py (0 to 24 hours) and
//     saves it to the screen_time_entries table (one row per day).
//   - A problem comes back as errors["screenTime.hours"], shown under the box.
//   - My Progress and Compare Routines use the saved hours for averages.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the screen-hours box and its wording.
// =============================================================================

import { FieldError } from '@/components/FieldError';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import type { DayForm, SectionProps } from './types';

// DayForm['screenTime'] is the type { hours: string } (see types.ts).
export function ScreenTimeSection({ value, onChange, errors }: SectionProps<DayForm['screenTime']>) {
  const error = errors['screenTime.hours'];
  return (
    <Panel>
      <SectionHeading character="screen" title="Screen time" />
      <div className="field">
        <label htmlFor="screen-hours">Hours on screens today</label>
        <input
          id="screen-hours"
          type="number"
          inputMode="decimal"
          min="0"
          max="24"
          step=".25"
          placeholder="e.g. 4.5"
          value={value.hours}
          // { ...value, hours } copies the old object and replaces only `hours`.
          onChange={(e) => onChange({ ...value, hours: e.target.value })}
          className={error ? 'has-error' : undefined}
          // aria-describedby links the box to its help or error text for screen readers.
          aria-describedby={error ? 'screen-hours-error' : 'screen-hours-help'}
          data-testid="input-screen-hours"
        />
        {!error && (
          <span className="field-help" id="screen-hours-help">
            Total time on your phone, computer, TV, and tablet. Leave blank to skip.
          </span>
        )}
        <FieldError id="screen-hours-error" message={error} />
      </div>
    </Panel>
  );
}
