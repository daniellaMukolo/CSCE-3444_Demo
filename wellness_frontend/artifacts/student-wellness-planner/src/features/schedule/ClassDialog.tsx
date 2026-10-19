// =============================================================================
// Add/edit schedule item pop-up (FR-04 / UC-04) - Malika
// =============================================================================
// WHAT IT DOES
//   The pop-up form for a schedule item: name, type, days, start and end time,
//   location and color. Shows the server's messages under each field.
//
// HOW IT CONNECTS
//   - SchedulePage.tsx owns the draft and the save logic; this file is only the form.
//   - Closes with the X button or Cancel.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the dialog's layout, wording and color markers.
// =============================================================================

import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { FieldError } from '@/components/FieldError';
import { COLORS, DAY_KEYS, DAY_NAMES } from '@/lib/constants';
import type { ScheduleDraft } from './types';

const ITEM_TYPES = ['Class', 'Work', 'Study', 'Other'];

export function ClassDialog({
  editing,
  setEditing,
  errors,
  overlap,
  busy,
  onSubmit,
  onSaveAnyway,
}: {
  editing: ScheduleDraft;
  setEditing: (draft: ScheduleDraft | null) => void;
  errors: Record<string, string>;
  overlap: string[]; // names of overlapping items (UC-04 6a); empty = no warning
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
  onSaveAnyway: () => void;
}) {
  // Tapping a day adds it to the item's days, or removes it if it's already chosen.
  const toggleDay = (day: string) =>
    setEditing({
      ...editing,
      days: editing.days.includes(day) ? editing.days.filter((d) => d !== day) : [...editing.days, day],
    });
  const inputClass = (key: string) => (errors[key] ? 'has-error' : undefined);

  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}
    >
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="class-dialog-title">
        <div className="dialog-head">
          <div>
            <div className="eyebrow">Weekly schedule</div>
            <h2 id="class-dialog-title">{editing.id ? 'Edit an item' : 'Add to your week'}</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => setEditing(null)}
            aria-label="Close form"
            data-testid="button-close-class-dialog"
          >
            <X size={17} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 15 }} noValidate>
          <div className="field">
            <label htmlFor="course-name">Name</label>
            <input
              id="course-name"
              autoFocus
              maxLength={80}
              value={editing.name}
              className={inputClass('name')}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g. CSCE 3444 or Library shift"
              data-testid="input-class-name"
            />
            <FieldError id="course-name-error" message={errors.name} />
          </div>
          <div className="field">
            <label>Type</label>
            <div className="segmented" role="group" aria-label="Item type">
              {ITEM_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`segment ${editing.itemType === type ? 'selected' : ''}`}
                  aria-pressed={editing.itemType === type}
                  onClick={() => setEditing({ ...editing, itemType: type })}
                  data-testid={`button-item-type-${type}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <FieldError id="item-type-error" message={errors.itemType} />
          </div>
          <div className="field">
            <label>Repeats on</label>
            <div className="segmented" role="group" aria-label="Days of the week">
              {DAY_KEYS.map((day, i) => (
                <button
                  type="button"
                  key={day}
                  className={`segment ${editing.days.includes(day) ? 'selected' : ''}`}
                  aria-pressed={editing.days.includes(day)}
                  aria-label={DAY_NAMES[i]}
                  onClick={() => toggleDay(day)}
                  data-testid={`button-day-${day}`}
                >
                  {day}
                </button>
              ))}
            </div>
            <FieldError id="days-error" message={errors.days} />
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="class-start">Starts</label>
              <input
                id="class-start"
                type="time"
                value={editing.startTime}
                className={inputClass('startTime')}
                onChange={(e) => setEditing({ ...editing, startTime: e.target.value })}
                data-testid="input-class-start"
              />
              <FieldError id="class-start-error" message={errors.startTime} />
            </div>
            <div className="field">
              <label htmlFor="class-end">Ends</label>
              <input
                id="class-end"
                type="time"
                value={editing.endTime}
                className={inputClass('endTime')}
                onChange={(e) => setEditing({ ...editing, endTime: e.target.value })}
                data-testid="input-class-end"
              />
              <FieldError id="class-end-error" message={errors.endTime} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="class-location">
              Location <span className="field-help">(optional)</span>
            </label>
            <input
              id="class-location"
              maxLength={100}
              value={editing.location}
              className={inputClass('location')}
              onChange={(e) => setEditing({ ...editing, location: e.target.value })}
              placeholder="Building, room, or online"
              data-testid="input-class-location"
            />
            <FieldError id="class-location-error" message={errors.location} />
          </div>
          <div className="field">
            <label>Color marker</label>
            <div className="segmented">
              {COLORS.map((color, index) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Choose color ${index + 1}`}
                  aria-pressed={editing.color === color}
                  onClick={() => setEditing({ ...editing, color })}
                  data-testid={`button-class-color-${index}`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: color,
                    border: editing.color === color ? '3px solid #31594b' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
          {overlap.length > 0 && (
            <div className="form-alert warning" role="alert" data-testid="status-overlap">
              <span>This overlaps with {overlap.join(', ')} on the same day.</span>
              <button
                type="button"
                className="button outline small"
                onClick={onSaveAnyway}
                disabled={busy}
                data-testid="button-save-anyway"
              >
                Save anyway
              </button>
            </div>
          )}
          {errors.form && (
            <div className="form-alert" role="alert">
              {errors.form}
            </div>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="button ghost"
              onClick={() => setEditing(null)}
              data-testid="button-cancel-class"
            >
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={busy} data-testid="button-save-class">
              {editing.id ? 'Save changes' : 'Add to week'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
