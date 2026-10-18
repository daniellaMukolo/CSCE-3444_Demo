# Team 9: who owns which files (for GitHub commits)

Based on the original plan:

| Member | Requirements |
|---|---|
| **Bobby** | Account/Login/Profile (FR-01), Sleep (FR-02), Progress with recommendations (FR-03) |
| **Malika** | Schedule (FR-04), Stress (FR-05), Food (FR-06), plus the original UI design |
| **Daniella** | Exercise (FR-07), Screen Time (FR-08), Compare Routines (FR-09) |

Paths:
- **Backend:** under `wellness_planner/`.
- **Front end:** under `wellness_frontend/artifacts/student-wellness-planner/src/` unless shown otherwise.

Every code file starts with a header that covers:
- **WHAT IT DOES**
- **HOW IT CONNECTS**
- **CREDIT**, wherever Malika's original Replit prototype is still in the file.

---

## Bobby: Accounts, Sleep, Progress

**Backend**
- `wellness/auth.py`: account rules (hashing, 8-character minimum, lockout), plus the original login and sign-up pages
- `wellness/api/auth.py`: account API (register, log in, log out, me, profile)
- `wellness/sleep.py`: the sleep-hours rule, plus the original sleep pages
- `wellness/api/sections/sleep.py`: the sleep section of the Daily log
- `wellness/progress.py`: averages (`summarize`) and tip matching
- `wellness/api/progress.py`: the progress API, including each category's tip
- `wellness/data/recommendations.json`: the Recommendation Library (tips and sources)
- `wellness/main.py`: the original dashboard and profile pages
- Original HTML pages:
  - `wellness/templates/auth/*`
  - `wellness/templates/main/*`
  - `wellness/templates/sleep/*`
  - `wellness/templates/progress/*`
- Tests:
  - `tests/test_auth.py`
  - `tests/test_sleep.py`
  - `tests/test_progress.py`

**Front end**
- `components/auth/AuthProvider.tsx`: who is logged in; the 30-minute session end
- `features/auth/AuthPage.tsx`: the login and sign-up screen *(styled with Malika's design)*
- `features/profile/ProfilePage.tsx`
- `features/daily-log/SleepSection.tsx` *(credit: Malika's 1-5 rating buttons)*
- `features/progress/ProgressPage.tsx` *(credit: Malika's page banner and chart styling)*
- `features/progress/Chart.tsx` *(credit: Malika's bar-chart look)*
- `lib/api/auth.ts`
- `lib/api/progress.ts`: `getProgress` (the file is shared with Daniella's `getCompare`)

**Character design**
- `public/images/characters/*.webp`: character images created by Bobby using Codex AI.

## Malika: Schedule, Stress, Food, and the app's design

**Backend**
- `wellness/api/schedule.py`: the weekly schedule API, including overlap warnings
- `wellness/api/sections/stress.py`: the stress check-in and the 3-day support rule
- `wellness/api/sections/food.py`: meals, dishes, scores and water
- `wellness/data/food_catalog.json`: cuisines, dishes, ingredients, food groups and portions

**Front end: her features**
- `features/schedule/SchedulePage.tsx`
- `features/schedule/ClassDialog.tsx`
- `features/schedule/ScheduleRow.tsx`
- `features/schedule/types.ts`
- `features/daily-log/StressSection.tsx`
- `features/daily-log/SupportPanel.tsx`
- `features/daily-log/MealsSection.tsx`
- `features/daily-log/food/FoodPicker.tsx`
- `features/daily-log/food/catalog.ts`
- `features/daily-log/food/FoodImage.tsx`
- `features/daily-log/food/PortionIcon.tsx`
- `lib/api/schedule.ts`

**Front end: her original design (from her Replit prototype)**
- `index.css`: the whole visual design. Later sections were added in her style.
- `components/layout/Shell.tsx`: sidebar, top bar and phone navigation
- `components/Heading.tsx`
- `components/Panel.tsx`
- `components/Empty.tsx`
- `components/Toast.tsx`
- `public/images/photo-*.webp`: page banner photos. The `mascot-*.webp` files are no longer used.

## Daniella: Exercise, Screen Time, Compare Routines

**Backend**
- `wellness/api/sections/exercise.py`
- `wellness/api/sections/screen_time.py`
- `wellness/api/compare.py`

**Front end**
- `features/daily-log/MovementSection.tsx`
- `features/daily-log/ScreenTimeSection.tsx` *(credit: Malika's screen-hours box)*
- `features/compare/ComparePage.tsx`
- `lib/api/progress.ts`: `getCompare` (shared file)

## Shared files: integration (suggested: Bobby commits these as coordinator)

These connect everyone's parts. Several still carry Malika's prototype layout, and their headers say so.

**Backend**
- `wellness/__init__.py`: creates the app
- `wellness/db.py`
- `wellness/schema.sql`: each table is marked with its owner
- `wellness/seed.py`: demo data for every section
- `wellness/api/__init__.py`
- `wellness/api/helpers.py`
- `wellness/api/days.py`: saves the whole day
- `wellness/api/sections/__init__.py`
- `wellness/api/sections/notes.py`: the reflection
- Original pages' shared files:
  - `wellness/templates/base.html`
  - `wellness/templates/_macros.html`
  - `wellness/static/style.css`
- Tests: `tests/conftest.py` and `tests/test_api.py` (each person can add tests for their own section)
- `requirements.txt` and `README.md`

**Front end**
- `App.tsx` *(credit: Malika's page structure)*
- Daily log:
  - `features/daily-log/LogPage.tsx` *(credit: Malika's page layout and wording)*
  - `features/daily-log/types.ts`
  - `features/daily-log/DayPickerPanel.tsx` *(credit: Malika's "Start with the basics" panel)*
  - `features/daily-log/ReflectionSection.tsx` *(credit: Malika)*
  - `features/daily-log/SavedDaysList.tsx` *(credit: Malika)*
  - `features/daily-log/LogItem.tsx` *(credit: Malika)*
- Today page:
  - `features/dashboard/DashboardPage.tsx` *(credit: Malika's Today page layout)*
  - `features/dashboard/Metric.tsx` *(credit: Malika)*
  - `features/dashboard/DayStatusIcon.tsx`
- Shared components:
  - `components/Character.tsx`
  - `components/SectionHeading.tsx`
  - `components/Status.tsx`
  - `components/FieldError.tsx`
  - `pages/not-found.tsx`
- Helpers and data:
  - `hooks/use-api.ts`
  - `lib/api/client.ts`
  - `lib/api/days.ts`
  - `lib/types.ts`: each section's shapes are marked with their owner
  - `lib/characters.ts`
  - `lib/constants.ts` *(credit: Malika's colors)*
  - `lib/dates.ts` *(credit: Malika's date formatting)*
- `wellness_frontend/replit.md`: front-end guide

**Replit hosting (Bobby):** `.replit`, `start.sh`, `REPLIT_SETUP.md`, `make_replit_zip.py`

## Replit template files (no one needs to claim these)

These came with Replit's project setup. Commit them once as setup.

- In `src/`:
  - `main.tsx`
  - `components/error-boundary.tsx`
  - `hooks/use-mobile.tsx`
  - `hooks/use-toast.ts`
  - `lib/utils.ts`
  - `components/ui/*`: the unused UI kit
- In `artifacts/student-wellness-planner/`:
  - `vite.config.ts`: Replit's template, plus the `/api` forwarding to Flask
  - `index.html`
  - `package.json`
  - `tsconfig.json`
- In `wellness_frontend/`:
  - `package.json`
  - the `pnpm-*` files
  - the `tsconfig*` files
  - `artifacts/api-server`
  - `artifacts/mockup-sandbox`
  - `lib/*`
  - `scripts/*`

## Never commit

- `node_modules/`
- `dist/`
- `wellness_planner/instance/`: the local database and secret key
- `__pycache__/`
- `.venv/`
- `wellness_replit/` and `wellness_replit.zip`: these are rebuilt by `make_replit_zip.py`
