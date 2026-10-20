# Student Wellness Planner — front end

A private wellness planner for college students to track daily habits, organize their week, and notice progress over time.
This React app is the interface; the data, accounts and security live in the Flask backend in `../wellness_planner`.

**Credits:** the visual design and first prototype are by Malika Ray, built in Replit. Character images created by Bobby using Codex AI. Files that still contain her work say so in their header's CREDIT section. File owners are listed in `../TEAM_FILE_OWNERSHIP.md`.

## Run & Operate

1. Start the backend first (see `../wellness_planner/README.md`); it serves the API on port 5000.
2. Install packages once, from this folder: `npx pnpm@10.18.3 install`
3. Start the front end from `artifacts/student-wellness-planner`:
   - PowerShell: `$env:PORT = "5173"; $env:BASE_PATH = "/"; npx pnpm@10.18.3 run dev`
   - macOS/Linux/Git Bash: `MSYS_NO_PATHCONV=1 PORT=5173 BASE_PATH=/ npx pnpm@10.18.3 run dev`
4. Open http://localhost:5173. Vite forwards every `/api` request to Flask (`API_URL` overrides the address).

- `npx pnpm@10.18.3 run typecheck` (in `artifacts/student-wellness-planner`) — TypeScript check
- `npx pnpm@10.18.3 run build` — production build into `dist/public`
- Do not deploy until the team agrees the app is complete.

## Stack

- React 19 + TypeScript + Vite, wouter (routing), lucide-react (icons), Tailwind base + the custom CSS in `index.css`
- Backend: Flask + SQLite (`../wellness_planner`), JSON API under `/api`, login with a session cookie
- `artifacts/api-server`, `lib/*` and `artifacts/mockup-sandbox` are unused Replit scaffolding

## Where things live

All paths below are under `artifacts/student-wellness-planner/src/`.

- `App.tsx` — shows the login screen until someone logs in, then the page routes.
- `components/auth/AuthProvider.tsx` — who is logged in; handles logout and the 30-minute session end.
- `components/layout/Shell.tsx` — sidebar, top bar, phone navigation (`navItems`).
- `components/` — shared pieces: `Heading`, `Panel`, `Empty`, `Toast`, `FieldError`, `Status` (loading/error). (`components/ui/` is the unused stock UI kit.)
- `features/auth/` — login and sign-up screen (FR-01).
- `features/dashboard/` — Today page (`DashboardPage`, `Metric`).
- `features/daily-log/` — Daily log page (`LogPage`), one file per tracked area: `SleepSection` (FR-02), `StressSection` (FR-05), `MovementSection` (FR-07), `ScreenTimeSection` (FR-08), `MealsSection` (FR-06), `ReflectionSection`; plus `SupportPanel`, `SavedDaysList`, `LogItem`, and `types.ts` (form state and conversion to/from the API).
- `features/daily-log/food/` — the picture-based food picker (`FoodPicker`: food type → dishes → ingredients → portion), `PortionIcon`, `FoodImage` (image file or emoji), and `catalog.ts` (scoring helpers). The foods themselves live in the backend's `data/food_catalog.json`; give any entry an `"image"` path to replace its emoji with a picture.
- `features/schedule/` — My week page (`SchedulePage`, `ClassDialog`, `ScheduleRow`) (FR-04).
- `features/progress/` — Your patterns page (`ProgressPage`, `Chart`) (FR-03).
- `features/compare/` — Compare Routines (`ComparePage`) (FR-09).
- `features/profile/` — Profile page (FR-01 part C).
- `lib/api/` — one file per backend module: `client.ts` (shared fetch and errors), `auth.ts`, `days.ts`, `schedule.ts`, `progress.ts`.
- `lib/characters.ts` + `components/Character.tsx` — the character rule: one character per section on every page (sleep = pillow, stress = tea, movement = dumbbell, food = bowl, screen time = phone, schedule = calendar, progress = bars, Today/reflection = student). `components/SectionHeading.tsx` puts a section's character beside its title. Images are in `public/images/characters/` (trimmed, transparent WebP copies of the team's originals).
- `lib/types.ts` — the shapes of the API's JSON. `lib/dates.ts`, `lib/constants.ts` — helpers.
- `hooks/use-api.ts` — loads data when a page opens; `reload()` refreshes it.
- `index.css` — theme and responsive styling (new styles are at the bottom, marked "Added for the full build").

## Architecture decisions

- Data is stored per account in the backend's SQLite database, not in the browser.
  - **Why:** the SRS requires accounts, private data per student, hashed passwords and login lockout (FR-01, NFR 6.2).
- The Daily log saves the whole day in one request; the server checks every section and returns errors keyed by field (e.g. `exercise.minutes.0`), which appear next to that field (NFR 6.3).
- Choice lists (activities, meal types, food groups, stress questions) come from the server so they are defined once.
- Progress summaries use only the student's saved check-ins; the demo account's sample data comes from `seed-demo`.

## Gotchas

- Start Flask before the front end; otherwise the app shows "The server isn't responding."
- After a schema change, re-run `flask --app wellness init-db` and `seed-demo` (this deletes local data).
