// DRAFT FOR DANIELLA: a temporary working draft written with Claude AI so that every
// planned feature of the app could be run and tested together. This section is Daniella's
// to design and write. She can keep, change or replace any part of it, or none of it.
// Every part is explained in the comments below, so pieces are easy to reuse or rewrite.

// =============================================================================
// Movement section of the daily check-in (FR-07 / UC-07) - Daniella
// =============================================================================
// WHAT IT DOES
//   Lets the student list each activity they did today ("Walking, 30 min",
//   "Gym, 45 min"), add more rows, remove rows, and see today's total minutes.
//
// HOW IT CONNECTS
//   - LogPage.tsx renders <MovementSection ... /> and owns the whole form.
//     This component only receives its own slice (`value`, a list of rows) and
//     calls `onChange` with the new list whenever something changes.
//   - When the student presses Save, LogPage sends the form to the server
//     (PUT /api/days/<date>). The server checks the activities in
//     wellness_planner/wellness/api/sections/exercise.py and saves them to the
//     exercise_entries table.
//   - If the server finds a problem it returns errors such as
//     {"exercise.minutes.1": "Enter whole minutes from 1 to 600."}. The ".1"
//     means "the second row", so we show that message under that row's box.
//   - `activityTypes` (the dropdown choices) also come from exercise.py, so the
//     list is defined in one place.
//
// REACT IDEAS USED HERE
//   - Props: the values passed in from the parent (value, onChange, errors...).
//   - We never change `value` directly. We build a NEW list and pass it to
//     onChange; React then re-draws the page with it ("immutable updates").
//   - `key` on each row helps React track rows when one is removed.
// =============================================================================

import { Plus, X } from 'lucide-react';
import { FieldError } from '@/components/FieldError';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import { createKey } from '@/lib/constants';
import type { ActivityRow, SectionProps } from './types';

// "SectionProps<ActivityRow[]>" = value, onChange and errors (see types.ts).
// "& { activityTypes: string[] }" adds one more prop just for this section.
export function MovementSection({
  value,
  onChange,
  errors,
  activityTypes,
}: SectionProps<ActivityRow[]> & { activityTypes: string[] }) {
  // Add a new empty row. [...value, newRow] copies the old list and adds one item at the end.
  const addActivity = () =>
    onChange([...value, { key: createKey(), activityType: activityTypes[0] ?? 'Walking', minutes: '' }]);

  // Change one field of one row. .map() returns a new list where only the matching row is replaced.
  const updateActivity = (key: string, field: 'activityType' | 'minutes', text: string) =>
    onChange(value.map((row) => (row.key === key ? { ...row, [field]: text } : row)));

  // Remove a row. .filter() returns a new list without the row whose key matches.
  const removeActivity = (key: string) => onChange(value.filter((row) => row.key !== key));

  // Today's total, shown in the heading. Number('') is 0, so blank boxes count as 0 here.
  const totalMinutes = value.reduce((sum, row) => sum + (Number(row.minutes) || 0), 0);

  return (
    <Panel>
      {/* SectionHeading (components/SectionHeading.tsx) shows this section's character beside the title. */}
      <SectionHeading
        character="movement"
        title="Movement"
        subtitle={value.length ? `${totalMinutes} minutes today` : 'Walks between classes count too'}
        action={
          <button
            type="button"
            className="button outline small"
            onClick={addActivity}
            data-testid="button-add-activity"
          >
            <Plus size={14} /> Add activity
          </button>
        }
      />

      {/* Show the rows, or a friendly message when the list is empty. */}
      {value.length ? (
        <div className="meal-list">
          {value.map((row, index) => (
            <div className="activity-row" key={row.key} data-testid={`activity-row-${index}`}>
              <div className="field">
                {/* sr-only = visible to screen readers only, so every input still has a label */}
                <label className="sr-only" htmlFor={`activity-type-${row.key}`}>
                  Activity
                </label>
                <select
                  id={`activity-type-${row.key}`}
                  value={row.activityType}
                  onChange={(e) => updateActivity(row.key, 'activityType', e.target.value)}
                  className={errors[`exercise.activityType.${index}`] ? 'has-error' : undefined}
                  data-testid={`select-activity-type-${index}`}
                >
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FieldError
                  id={`activity-type-${row.key}-error`}
                  message={errors[`exercise.activityType.${index}`]}
                />
              </div>
              <div className="field">
                <label className="sr-only" htmlFor={`activity-minutes-${row.key}`}>
                  Minutes
                </label>
                <input
                  id={`activity-minutes-${row.key}`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="600"
                  step="5"
                  placeholder="Minutes"
                  value={row.minutes}
                  onChange={(e) => updateActivity(row.key, 'minutes', e.target.value)}
                  className={errors[`exercise.minutes.${index}`] ? 'has-error' : undefined}
                  data-testid={`input-activity-minutes-${index}`}
                />
                <FieldError
                  id={`activity-minutes-${row.key}-error`}
                  message={errors[`exercise.minutes.${index}`]}
                />
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${row.activityType}`}
                onClick={() => removeActivity(row.key)}
                data-testid={`button-remove-activity-${index}`}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '18px 15px' }}>
          <p>No movement logged yet. Add an activity if you moved today.</p>
        </div>
      )}
      <FieldError id="exercise-error" message={errors['exercise.activities']} />
    </Panel>
  );
}
