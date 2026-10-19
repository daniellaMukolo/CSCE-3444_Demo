// DRAFT FOR DANIELLA: a temporary working draft written with Claude AI so that every
// planned feature of the app could be run and tested together. This section is Daniella's
// to design and write. She can keep, change or replace any part of it, or none of it.
// Every part is explained in the comments below, so pieces are easy to reuse or rewrite.

// =============================================================================
// "Compare" page: Compare Routines (FR-09 / UC-09) - Daniella
// =============================================================================
// WHAT IT DOES
//   Lets the student pick two date ranges ("routines"), for example last week
//   and the week before, and shows a table: each tracked area, both averages,
//   the change, and whether that change is better or worse.
//
// HOW IT CONNECTS
//   - App.tsx shows this page at /compare; Shell.tsx adds "Compare" to the menu.
//   - compareRoutines() in src/lib/api/progress.ts calls
//     GET /api/compare?aStart=...&aEnd=...&bStart=...&bEnd=...
//   - On the server, wellness_planner/wellness/api/compare.py runs summarize()
//     (from progress.py) once per range and builds the rows. This page only
//     displays what comes back; it does no math of its own.
//   - When the page first opens we send no dates, so the server uses its
//     defaults: B = the last 7 days, A = the 7 days before that.
//
// UC-09 ALTERNATIVE FLOW
//   If either range has fewer than 3 logged days, the server sends
//   enoughData: false and we show "log at least 3 days" instead of the table.
// =============================================================================

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import { Empty } from '@/components/Empty';
import { Character } from '@/components/Character';
import { FieldError } from '@/components/FieldError';
import { Heading } from '@/components/Heading';
import { Panel } from '@/components/Panel';
import { LoadError, Loading } from '@/components/Status';
import { ApiError, errorMessage } from '@/lib/api/client';
import { compareRoutines, type CompareDates } from '@/lib/api/progress';
import { CATEGORY_CHARACTER } from '@/lib/characters';
import { dateLabel, todayISO } from '@/lib/dates';
import type { CompareResponse, CompareRow } from '@/lib/types';

// Words and a CSS class for each direction, so the result never relies on color alone (accessibility).
const DIRECTION_TEXT: Record<CompareRow['direction'], string> = {
  better: 'Better',
  worse: 'Worse',
  same: 'No change',
  none: 'Not enough data',
};

export function ComparePage() {
  // useState keeps values that change while the page is open.
  const [dates, setDates] = useState<Required<CompareDates>>({ aStart: '', aEnd: '', bStart: '', bEnd: '' });
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(true);

  // Ask the server to compare. With no dates it uses its defaults (see top of file).
  async function run(chosen: CompareDates = {}) {
    setBusy(true);
    setErrors({});
    setLoadError('');
    try {
      const response = await compareRoutines(chosen);
      setResult(response);
      // Fill the date boxes with the ranges the server actually used.
      setDates({
        aStart: response.a.start,
        aEnd: response.a.end,
        bStart: response.b.start,
        bEnd: response.b.end,
      });
    } catch (err) {
      // 400 with {errors: {aEnd: "..."}} means a date problem; show it under that box.
      if (err instanceof ApiError && err.data.errors) setErrors(err.data.errors);
      else setLoadError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // useEffect with [] runs once, when the page first appears: compare the default weeks.
  useEffect(() => {
    run();
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser from reloading the page on submit
    run(dates);
  };

  // A small helper that draws one date box with its label and error message.
  const dateField = (key: keyof CompareDates, label: string) => (
    <div className="field">
      <label htmlFor={`compare-${key}`}>{label}</label>
      <input
        id={`compare-${key}`}
        type="date"
        max={todayISO()}
        value={dates[key]}
        onChange={(e) => setDates({ ...dates, [key]: e.target.value })}
        className={errors[key] ? 'has-error' : undefined}
        data-testid={`input-compare-${key}`}
      />
      <FieldError id={`compare-${key}-error`} message={errors[key]} />
    </div>
  );

  // Show a number, or a dash when a range has no data for that area.
  const show = (value: number | null) => (value === null ? '—' : value);
  const range = (start: string, end: string) =>
    `${dateLabel(start, { month: 'short', day: 'numeric' })} – ${dateLabel(end, { month: 'short', day: 'numeric' })}`;

  return (
    <>
      <Heading
        eyebrow="Try it both ways"
        title="Compare two weeks."
        subtitle="Pick two stretches of time and see how your sleep, stress, movement, food, and screen time changed."
      />
      <form className="panel compare-form" onSubmit={submit} noValidate>
        <fieldset>
          <legend>Routine A</legend>
          <div className="field-grid">
            {dateField('aStart', 'From')}
            {dateField('aEnd', 'To')}
          </div>
        </fieldset>
        <fieldset>
          <legend>Routine B</legend>
          <div className="field-grid">
            {dateField('bStart', 'From')}
            {dateField('bEnd', 'To')}
          </div>
        </fieldset>
        <button type="submit" className="button primary" disabled={busy} data-testid="button-compare">
          <ArrowLeftRight size={16} /> {busy ? 'Comparing…' : 'Compare'}
        </button>
      </form>

      {/* Pick what to show: loading, an error, "not enough data", or the table. */}
      {busy && !result ? (
        <Loading label="Comparing your routines…" />
      ) : loadError ? (
        <LoadError message={loadError} onRetry={() => run(dates)} />
      ) : result && !result.enoughData ? (
        <Panel>
          <Empty
            title={`Log at least ${result.minDays} days in each routine to compare them`}
            body={`Routine A has ${result.a.loggedDays} logged day(s) and routine B has ${result.b.loggedDays}.`}
            icon={ArrowLeftRight}
            action={
              <Link href="/log" className="button primary small">
                Write a check-in <ArrowRight size={14} />
              </Link>
            }
          />
        </Panel>
      ) : result ? (
        <Panel>
          <div className="table-scroll">
            <table className="compare-table" data-testid="table-compare">
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">
                    Routine A<span>{range(result.a.start, result.a.end)}</span>
                  </th>
                  <th scope="col">
                    Routine B<span>{range(result.b.start, result.b.end)}</span>
                  </th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                {/* .map() turns each row from the server into a table row. */}
                {result.rows.map((row) => (
                  <tr key={row.key} data-testid={`compare-row-${row.key}`}>
                    <th scope="row">
                      {/* Each row shows its section's character (lib/characters.ts). */}
                      <div className="compare-area">
                        <Character name={CATEGORY_CHARACTER[row.key]} size={34} />
                        <div>
                          {row.label}
                          <span>{row.unit}</span>
                        </div>
                      </div>
                    </th>
                    <td>{show(row.a)}</td>
                    <td>{show(row.b)}</td>
                    <td>
                      <span className={`direction ${row.direction}`}>
                        {row.change !== null &&
                          row.change !== 0 &&
                          `${row.change > 0 ? '+' : ''}${row.change} · `}
                        {DIRECTION_TEXT[row.direction]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="subtle" style={{ marginTop: 12 }}>
            Higher is better for sleep, movement, and food; lower is better for stress and screen time.
          </p>
        </Panel>
      ) : null}
    </>
  );
}
