// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// "Start with the basics": pick the day - Shared
// =============================================================================
// WHAT IT DOES
//   Chooses which day to check in for: a large date box plus Today and Yesterday
//   buttons. The whole character crew gathers below it; each character then appears
//   again on its own section further down.
//
// HOW IT CONNECTS
//   - LogPage.tsx passes the selected date, onSelect, and a status line
//     ("Saved — edit anything below.").
//   - max={today} stops future dates; the server checks this too (api/helpers.py).
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the "Start with the basics" panel and its
//   date field and segmented-button style. The character crew replaced her photo tiles.
// =============================================================================

import { Character } from '@/components/Character';
import { toISODate, todayISO } from '@/lib/dates';
import type { CharacterName } from '@/lib/characters';

// The crew, in lineup order (left to right).
const CREW: { name: CharacterName; className: string }[] = [
  { name: 'schedule', className: 'crew-schedule' },
  { name: 'sleep', className: 'crew-sleep' },
  { name: 'stress', className: 'crew-stress' },
  { name: 'movement', className: 'crew-movement' },
  { name: 'food', className: 'crew-food' },
  { name: 'screen', className: 'crew-screen' },
  { name: 'progress', className: 'crew-progress' },
];

const yesterdayISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
};

export function DayPickerPanel({
  selected,
  onSelect,
  status,
}: {
  selected: string;
  onSelect: (date: string) => void;
  status: string; // "Saved — edit anything below." etc.
}) {
  const today = todayISO();
  const yesterday = yesterdayISO();
  return (
    <section className="panel basics-panel">
      <div className="basics-copy">
        <div className="eyebrow">Start with the basics</div>
        <h2 className="basics-title">Which day are we checking in?</h2>
        <div className="basics-date">
          <label htmlFor="log-date" className="sr-only">
            Day
          </label>
          <input
            id="log-date"
            type="date"
            value={selected}
            max={today}
            // Ignore an empty value (the browser sends '' while a date is half typed).
            onChange={(e) => e.target.value && onSelect(e.target.value)}
            data-testid="input-log-date"
          />
          <div className="segmented" role="group" aria-label="Quick dates">
            <button
              type="button"
              className={`segment ${selected === today ? 'selected' : ''}`}
              aria-pressed={selected === today}
              onClick={() => onSelect(today)}
              data-testid="button-date-today"
            >
              Today
            </button>
            <button
              type="button"
              className={`segment ${selected === yesterday ? 'selected' : ''}`}
              aria-pressed={selected === yesterday}
              onClick={() => onSelect(yesterday)}
              data-testid="button-date-yesterday"
            >
              Yesterday
            </button>
          </div>
        </div>
        <p className="field-help" aria-live="polite">
          {status}
        </p>
      </div>
      <div className="character-crew" aria-hidden="true">
        {CREW.map(({ name, className }) => (
          <Character key={name} name={name} className={`crew ${className}`} />
        ))}
      </div>
    </section>
  );
}
