# Student Wellness Planner — backend (Team 9, CSCE 3444)

Flask + SQLite. This is the server for the app: accounts and security (FR-01, NFR 6.2), the database,
and a JSON API under `/api` that the React front end in `../wellness_frontend` uses.
The original Bootstrap pages (`/auth/login`, `/sleep`, `/progress`) work on their own; the React app will be the main interface.

## Running the backend

```bash
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
flask --app wellness init-db     # creates instance/wellness.sqlite (deletes existing data)
flask --app wellness seed-demo   # demo student with 14 days of sample data
flask --app wellness run --debug # serves the API on http://127.0.0.1:5000
```

Then open http://127.0.0.1:5000 for the original pages. The React front end is added in a later step.

Demo login: `alexa@my.unt.edu` / `wellness123` (set in `wellness/seed.py`; local test data only).
Re-run `seed-demo` right before recording to reset the demo account.

Run the tests with `python -m pytest`.

The whole-project overview is in the [top-level README](../README.md); how each feature plugs in
is in [docs/INTEGRATION.md](../docs/INTEGRATION.md).

## Layout

```
wellness/
  __init__.py        app factory; registers the page blueprints and the API
  db.py              get_db(), init-db command
  schema.sql         ALL tables for the whole team
  auth.py            account rules: validate_registration, create_user, check_login (lockout), login_required
  seed.py            seed-demo command
  sleep.py, progress.py, main.py, templates/   original Bootstrap pages
  progress.py        summarize() + recommendations (also used by the API)
  data/
    recommendations.json   Recommendation Library (edit without touching code)
    food_catalog.json      cuisines, dishes, ingredients, food groups (added with the food section)
  api/
    __init__.py      registers every API blueprint; requires JSON for changes
    helpers.py       api_login_required, parse_day, user_json
    auth.py          /api/auth: register, login, logout, me, profile
    days.py          /api/days: load, save and delete a whole day (runs every section below)
    sections/        one module per check-in section, each with load/validate/save/delete:
      sleep.py  notes.py           (added next by teammates: stress.py  exercise.py  food.py  screen_time.py)
    schedule.py      /api/schedule: list, add, edit, delete, overlap warning (Malika, next)
    progress.py      /api/progress: 7/30-day summary and tips
    compare.py       /api/compare: Compare Routines (two date ranges) (Daniella, next)
tests/
```

## Who owns what

| Area | Backend | Front end (`wellness_frontend/.../src/`) |
|---|---|---|
| Accounts, sleep, progress (Bobby) | `auth.py`, `api/auth.py`, `api/sections/sleep.py`, `api/progress.py` | `features/auth`, `features/daily-log/SleepSection.tsx`, `features/progress`, `features/profile` |
| Schedule, stress, food (Malika) | `api/schedule.py`, `api/sections/stress.py`, `api/sections/food.py`, `data/food_catalog.json` | `features/schedule`, `StressSection.tsx`, `MealsSection.tsx`, `features/daily-log/food/`, the overall look |
| Exercise, screen time, compare (Daniella) | `api/sections/exercise.py`, `api/sections/screen_time.py`, `api/compare.py` | `MovementSection.tsx`, `ScreenTimeSection.tsx`, `features/compare` |
