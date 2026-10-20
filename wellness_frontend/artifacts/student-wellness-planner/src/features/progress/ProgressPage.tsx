// =============================================================================
// "Your patterns" page (FR-03 / UC-03) - Bobby
// =============================================================================
// WHAT IT DOES
//   7- or 30-day averages, one bar chart per category, and routine feedback: tips
//   from the Recommendation Library, each with its source. Each chart box also has a
//   character note: that category's tip if one applies, or an encouraging line.
//
// HOW IT CONNECTS
//   - Loads getProgress(days) from lib/api/progress.ts (api/progress.py).
//   - Tips appear only after 3 logged days (MIN_DAYS_FOR_PROGRESS on the server).
//   - CHARTS lists the five charts (title, color, scale); Chart.tsx draws each one.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the page header (photo and message) and the
//   chart styling. Separate charts per category and the tips are new.
// =============================================================================

import { useState } from 'react';
import { Link } from 'wouter';
import { Activity, ArrowLeftRight, ArrowRight, ChevronDown } from 'lucide-react';
import { Character, CharacterNote } from '@/components/Character';
import { Empty } from '@/components/Empty';
import { Heading } from '@/components/Heading';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import { LoadError, Loading } from '@/components/Status';
import { useApi } from '@/hooks/use-api';
import { getProgress } from '@/lib/api/progress';
import { CATEGORY_CHARACTER } from '@/lib/characters';
import { fromISODate } from '@/lib/dates';
import type { CategoryKey } from '@/lib/types';
import { Chart } from './Chart';

const CARD_ORDER: CategoryKey[] = ['sleep', 'stress', 'exercise', 'food', 'screen'];

// One chart per category: its title, what one bar means, how to word its average,
// a fixed scale where there is one, and a color.
const CHARTS: {
  key: CategoryKey;
  title: string;
  perDay: string;
  average: (score: number) => string;
  max?: number;
  color: string;
  goodNote: string; // shown when no tip applies to this category
}[] = [
  {
    key: 'sleep',
    title: 'Sleep',
    perDay: 'Hours slept each night',
    average: (s) => `${s} hrs a night`,
    color: '#80a080',
    goodNote: 'You’re getting steady rest. A regular bedtime helps keep it that way.',
  },
  {
    key: 'stress',
    title: 'Stress',
    perDay: 'Your 1–5 rating each day (lower is calmer)',
    average: (s) => `${s} of 5`,
    max: 5,
    color: '#dc957b',
    goodNote: 'Your stress has stayed manageable. Keep making room for breaks.',
  },
  {
    key: 'exercise',
    title: 'Movement',
    perDay: 'Minutes of activity each day',
    average: (s) => `${s} min a week`,
    color: '#d2a957',
    goodNote: 'Nice movement lately. Short walks between classes all add up.',
  },
  {
    key: 'food',
    title: 'Food',
    perDay: 'Daily food score out of 3',
    average: (s) => `${s} of 3`,
    max: 3,
    color: '#8b9d68',
    goodNote: 'Your plate has been nicely balanced. Keep up the good choices.',
  },
  {
    key: 'screen',
    title: 'Screen time',
    perDay: 'Hours on screens each day',
    average: (s) => `${s} hrs a day`,
    color: '#7d9aa0',
    goodNote: 'Your screen time looks reasonable. Little breaks still help your eyes.',
  },
];

export function ProgressPage() {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [openTip, setOpenTip] = useState<string | null>(null);
  // [period] makes useApi load again whenever the 7/30-day toggle changes.
  const { data, error, loading, reload } = useApi(() => getProgress(period), [period]);

  const toggle = (
    <div className="segmented" role="group" aria-label="Time period">
      {([7, 30] as const).map((days) => (
        <button
          key={days}
          type="button"
          className={`segment ${period === days ? 'selected' : ''}`}
          aria-pressed={period === days}
          onClick={() => setPeriod(days)}
          data-testid={`button-period-${days}`}
        >
          Last {days} days
        </button>
      ))}
    </div>
  );

  // Pick what to show: loading, an error, "log more days", or the charts and tips.
  let body;
  if (loading && !data) body = <Loading />;
  else if (error || !data) body = <LoadError message={error} onRetry={reload} />;
  else if (!data.enoughData) {
    body = (
      <Panel>
        <Empty
          title={`Log at least ${data.minDays} days to see your progress`}
          body="Your patterns will grow from your check-ins — no made-up numbers, no pressure to keep a streak."
          icon={Activity}
          action={
            <Link href="/log" className="button primary small" data-testid="link-progress-start">
              Write a check-in <ArrowRight size={14} />
            </Link>
          }
        />
      </Panel>
    );
  } else {
    const { summary } = data;
    const cats = summary.categories;
    // Chart labels: weekday for 7 days; for 30 days, every 5th day of the month to avoid crowding.
    const label = (iso: string, i: number) =>
      period === 7
        ? fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short' })
        : i % 5 === 0
          ? String(fromISODate(iso).getDate())
          : '';
    const labels = summary.days.map(label);

    body = (
      <>
        <div className="insight-grid insight-grid-wide" style={{ marginBottom: 18 }}>
          <div className="insight">
            <span>Days you checked in</span>
            <strong data-testid="value-days-logged">
              {summary.logged_days}
              <small className="insight-unit"> / {period}</small>
            </strong>
            <small>Each day is its own win</small>
          </div>
          {CARD_ORDER.map((key) => (
            <div className="insight" key={key}>
              <span>{cats[key].label}</span>
              <strong data-testid={`value-average-${key}`}>
                {cats[key].score ?? '—'}
                {cats[key].score !== null && <small className="insight-unit"> {cats[key].unit}</small>}
              </strong>
              <small>{cats[key].score === null ? 'No data yet' : 'Across saved days'}</small>
            </div>
          ))}
        </div>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 18 }}
        >
          {CHARTS.map(({ key, title, perDay, average, max, color, goodNote }) => {
            const tip = data.categoryTips?.[key];
            const hasData = cats[key].score !== null;
            return (
              <Panel key={key} className="chart-panel">
                <SectionHeading
                  character={CATEGORY_CHARACTER[key]}
                  title={title}
                  subtitle={
                    <>
                      {perDay}
                      {hasData && ` · average ${average(cats[key].score as number)}`}
                    </>
                  }
                />
                <Chart
                  values={cats[key].series}
                  labels={labels}
                  name={`${title}: ${perDay}`}
                  color={color}
                  max={max}
                />
                {/* The category's character "says" its tip, or a gentle note when no tip applies. */}
                <CharacterNote name={CATEGORY_CHARACTER[key]}>
                  {tip ? (
                    <>
                      <strong>{tip.title}.</strong> {tip.summary}
                    </>
                  ) : hasData ? (
                    goodNote
                  ) : (
                    'Nothing logged here yet. Add it on the Daily log and your pattern will show up.'
                  )}
                </CharacterNote>
              </Panel>
            );
          })}
        </div>
        <Panel style={{ marginTop: 18 }}>
          <div className="panel-heading">
            <div>
              <h2>Routine feedback</h2>
              <div className="subtle" style={{ marginTop: 5 }}>
                Research-based tips matched to your results
              </div>
            </div>
            <Link href="/compare" className="button ghost small" data-testid="link-compare">
              <ArrowLeftRight size={14} /> Compare weeks
            </Link>
          </div>
          {data.recommendations.length ? (
            <div className="tip-list">
              {data.recommendations.map((tip) => (
                <div className="tip" key={tip.id} data-testid={`tip-${tip.id}`}>
                  <button
                    type="button"
                    className="tip-head"
                    aria-expanded={openTip === tip.id}
                    onClick={() => setOpenTip(openTip === tip.id ? null : tip.id)}
                  >
                    <span>
                      <strong>{tip.title}</strong>
                      <span>{tip.summary}</span>
                    </span>
                    <ChevronDown size={16} className={openTip === tip.id ? 'rotated' : ''} />
                  </button>
                  {openTip === tip.id && <p className="tip-details">{tip.details}</p>}
                  <span className="tip-source">Source: {tip.source}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="form-note">Nice work — your results are within the recommended ranges.</p>
          )}
          <p className="subtle" style={{ marginTop: 12 }}>
            These tips are general wellness information, not medical advice.
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <Heading
        eyebrow="Patterns, not performance"
        title="Look at what you’ve noticed."
        subtitle="A gentle view of your recent check-ins. Only days you saved are included."
        action={toggle}
      />
      <div className="page-scene progress-scene">
        <img className="scene-photo" src="/images/photo-progress.webp" alt="" />
        <div className="scene-message">
          <span className="eyebrow">Small things add up</span>
          <p>
            There’s no perfect pattern to find. Log the areas that matter to you, and the more you log, the easier it is to
            spot connections between them.
          </p>
        </div>
        <Character name="progress" className="page-mascot" />
      </div>
      {body}
    </>
  );
}
