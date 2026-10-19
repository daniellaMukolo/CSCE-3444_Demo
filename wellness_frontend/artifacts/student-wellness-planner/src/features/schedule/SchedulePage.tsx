// =============================================================================
// "My week" page (FR-04 / UC-04) - Malika
// =============================================================================
// WHAT IT DOES
//   A card per weekday with that day's classes, work and study time, plus the
//   add/edit pop-up. Warns before saving an item that overlaps another one.
//
// HOW IT CONNECTS
//   - Loads and saves through lib/api/schedule.ts (api/schedule.py on the server).
//   - A 409 "overlap" answer asks the student first, then resends with allowOverlap.
//   - ClassDialog.tsx is the pop-up form; ScheduleRow.tsx is one item in a list.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: this page's layout (day cards, header photo
//   and message) and the add/edit flow. Repeating days and overlap checks are new.
// =============================================================================

import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Character } from '@/components/Character';
import { Heading } from '@/components/Heading';
import { Panel } from '@/components/Panel';
import { LoadError, Loading } from '@/components/Status';
import { useApi } from '@/hooks/use-api';
import { ApiError, errorMessage } from '@/lib/api/client';
import { deleteScheduleItem, listSchedule, saveScheduleItem } from '@/lib/api/schedule';
import { DAY_KEYS, DAY_NAMES } from '@/lib/constants';
import type { ScheduleItem } from '@/lib/types';
import { ClassDialog } from './ClassDialog';
import { ScheduleRow } from './ScheduleRow';
import { emptyItem, type ScheduleDraft } from './types';

export function SchedulePage({ notify }: { notify: (text: string) => void }) {
  const { data, error, loading, reload } = useApi(listSchedule);
  const [editing, setEditing] = useState<ScheduleDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [overlap, setOverlap] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const begin = (draft: ScheduleDraft) => {
    setEditing({ ...draft });
    setErrors({});
    setOverlap([]);
  };
  const close = (draft: ScheduleDraft | null) => {
    setEditing(draft);
    if (!draft) setOverlap([]);
  };

  // Save the item in the dialog. allowOverlap = the student chose "Save anyway" (UC-04 6a).
  async function save(allowOverlap = false) {
    if (!editing) return;
    setBusy(true);
    setErrors({});
    try {
      // Split off the id: a new item has none (POST), an existing one is updated (PUT /<id>).
      const { id, ...fields } = editing;
      await saveScheduleItem({ ...fields, allowOverlap }, id);
      setEditing(null);
      setOverlap([]);
      reload();
      notify(id ? 'Your schedule is updated.' : 'Added to your week.');
    } catch (err) {
      // 409 = overlaps another item: show the names and offer "Save anyway".
      if (err instanceof ApiError && err.status === 409) setOverlap(err.data.conflicts ?? []);
      else if (err instanceof ApiError && err.data.errors) setErrors(err.data.errors);
      else setErrors({ form: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setOverlap([]);
    save(false);
  };

  async function remove(item: ScheduleItem) {
    if (!window.confirm(`Remove ${item.name} from your weekly schedule?`)) return;
    try {
      await deleteScheduleItem(item.id);
      reload();
      notify('Removed from your schedule.');
    } catch (err) {
      notify(errorMessage(err));
    }
  }

  return (
    <>
      <Heading
        eyebrow="The shape of your week"
        title="Your week, in its place."
        subtitle="Add recurring classes, work shifts, and study blocks so your daily plan makes room for them."
        action={
          <button className="button primary" onClick={() => begin(emptyItem)} data-testid="button-add-class">
            <Plus size={16} /> Add to week
          </button>
        }
      />
      <div className="page-scene schedule-scene">
        <img className="scene-photo" src="/images/photo-schedule.webp" alt="" />
        <div className="scene-message">
          <span className="eyebrow">A little structure, lots of room</span>
          <p>Your week is yours to shape. Leave space between the things you need to do.</p>
        </div>
        <Character name="schedule" className="page-mascot" />
      </div>
      {loading && !data ? (
        <Loading />
      ) : error || !data ? (
        <LoadError message={error} onRetry={reload} />
      ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 16 }}
        >
          {DAY_KEYS.map((dayKey, dayIndex) => {
            const dayItems = data.items.filter((item) => item.days.includes(dayKey));
            return (
              <Panel key={dayKey}>
                <div className="panel-heading">
                  <div>
                    <h2>{DAY_NAMES[dayIndex]}</h2>
                    <div className="subtle" style={{ marginTop: 4 }}>
                      {dayItems.length
                        ? `${dayItems.length} item${dayItems.length === 1 ? '' : 's'}`
                        : 'A little breathing room'}
                    </div>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`Add to ${DAY_NAMES[dayIndex]}`}
                    onClick={() => begin({ ...emptyItem, days: [dayKey] })}
                    data-testid={`button-add-class-${dayIndex}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {dayItems.length ? (
                  <div className="schedule-list">
                    {dayItems.map((item) => (
                      <ScheduleRow
                        key={item.id}
                        item={item}
                        onEdit={() => begin(item)}
                        onDelete={() => remove(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="subtle" style={{ padding: '7px 2px 3px' }}>
                    Nothing scheduled — and that’s okay.
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
      {editing && (
        <ClassDialog
          editing={editing}
          setEditing={close}
          errors={errors}
          overlap={overlap}
          busy={busy}
          onSubmit={submit}
          onSaveAnyway={() => save(true)}
        />
      )}
    </>
  );
}
