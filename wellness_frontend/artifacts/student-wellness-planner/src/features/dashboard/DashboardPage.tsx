// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// "Today" page - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   The home page: a greeting, this week's check-ins at a glance, today's schedule,
//   a summary of today's log (one row per section), and a kind nudge.
//
// HOW IT CONNECTS
//   - Loads saved days (lib/api/days.ts), today's day, and the schedule
//     (lib/api/schedule.ts).
//   - Each card uses its section's character (lib/characters.ts).
//   - The week strip uses DayStatusIcon; each summary row is a Metric.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the page layout and wording: the welcome card
//   and greeting, "This week, at a glance", "Today, in a nutshell", the classes
//   card and "A kind little nudge". Data now comes from the server.
// =============================================================================

import { Link } from 'wouter';
import { ArrowRight, BookOpen, ChevronRight, Heart, Plus } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Character } from '@/components/Character';
import { Empty } from '@/components/Empty';
import { Heading } from '@/components/Heading';
import { Panel } from '@/components/Panel';
import { SectionHeading } from '@/components/SectionHeading';
import { LoadError, Loading } from '@/components/Status';
import { useApi } from '@/hooks/use-api';
import { getDay, listDays } from '@/lib/api/days';
import { listSchedule } from '@/lib/api/schedule';
import { DAY_KEYS, TRACKED_SECTIONS } from '@/lib/constants';
import { dateLabel, toISODate, todayISO } from '@/lib/dates';
import { ScheduleRow } from '@/features/schedule/ScheduleRow';
import { DayStatusIcon } from './DayStatusIcon';
import { Metric, stressLabel } from './Metric';

export function DashboardPage() {
  const { user } = useAuth();
  const today = todayISO();
  // Three requests at once; Promise.all waits for all of them and gives [day, days, schedule].
  const { data, error, loading, reload } = useApi(
    () => Promise.all([getDay(today), listDays(14), listSchedule()]),
    [today],
  );

  const hour = new Date().getHours();
  const heading = (
    <Heading
      eyebrow="A pause in your day"
      title={`Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, ${user?.name.split(' ')[0]}.`}
      subtitle="A little check-in can make a busy week feel more yours."
      action={
        <Link href="/log" className="button primary" data-testid="button-dashboard-log">
          {data?.[0].saved ? 'Edit today’s check-in' : 'Check in for today'} <ArrowRight size={16} />
        </Link>
      }
    />
  );
  if (loading && !data)
    return (
      <>
        {heading}
        <Loading />
      </>
    );
  if (error || !data)
    return (
      <>
        {heading}
        <LoadError message={error} onRetry={reload} />
      </>
    );

  const [log, days, schedule] = data;
  const items = schedule.items;
  // getDay() is 0 for Sunday, so DAY_KEYS[getDay()] is today's key, e.g. 'Sat'.
  const todayItems = items.filter((item) => item.days.includes(DAY_KEYS[new Date().getDay()]));
  // The last 7 days, oldest first, with how many tracked sections each has.
  const total = TRACKED_SECTIONS.length;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = toISODate(d);
    const done = days.find((day) => day.date === key)?.sections?.length ?? 0;
    return { key, d, done };
  });
  // reduce() adds up the minutes of every activity logged today.
  const exerciseMinutes = log.exercise.reduce((sum, a) => sum + a.minutes, 0);
  const meals = log.food?.meals ?? [];

  return (
    <>
      {heading}
      <div className="grid dashboard-grid">
        <div className="grid">
          <section className="welcome-panel">
            <img className="welcome-photo" src="/images/photo-dashboard.webp" alt="" />
            <div className="welcome-copy">
              <div className="welcome-kicker">{dateLabel(today)}</div>
              <h2 className="welcome-title">
                {log.saved ? 'You showed up for yourself.' : 'Make room for you, too.'}
              </h2>
              <p>
                {log.saved
                  ? 'Your check-in is here whenever you need a gentle reminder of how the day felt.'
                  : 'No perfect routine required. Notice what you need, and take the next small step.'}
              </p>
              <Link href="/progress" className="button primary" data-testid="link-dashboard-progress">
                See your patterns <ChevronRight size={15} />
              </Link>
            </div>
            <Character name="today" className="welcome-mascot" />
          </section>

          <Panel>
            <SectionHeading
              character="progress"
              title="This week, at a glance"
              subtitle="Your saved check-ins, one day at a time"
              action={
                <Link href="/progress" className="button ghost small" data-testid="link-week-progress">
                  View progress <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="week-strip">
              {week.map(({ key, d, done }) => (
                <div className="day-cell" key={key} data-testid={`week-day-${key}`}>
                  <span>{DAY_KEYS[d.getDay()]}</span>
                  <strong>{d.getDate()}</strong>
                  <DayStatusIcon done={done} total={total} />
                </div>
              ))}
            </div>
            <div className="status-legend" aria-hidden="true">
              <span>
                <DayStatusIcon done={total} total={total} /> All {total} sections
              </span>
              <span>
                <DayStatusIcon done={2} total={total} /> Some sections
              </span>
              <span>
                <DayStatusIcon done={0} total={total} /> Not logged
              </span>
            </div>
          </Panel>

          <Panel>
            <SectionHeading
              character="schedule"
              title="Today’s schedule"
              action={
                <Link href="/schedule" className="button outline small" data-testid="link-edit-schedule">
                  Edit week <ArrowRight size={14} />
                </Link>
              }
            />
            {todayItems.length ? (
              <div className="schedule-list">
                {todayItems.map((item) => (
                  <ScheduleRow item={item} key={item.id} />
                ))}
              </div>
            ) : (
              <Empty
                title="A little open space"
                body={
                  items.length
                    ? 'Nothing on your schedule today.'
                    : 'Add your classes, work, and study blocks and your day will take shape here.'
                }
                icon={BookOpen}
                action={
                  <Link href="/schedule" className="button outline small" data-testid="link-add-classes">
                    {items.length ? 'See your week' : 'Add to your week'} <Plus size={14} />
                  </Link>
                }
              />
            )}
          </Panel>
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Panel>
            <div className="panel-heading">
              <h2>Today, in a nutshell</h2>
              <span className="subtle">A check-in, not a score</span>
            </div>
            {log.saved ? (
              <div className="today-list">
                <Metric
                  character="sleep"
                  label="Sleep"
                  value={log.sleep ? `${log.sleep.totalHours} hrs` : 'Not logged'}
                  meta={log.sleep?.quality ? `${log.sleep.quality}/5 quality` : ''}
                />
                <Metric
                  character="stress"
                  label="Stress"
                  value={log.stress ? stressLabel(log.stress.level) : 'Not logged'}
                  meta={log.stress ? `${log.stress.level} of 5` : ''}
                />
                <Metric
                  character="movement"
                  label="Movement"
                  value={`${exerciseMinutes} min`}
                  meta={
                    log.exercise.length
                      ? `${log.exercise.length} activit${log.exercise.length === 1 ? 'y' : 'ies'}`
                      : 'none yet'
                  }
                />
                <Metric
                  character="screen"
                  label="Screen time"
                  value={log.screenTime ? `${log.screenTime.hours} hrs` : 'Not logged'}
                  meta=""
                />
                <Metric
                  character="food"
                  label="Food"
                  value={meals.length ? `${meals.length} meal${meals.length === 1 ? '' : 's'}` : 'Not logged'}
                  meta={
                    meals.length
                      ? `score ${log.food?.dailyScore ?? '–'} / 3 · ${log.food?.water ?? 0} cups water`
                      : ''
                  }
                />
              </div>
            ) : (
              <Empty
                title="Your day is still unwritten"
                body="Start a private check-in for sleep, stress, movement, meals, and whatever else is on your mind."
                icon={Heart}
                action={
                  <Link href="/log" className="button primary small" data-testid="link-empty-checkin">
                    Start today’s log <ArrowRight size={14} />
                  </Link>
                }
              />
            )}
          </Panel>

          <Panel className="nudge-panel">
            <div className="panel-heading">
              <h2>A kind little nudge</h2>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#68796b', margin: '0 0 5px' }}>
              {log.note ? `“${log.note}”` : 'You can adjust the plan. Rest is part of the plan.'}
            </p>
            {log.note && (
              <div className="subtle" style={{ marginTop: 10 }}>
                From your reflection today
              </div>
            )}
            <Character name="today" className="nudge-character" />
          </Panel>
        </div>
      </div>
    </>
  );
}
