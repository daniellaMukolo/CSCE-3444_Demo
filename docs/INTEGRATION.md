# Integration guide: how each part plugs into the others

This is the contract between everyone's code. Follow these rules and your feature will work
with the rest of the app without anyone else changing their files.

The working code already follows every rule here. When in doubt, copy the pattern from the file
named in each section. Every file's header explains what it does and how it connects.

**Contents**
1. [The big picture](#1-the-big-picture)
2. [Rules every backend file follows](#2-rules-every-backend-file-follows)
3. [The JSON format between front end and backend](#3-the-json-format-between-front-end-and-backend)
4. [Adding a Daily log section (the section contract)](#4-adding-a-daily-log-section-the-section-contract)
5. [Adding a whole page or feature](#5-adding-a-whole-page-or-feature)
6. [Adding a category to My Progress and Compare](#6-adding-a-category-to-my-progress-and-compare)
7. [The database](#7-the-database)
8. [Front-end conventions](#8-front-end-conventions)
9. [Shared files: tell the team before changing](#9-shared-files-tell-the-team-before-changing)
10. [Testing your part](#10-testing-your-part)

---

## 1. The big picture

```
React page (features/...)  ->  lib/api/*.ts  ->  /api/... (Flask blueprint in wellness/api/)  ->  SQLite
        ^                                                     |
        +---------------------- JSON answer -----------------+
```

- **The backend is the single source of truth.** It checks every input and calculates every
  score. The front end may show a preview (sleep hours, food scores), but the server's answer is
  what gets saved.
- **The front end never touches the database.** It only calls `/api/...` addresses through the
  small functions in `src/lib/api/`.
- **Each feature owns its own module on both sides,** and the shared files connect them.

| Layer | Daily log sections | Standalone features |
|---|---|---|
| Backend logic | `wellness/api/sections/<name>.py` | `wellness/api/<name>.py` (a Flask blueprint) |
| Registered in | `SECTIONS` in `wellness/api/days.py` | the tuple in `wellness/api/__init__.py` |
| Front-end requests | `src/lib/api/days.ts` (shared) | `src/lib/api/<name>.ts` |
| Front-end UI | `src/features/daily-log/<Name>Section.tsx` | `src/features/<name>/` |
| Shown by | `LogPage.tsx` | a `<Route>` in `App.tsx` and an entry in `navItems` in `Shell.tsx` |

## 2. Rules every backend file follows

1. **Require a login.** Put `@api_login_required` (from `api/helpers.py`) under the route line.
   Without a login the request gets a 401, and the front end shows the login page.
2. **Only ever touch the logged-in student's rows.** Every query includes
   `WHERE user_id = ?` with `g.user["id"]` (NFR 6.2). For one item by id, load it with both the id
   and the user id, and answer 404 if it isn't theirs (see `get_own_item` in `api/schedule.py`).
3. **Use `?` placeholders in SQL, never string formatting.** This prevents SQL injection.
   ```python
   db.execute("SELECT * FROM stress_checkins WHERE user_id = ? AND entry_date = ?", (user_id, day))
   ```
4. **Changes arrive as JSON.** `api/__init__.py` rejects POST, PUT and DELETE requests that aren't
   JSON (status 415). This protects against cross-site request forgery. Read the body with
   `request.get_json(silent=True) or {}`.
5. **Get the database with `get_db()`** (from `wellness/db.py`), and call `db.commit()` once at the
   end of a successful change. Section modules don't commit: `days.py` commits for the whole day.
6. **Never send the password hash.** Use `user_json()` from `api/helpers.py` for user data.

## 3. The JSON format between front end and backend

**Names:**
- JSON uses camelCase (`wakeTime`, `activityType`).
- The database uses snake_case (`wake_time`, `activity_type`).
- Convert between them in your module's `load` and `save` functions (or `item_json`).

**Values:**
- **Dates** are text like `"2026-10-17"`. Parse them with `parse_day()` from `api/helpers.py`, which also rejects future dates.
- **Times** are 24-hour text like `"23:30"`. Check them with `TIME_PATTERN` from `api/helpers.py`.
- **"Not logged"** is `null` (or `[]` for lists). An empty section is allowed and is never an error.

**Answers:**

| Status | Body | When | What the front end does |
|---|---|---|---|
| 200 / 201 | the saved data | success | shows it, then shows a "saved" message |
| 400 | `{"errors": {"field": "message"}}` | something the student typed is wrong | shows each message under its field |
| 401 | `{"error": "..."}` | not logged in, or the session ended | shows the login page |
| 404 | `{"error": "..."}` | that item doesn't exist or isn't theirs | shows the message |
| 409 | `{"confirm": ...}` or `{"warning": ...}` | needs a "are you sure?" first | asks, then resends with a flag such as `confirmLongSleep` or `allowOverlap` |

**Error messages (NFR 6.3)** say what is wrong and how to fix it, in plain words. For example:
"Enter whole minutes from 1 to 600." The server writes every message; the front end only
displays them. That way the wording lives in one place.

**Error keys** point at the exact field:
- A list item's position goes in the key: `"minutes.1"` is the minutes box in the second row.
- For Daily log sections, `days.py` adds the section's name in front: `"exercise.minutes.1"`.

## 4. Adding a Daily log section (the section contract)

The Daily log saves the whole day in one request (`PUT /api/days/<date>`). `days.py` runs every
section's `validate` first, and only saves if **all** of them pass. So the day is saved
completely or not at all.

**Backend:** create `wellness/api/sections/<name>.py` with exactly these four functions.
`exercise.py` is the most fully explained example.

```python
def load(db, user_id, day):
    """Return that day's data in the JSON shape, or None ([] for lists) if nothing is saved."""

def validate(data):
    """Check what the browser sent. Return (clean, errors):
       - (None, {})          the section was left empty (allowed)
       - (None, {...})       errors, e.g. {"minutes.0": "Enter whole minutes from 1 to 600."}
       - (clean_value, {})   valid, ready for save()"""

def save(db, user_id, day, clean):
    """Replace that day's data: delete(...) first, then INSERT. Do NOT commit."""

def delete(db, user_id, day):
    """Remove that day's data."""
```

Then register it, and add its table:
1. Add it to `SECTIONS` in `wellness/api/days.py` with its JSON key, e.g. `"mood": mood`.
2. If it should count toward a "complete" day on the Today page:
   - add the key to `TRACKED_SECTIONS` in `days.py` **and** in `src/lib/constants.ts`;
   - add a query for it to `list_days()` in `days.py`.
3. If the form needs a choice list (like the activity types), add it to `options()` in `days.py`,
   so the list is written only on the server.
4. Add its table to `schema.sql` (see [section 7](#7-the-database)).

**Front end:**
1. **`src/lib/types.ts`:** add the section's JSON shape and its field on the `Day` interface.
2. **`src/features/daily-log/types.ts`:**
   - add the section's slice to `DayForm` (keep numbers as text while typing);
   - add a blank value in `emptyForm`;
   - copy the saved value in `toForm`;
   - send it in `toPayload`.
3. **`src/features/daily-log/<Name>Section.tsx`:** every section receives the same props:
   ```tsx
   export function MoodSection({ value, onChange, errors }: SectionProps<DayForm['mood']>) {
     return (
       <Panel>
         <SectionHeading character="today" title="Mood" />
         {/* inputs call onChange({ ...value, field: newValue }) */}
         <FieldError id="mood-level-error" message={errors['mood.level']} />
       </Panel>
     );
   }
   ```
   - `value` is only this section's slice of the form.
   - `onChange` replaces that slice.
   - `errors` holds every field error, keyed `"<section>.<field>"`.
4. **`LogPage.tsx`:** render it, e.g.
   `<MoodSection value={form.mood} onChange={setSection('mood')} errors={errors} />`.

## 5. Adding a whole page or feature

Examples: My week (`api/schedule.py`) and Compare Routines (`api/compare.py`).

**Backend:**
1. Create `wellness/api/<name>.py` with a blueprint:
   ```python
   bp = Blueprint("api_<name>", __name__, url_prefix="/<name>")

   @bp.get("")
   @api_login_required
   def list_things(): ...
   ```
2. Add the module to the `from . import ...` line and to the tuple in `wellness/api/__init__.py`.
   Its routes then live under `/api/<name>`.

**Front end:**
1. Create `src/lib/api/<name>.ts` with one small function per address, using `api()` from
   `client.ts`:
   ```ts
   export const listThings = () => api<{ items: Thing[] }>('/things');
   export const saveThing = (input: ThingInput, id?: number) =>
     api<{ item: Thing }>(id ? `/things/${id}` : '/things', { method: id ? 'PUT' : 'POST', body: input });
   ```
2. Add the JSON shapes to `src/lib/types.ts`.
3. Create `src/features/<name>/<Name>Page.tsx`:
   - Load data with `useApi(listThings)` from `hooks/use-api.ts`, which gives `data`, `error`, `loading` and `reload`.
   - Show `<Loading />` and `<LoadError />` from `components/Status.tsx` while waiting or after a failure.
4. Add a `<Route path="/<name>">` in `App.tsx` and an entry in `navItems` in
   `components/layout/Shell.tsx`.

## 6. Adding a category to My Progress and Compare

My Progress and Compare Routines read the section tables directly, so a new tracked area appears
there only after a few small additions:

| File | Add |
|---|---|
| `wellness/progress.py` | a query in `CATEGORY_QUERIES` (one value per day) and a label in `CATEGORY_LABELS` |
| `wellness/api/compare.py` | whether higher is better, in `HIGHER_IS_BETTER` |
| `wellness/data/recommendations.json` | tips for it (category, score range, priority, source) |
| `src/lib/types.ts` | its key in `CategoryKey` |
| `src/lib/characters.ts` | its character in `CATEGORY_CHARACTER` |
| `src/features/progress/ProgressPage.tsx` | an entry in `CHARTS` (title, color, scale) |

## 7. The database

- **All tables are in `wellness/schema.sql`,** each marked with its owner.
- **Every entry has `user_id` and `entry_date`.** Use `ON DELETE CASCADE` on `user_id` so that
  deleting an account removes its data.
- **Change `schema.sql` only after the team agrees,** because it affects everyone. Then
  everyone runs:
  ```bash
  flask --app wellness init-db
  ```
  ```bash
  flask --app wellness seed-demo
  ```
  `init-db` deletes local data.
- **If you add a table,** add sample rows for it in `wellness/seed.py`, so the demo account shows
  your feature.
- **Never commit the database file** (`wellness_planner/instance/`).

## 8. Front-end conventions

- **Characters:** every section uses its own character, everywhere (`src/lib/characters.ts`).
  Put a section's heading on with `<SectionHeading character="..." title="..." />`.
- **Look and feel:** reuse the existing classes in `src/index.css`, for example `panel`,
  `button primary`, `segmented`/`segment`, `field`, `field-grid` and `form-alert`. If a new style
  is needed, add it at the bottom of `index.css` under a comment naming your feature.
- **Showing errors:** use `<FieldError id="..." message={errors['...']} />` under the field, and give
  the input `className={error ? 'has-error' : undefined}`.
- **Messages after saving:** pages receive `notify(text)` from `App.tsx`.
- **Accessibility:** every input has a `<label htmlFor>`. Button groups use `role="group"` and
  `aria-pressed`. Purely decorative images use `alt=""`.
- **Test ids:** add `data-testid="..."` to buttons and inputs, e.g. `button-save-log`.

## 9. Shared files: tell the team before changing

These files connect everyone's work. Small additions for your feature are expected (sections 4
to 6 list them). Mention them in your pull request, and don't rewrite other people's parts.

- **Backend:**
  - `wellness/schema.sql`
  - `wellness/api/days.py`
  - `wellness/api/__init__.py`
  - `wellness/seed.py`
  - `wellness/progress.py`
- **Front end** (all in `src/`):
  - `lib/types.ts`
  - `lib/constants.ts`
  - `lib/characters.ts`
  - `features/daily-log/types.ts`
  - `features/daily-log/LogPage.tsx`
  - `App.tsx`
  - `components/layout/Shell.tsx`
  - `index.css`

## 10. Testing your part

- **Backend tests** use pytest. `tests/conftest.py` gives each test a fresh, empty database
  (the `client` fixture). `tests/test_api.py` shows how to sign up through the API and then call
  your routes. Add tests for your section that check:
  - a valid save works;
  - each kind of bad input returns 400 with the right error key;
  - another student can't see or change your data.
- **Front-end check:** run the type check. It catches typos in field names and props.
- **By hand:** run both servers and use your feature as a student would, including leaving it
  empty and entering wrong values.

The commands are in the top-level [README](../README.md#checks-before-you-push).
