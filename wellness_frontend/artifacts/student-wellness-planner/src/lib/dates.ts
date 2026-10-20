// =============================================================================
// Date helpers - Shared
// =============================================================================
// WHAT IT DOES
//   Turn dates into 'YYYY-MM-DD' text and back (in local time), make readable labels
//   like "Saturday, October 17", and calculate sleep hours between two times.
//
// HOW IT CONNECTS
//   - hoursBetween uses the same rule as calculate_total_hours in wellness/sleep.py,
//     so the preview on the Daily log matches what the server saves.
//   - fromISODate uses noon to avoid time-zone edge cases around midnight.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the date formatting approach (toISODate, dateLabel).
// =============================================================================

/** Format a Date as 'YYYY-MM-DD' in local time. */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayISO = () => toISODate(new Date());

/** A 'YYYY-MM-DD' date as a Date at noon (avoids time-zone edge cases). */
export const fromISODate = (date: string) => new Date(`${date}T12:00:00`);

export const dateLabel = (
  date: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' },
) => fromISODate(date).toLocaleDateString(undefined, options);

/** Hours between two 'HH:MM' times; crosses midnight when wake isn't after bed (same rule as sleep.py). */
export function hoursBetween(bedtime: string, wakeTime: string) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}
