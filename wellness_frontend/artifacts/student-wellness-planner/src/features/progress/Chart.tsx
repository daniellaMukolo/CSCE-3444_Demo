// =============================================================================
// Bar chart for one category - Bobby
// =============================================================================
// WHAT IT DOES
//   One bar per day, scaled to `max` (or the largest value shown). Days without a
//   value show a dot instead of a bar. With more than 14 days (the 30-day view) the
//   numbers above the bars are hidden so the chart stays readable.
//
// HOW IT CONNECTS
//   - ProgressPage.tsx renders one per category with that category's daily values.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the bar chart's look (bars, labels, legend styling).
//   Her version drew two series per chart; it now draws one.
// =============================================================================

import { Activity } from 'lucide-react';
import { Empty } from '@/components/Empty';

const format = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export function Chart({
  values,
  labels,
  name,
  color,
  max,
}: {
  values: (number | null)[];
  labels: string[];
  name: string; // used for the screen-reader description, e.g. "Sleep, hours per night"
  color: string;
  max?: number; // fixed top of the scale (5 for stress, 3 for food); otherwise the largest value
}) {
  const logged = values.filter((v): v is number => v !== null);
  if (!logged.length) {
    return (
      <Empty
        title="No days to chart yet"
        body="Once you log this, your own numbers will appear here."
        icon={Activity}
      />
    );
  }
  // The tallest bar's value: a fixed scale (e.g. 5 for stress) or the largest value shown.
  const top = max ?? Math.max(...logged, 1);
  const showValues = values.length <= 14;
  return (
    <div className="chart-wrap" role="img" aria-label={`${name} for each day, ${logged.length} days logged`}>
      <div className={`chart-bars ${showValues ? '' : 'dense'}`}>
        {values.map((value, i) => (
          <div
            className="bar-col"
            key={i}
            title={
              value === null ? `${labels[i] || `Day ${i + 1}`}: not logged` : `${labels[i]}: ${format(value)}`
            }
          >
            {value !== null ? (
              <>
                {showValues && <div className="bar-value">{format(value)}</div>}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    height: '76%',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    className="bar"
                    style={{ height: `${Math.max(4, (value / top) * 100)}%`, background: color }}
                  />
                </div>
              </>
            ) : (
              <div
                style={{
                  height: '76%',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#b1b5a9',
                  fontSize: 12,
                }}
              >
                ·
              </div>
            )}
            <div className="bar-label">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
