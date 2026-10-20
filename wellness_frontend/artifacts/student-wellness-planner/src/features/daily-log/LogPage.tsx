// =============================================================================
// Daily log page - Shared (integration: Bobby; each section is its owner's)
// =============================================================================
// WHAT IT DOES
//   The check-in form for one day, built from one section component per tracked
//   area, plus the list of saved days. The whole day is saved together
//   (PUT /api/days/<date>); the server checks every section and returns field errors.
//
// HOW IT CONNECTS
//   - Each section (SleepSection, StressSection, MealsSection, MovementSection,
//     ScreenTimeSection, ReflectionSection) gets only its own slice of the form (value),
//     a function to change it (onChange), and the errors.
//   - types.ts converts between the form and the API's JSON (toForm / toPayload).
//   - A 409 answer means very long sleep: the page asks "Are those times right?" and
//     resends with confirmLongSleep (UC-02 5a).
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the page layout (form on the left, saved days
//   on the right), its headings and wording, and "A note on being human".
// =============================================================================

import { useEffect, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Heading } from '@/components/Heading';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import { LoadError, Loading } from '@/components/Status';
import { useApi } from '@/hooks/use-api';
import { ApiError, errorMessage } from '@/lib/api/client';
import { deleteDay, getDay, getDayOptions, listDays, saveDay } from '@/lib/api/days';
import { dateLabel, todayISO } from '@/lib/dates';
import { DayPickerPanel } from './DayPickerPanel';
import { MealsSection } from './MealsSection';
import { MovementSection } from './MovementSection';
import { ReflectionSection } from './ReflectionSection';
import { SavedDaysList } from './SavedDaysList';
import { ScreenTimeSection } from './ScreenTimeSection';
import { SleepSection } from './SleepSection';
import { StressSection } from './StressSection';
import { SupportPanel } from './SupportPanel';
import { emptyForm, toForm, toPayload, type DayForm, type Errors } from './types';

export function LogPage({ notify }: { notify: (text: string) => void }) {
  // The form's choice lists (activities, meal types, food catalog, stress questions) and
  // the saved-days list both come from the server when the page opens.
  const options = useApi(getDayOptions);
  const savedDays = useApi(() => listDays(30));
  const questionCount = options.data?.stressQuestions.length ?? 5;

  // useState keeps a value between redraws; calling the setter redraws the page.
  const [selected, setSelected] = useState(todayISO()); // the day being edited, 'YYYY-MM-DD'
  const [form, setForm] = useState<DayForm>(() => emptyForm(5));
  const [isSaved, setIsSaved] = useState(false);
  const [support, setSupport] = useState(false);
  const [loadingDay, setLoadingDay] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [longSleep, setLongSleep] = useState<number | null>(null); // hours awaiting "are those times right?"
  const [busy, setBusy] = useState(false);

  // Load the selected day whenever the date changes.
  // useEffect runs after drawing, and again whenever a value in its [list] changes.
  useEffect(() => {
    let active = true; // set to false if the date changes before the answer arrives
    setLoadingDay(true);
    setErrors({});
    setFormError('');
    setLongSleep(null);
    getDay(selected)
      .then((day) => {
        if (!active) return;
        setForm(toForm(day, questionCount));
        setIsSaved(day.saved);
        setSupport(day.supportMessage);
      })
      .catch((err) => active && setFormError(errorMessage(err)))
      .finally(() => active && setLoadingDay(false));
    return () => {
      active = false;
    };
  }, [selected, questionCount]);

  // Update one section of the form (each section component calls this with its new value).
  // setSection('sleep') returns a function that replaces only form.sleep; `...prev` copies the rest.
  const setSection =
    <K extends keyof DayForm>(key: K) =>
    (value: DayForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  async function save(confirmLongSleep = false) {
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      const day = await saveDay(selected, { ...toPayload(form), confirmLongSleep });
      setForm(toForm(day, questionCount));
      setIsSaved(true);
      setSupport(day.supportMessage);
      setLongSleep(null);
      savedDays.reload();
      notify('Your check-in is saved.');
    } catch (err) {
      // 409 = "are those sleep times right?" (UC-02 5a); 400 = field errors to show.
      if (err instanceof ApiError && err.status === 409) setLongSleep(err.data.totalHours);
      else if (err instanceof ApiError && err.data.errors) {
        // Pull out the general and date messages; everything else belongs next to a field.
        const { form: general, date, ...fieldErrors } = err.data.errors;
        setErrors(fieldErrors);
        setFormError(general || date || 'Please fix the highlighted fields.');
      } else setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser's own page reload; we send JSON instead
    save(false);
  };

  async function remove(date: string) {
    if (!window.confirm(`Delete your check-in for ${dateLabel(date)}? This cannot be undone.`)) return;
    try {
      await deleteDay(date);
      savedDays.reload();
      if (date === selected) {
        setForm(emptyForm(questionCount));
        setIsSaved(false);
        setSupport(false);
      }
      notify('Check-in deleted.');
    } catch (err) {
      setFormError(errorMessage(err));
    }
  }

  const heading = (
    <Heading
      eyebrow="Your daily check-in"
      title="How’s today feeling?"
      subtitle="A private place to notice the little things. Fill in whatever feels useful and skip the rest."
    />
  );
  if (options.loading && !options.data)
    return (
      <>
        {heading}
        <Loading />
      </>
    );
  if (options.error || !options.data)
    return (
      <>
        {heading}
        <LoadError message={options.error} onRetry={options.reload} />
      </>
    );
  const opts = options.data;

  return (
    <>
      {heading}
      <div className="form-layout">
        <form className="form-stack" onSubmit={submit} noValidate>
          <DayPickerPanel
            selected={selected}
            onSelect={setSelected}
            status={
              loadingDay
                ? 'Loading…'
                : isSaved
                  ? 'Saved — edit anything below.'
                  : 'Nothing saved for this day yet.'
            }
          />

          {support && <SupportPanel />}

          <SleepSection value={form.sleep} onChange={setSection('sleep')} errors={errors} />
          {longSleep !== null && (
            <div className="form-alert warning" role="alert" data-testid="status-long-sleep">
              <span>That’s {longSleep} hours of sleep. Are those times right?</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="button primary small"
                  onClick={() => save(true)}
                  disabled={busy}
                  data-testid="button-confirm-long-sleep"
                >
                  Yes, save it
                </button>
                <button type="button" className="button ghost small" onClick={() => setLongSleep(null)}>
                  Change times
                </button>
              </span>
            </div>
          )}
          <StressSection
            value={form.stress}
            onChange={setSection('stress')}
            errors={errors}
            questions={opts.stressQuestions}
          />
          {/* Order follows the SRS: sleep (FR-02), stress (FR-05), food (FR-06), movement (FR-07), screen time (FR-08). */}
          <MealsSection
            value={form.food}
            onChange={setSection('food')}
            errors={errors}
            catalog={opts.foodCatalog}
            mealTypes={opts.mealTypes}
          />
          <MovementSection
            value={form.exercise}
            onChange={setSection('exercise')}
            errors={errors}
            activityTypes={opts.activityTypes}
          />
          <ScreenTimeSection value={form.screenTime} onChange={setSection('screenTime')} errors={errors} />
          <ReflectionSection value={form.note} onChange={setSection('note')} errors={errors} />

          {formError && (
            <div className="form-alert" role="alert" data-testid="status-log-error">
              {formError}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="submit"
              className="button primary"
              disabled={busy || loadingDay}
              data-testid="button-save-log"
            >
              <Check size={16} />
              {busy ? 'Saving…' : isSaved ? 'Save changes' : 'Save check-in'}
            </button>
          </div>
        </form>
        <aside className="grid" style={{ alignContent: 'start' }}>
          {/* Every section is optional; this note says so, and why logging more still helps. */}
          <Panel>
            <SectionHeading character="progress" title="Log what helps you" />
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#718071', margin: 0 }} data-testid="text-log-what-helps">
              Every section is optional. Log only the parts you want help with, and skip the rest. The more areas you
              log, though, the more Your patterns can show side by side. You might notice that short-sleep nights line
              up with your most stressful days, or that workout days feel calmer.
            </p>
          </Panel>
          {savedDays.error ? (
            <LoadError message={savedDays.error} onRetry={savedDays.reload} />
          ) : (
            <SavedDaysList
              days={savedDays.data ?? []}
              selected={selected}
              onSelect={setSelected}
              onDelete={remove}
            />
          )}
          <Panel>
            <h2>A note on being human</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: '#718071', margin: '12px 0 0' }}>
              This isn’t a grade or a streak. Skip a day, change your mind, and come back when you’re ready.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
