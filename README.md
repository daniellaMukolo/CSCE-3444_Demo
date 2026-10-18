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

**GitHub Project board:** https://github.com/users/daniellaMukolo/projects/2/views/1

## Current status

**Phase 1: project foundation.** The backend foundation is in place:
- the app setup and the database schema, with every team table;
- accounts and security;
- the shared helpers;
- the Daily log API with the sleep section as the reference example;
- the progress summaries and the Recommendation Library.

[docs/INTEGRATION.md](docs/INTEGRATION.md) describes how each teammate's feature plugs in.

**Next:** each member adds their sections on top of this foundation, then the front end.
The app won't be deployed until the team agrees it is complete.

## How the app is built

```
Browser ──> React front end (coming next)
                │  every /api request goes to the backend
                ▼
            Flask JSON API (wellness_planner, port 5000) ──> SQLite database
```

- **Backend:** Flask 3 + SQLite. It handles accounts and security, checks every input, and stores the data.
- **Content kept outside the code (NFR 6.5):** `wellness_planner/wellness/data/recommendations.json` holds the tips.

## Run the backend

You need **Python 3.10 or newer**.

```bash
cd wellness_planner
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
flask --app wellness init-db       # creates the database (deletes existing data)
flask --app wellness seed-demo     # demo student with sample data
flask --app wellness run --debug   # http://127.0.0.1:5000
```

The demo login is defined in `wellness_planner/wellness/seed.py` (`DEMO_EMAIL` / `DEMO_PASSWORD`).
It is a local test account only.

**Tests:** from `wellness_planner/`, run `python -m pytest`.

## Where things are

| Folder or file | What's in it |
|---|---|
| `wellness_planner/` | Flask backend. See its [README](wellness_planner/README.md) for the file layout. |
| `wellness_planner/wellness/api/` | The JSON API, one module per feature |
| `wellness_planner/wellness/api/sections/` | One module per Daily log section |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) | **How each part plugs into the others:** the interface rules every feature follows |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How we work together: branches, commits, pull requests, checks |
| [TEAM_FILE_OWNERSHIP.md](TEAM_FILE_OWNERSHIP.md) | Which files belong to whom |

Every code file starts with a comment header:
- **WHAT IT DOES**
- **HOW IT CONNECTS** to the other files
- **CREDIT**, where earlier work is reused

## AI assistance

The team uses AI tools as the course allows.
