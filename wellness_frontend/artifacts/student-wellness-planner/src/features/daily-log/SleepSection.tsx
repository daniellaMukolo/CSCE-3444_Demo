// =============================================================================
// Sleep section of the daily check-in (FR-02 / UC-02) - Bobby
// =============================================================================
// WHAT IT DOES
//   Bedtime and wake time boxes, and an optional 1-5 "how restful" rating.
//   The hours are calculated as you type and shown as a preview.
//
// HOW IT CONNECTS
//   - LogPage.tsx renders it with value = { bedtime, wakeTime, quality }.
//   - hoursBetween (lib/dates.ts) uses the same rule as the server, so the preview
//     matches what's saved by wellness_planner/wellness/api/sections/sleep.py.
//   - Errors come back as errors["sleep.bedtime"] etc., shown under each box.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the 1-5 quality buttons (segmented style).
//   Her version had one "hours slept" box; bedtime/wake time follow the SRS (UC-02).
// =============================================================================

import { FieldError } from '@/components/FieldError';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import { hoursBetween } from '@/lib/dates';
import type { DayForm, SectionProps } from './types';

export function SleepSection({ value, onChange, errors }: SectionProps<DayForm['sleep']>) {
  // Only calculate once both times are filled in.
  const hours = value.bedtime && value.wakeTime ? hoursBetween(value.bedtime, value.wakeTime) : null;
  return (
    <Panel>
      <SectionHeading character="sleep" title="Sleep" />
      <div className="field-grid">
        <div className="field">
          <label htmlFor="sleep-bedtime">Bedtime</label>
          <input
            id="sleep-bedtime"
            type="time"
            value={value.bedtime}
            className={errors['sleep.bedtime'] ? 'has-error' : undefined}
            // { ...value, bedtime } copies the section's values and replaces only bedtime.
            onChange={(e) => onChange({ ...value, bedtime: e.target.value })}
            data-testid="input-sleep-bedtime"
          />
          <FieldError id="sleep-bedtime-error" message={errors['sleep.bedtime']} />
        </div>
        <div className="field">
          <label htmlFor="sleep-wake">Wake time</label>
          <input
            id="sleep-wake"
            type="time"
            value={value.wakeTime}
            className={errors['sleep.wakeTime'] ? 'has-error' : undefined}
            onChange={(e) => onChange({ ...value, wakeTime: e.target.value })}
            data-testid="input-sleep-wake"
          />
          <FieldError id="sleep-wake-error" message={errors['sleep.wakeTime']} />
        </div>
      </div>
      <p className="field-help" style={{ margin: '10px 0 14px' }} data-testid="text-sleep-hours">
        {hours !== null
          ? `That’s ${hours} hours of sleep.`
          : 'Leave both blank if you’d rather not log sleep today.'}
      </p>
      <div className="field">
        <label>How restful was it? (optional)</label>
        <div className="segmented" role="group" aria-label="Sleep quality from one to five">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className={`segment ${value.quality === n ? 'selected' : ''}`}
              // Tapping the selected number again clears the rating (it's optional).
              onClick={() => onChange({ ...value, quality: value.quality === n ? null : n })}
              aria-pressed={value.quality === n}
              data-testid={`button-sleep-quality-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="field-help">1 = not much · 5 = very. Tap again to clear.</span>
        <FieldError id="sleep-quality-error" message={errors['sleep.quality']} />
      </div>
    </Panel>
  );
}
