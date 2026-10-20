# Student Wellness Planner: Group 09, CSCE 3444, Fall 2026

A web application that helps a student manage physical and mental health while
navigating college. Students log sleep, stress, movement, food and screen time each
day, keep a weekly class and work schedule, and see their patterns over time with
friendly, sourced tips.

| Member | Role | Features (from the project plan) |
|---|---|---|
| Bobby Hughes | Project Coordinator | Accounts and profile (FR-01), Sleep (FR-02), My Progress with recommendations (FR-03) |
| Malika Ray | Backend Developer | Schedule (FR-04), Stress check-in (FR-05), Food (FR-06) |
| Daniella Mukolo | Testing | Exercise (FR-07), Screen time (FR-08), Compare Routines (FR-09) |

- **Repository:** https://github.com/daniellaMukolo/CSCE-3444_Demo
- **Project board:** https://github.com/users/daniellaMukolo/projects/2/views/1
- **Status:** working build for the midterm demo. **Not deployed:** the team agreed not to
  deploy until the app is complete.

## How the app is built

```
Browser ──> React front end (wellness_frontend, port 5173)
                │  every /api request is forwarded by Vite
                ▼
            Flask JSON API (wellness_planner, port 5000) ──> SQLite database
```

- **Front end:** React 19 + TypeScript + Vite. It draws the pages and sends and receives JSON.
- **Backend:** Flask 3 + SQLite. It handles accounts and security, checks every input, and stores the data.
- **Content kept outside the code (NFR 6.5):**
  - `wellness_planner/wellness/data/recommendations.json` holds the tips.
  - `wellness_planner/wellness/data/food_catalog.json` holds the foods.

## Run it on your computer

You need **Python 3.10 or newer** and **Node.js 20.19 or newer**. Use two terminals.

**Terminal 1: backend**
```bash
cd wellness_planner
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
flask --app wellness init-db       # creates the database (deletes existing data)
flask --app wellness seed-demo     # demo student with 14 days of sample data
flask --app wellness run --debug   # API on http://127.0.0.1:5000
```

**Terminal 2: front end**
```bash
cd wellness_frontend
npx pnpm@10.18.3 install
cd artifacts/student-wellness-planner
```
Then start it:
- **PowerShell:** `$env:PORT="5173"; $env:BASE_PATH="/"; npx pnpm@10.18.3 run dev`
- **Git Bash / macOS / Linux:** `PORT=5173 BASE_PATH=/ npx pnpm@10.18.3 run dev`

Open http://localhost:5173. The demo login is defined in `wellness_planner/wellness/seed.py`
(`DEMO_EMAIL` / `DEMO_PASSWORD`). It is a local test account only.

To run it on Replit instead (view only, no deploying), see [REPLIT_SETUP.md](REPLIT_SETUP.md).

## Checks before you push

Run each command from the project's top folder:

```bash
cd wellness_planner && python -m pytest
```

```bash
cd wellness_frontend/artifacts/student-wellness-planner && npx pnpm@10.18.3 run typecheck
```

## Where things are

| Folder or file | What's in it |
|---|---|
| `wellness_planner/` | Flask backend. See its [README](wellness_planner/README.md) for the file layout. |
| `wellness_planner/wellness/api/` | The JSON API, one module per feature |
| `wellness_planner/wellness/api/sections/` | One module per Daily log section (sleep, stress, food, ...) |
| `wellness_frontend/artifacts/student-wellness-planner/src/` | React front end. See [replit.md](wellness_frontend/replit.md) for the file map. |
| `src/features/` | One folder per page (daily-log, schedule, progress, compare, ...) |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | **How each part plugs into the others:** the interface rules every feature follows |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How we work together: branches, commits, pull requests, checks |
| [TEAM_FILE_OWNERSHIP.md](TEAM_FILE_OWNERSHIP.md) | Which files belong to whom |

Every code file starts with a comment header:
- **WHAT IT DOES**
- **HOW IT CONNECTS** to the other files
- **CREDIT**, where earlier work is reused

## Credits

- **Original visual design and first prototype:** Malika Ray, built in Replit.
- **Character images:** created by Bobby using Codex AI.
- **AI assistance:** the team used AI tools (Replit AI, ChatGPT Codex, Claude), as the course allows.
