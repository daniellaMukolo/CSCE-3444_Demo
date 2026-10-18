# Contributing: how Group 09 works together

This file covers **how** we add work to the shared repository. For **what** your code must
connect to, see [docs/INTEGRATION.md](docs/INTEGRATION.md). For which files are yours, see
[TEAM_FILE_OWNERSHIP.md](TEAM_FILE_OWNERSHIP.md).

- **Repository:** https://github.com/daniellaMukolo/CSCE-3444_Demo
- **Project board:** https://github.com/users/daniellaMukolo/projects/2/views/1

## The short version

1. Pick or create a card on the project board and move it to **In progress**.
2. Make a branch from an up-to-date `main`.
3. Work in your own files. Small additions to shared files are fine (see INTEGRATION.md, section 9).
4. Run the checks.
5. Push and open a pull request. A teammate reviews it. Merge after one approval.
6. Move the card to **Done**.

Nobody pushes straight to `main`. The one exception was the initial project foundation (phase 1).

## 1. Branches

Name a branch after the area and the change, with a slash, like the `setup/readme-update`
branch we already used:

```
stress/check-in-questions
compare/date-ranges
sleep/long-sleep-warning
docs/integration-guide
```

To start a branch:

```bash
git checkout main
```
```bash
git pull
```
```bash
git checkout -b stress/check-in-questions
```

## 2. Commits

- Make small commits that each do one thing. It's easier to review and to undo.
- Write the message as a short instruction, up to about 60 characters, and say which feature it touches:
  ```
  Add stress check-in questions to the Daily log
  Fix overlap warning for items on the same day
  ```
- Commit only files that belong to your change. Check with `git status` before committing.

```bash
git add wellness_planner/wellness/api/sections/stress.py
```
```bash
git commit -m "Add stress check-in questions to the Daily log"
```

## 3. Checks before you push

Run these from the project's top folder. Both must pass.

```bash
cd wellness_planner && python -m pytest
```
```bash
cd wellness_frontend/artifacts/student-wellness-planner && npx pnpm@10.18.3 run typecheck
```

Then run both servers (see the [README](README.md#run-it-on-your-computer)) and try your
feature by hand:
- a normal entry;
- leaving it empty;
- wrong values, to make sure the error message appears next to the right field.

## 4. Pull requests

When your branch is ready:

```bash
git push -u origin stress/check-in-questions
```

Then open a pull request on GitHub into `main`.
- **Title:** what it does, e.g. "Stress check-in: questions and support message".
- **Description:**
  - what changed and why;
  - which board card or issue it closes (write `Closes #12`);
  - any **shared files** you touched (INTEGRATION.md, section 9 lists them), so the team knows;
  - whether AI tools helped write it (the course allows AI; we note it for transparency);
  - for visible changes, a screenshot.
- **Review:** request a review from at least one teammate. The reviewer:
  - runs the checks;
  - tries the feature;
  - comments, or approves.
- **Merge** after one approval. Then delete the branch and move the card to **Done**.

If `main` changed while you worked, bring your branch up to date before merging:

```bash
git checkout main
```
```bash
git pull
```
```bash
git checkout stress/check-in-questions
```
```bash
git merge main
```

## 5. Working in each other's areas

- **Each feature belongs to its owner** (TEAM_FILE_OWNERSHIP.md). To change someone else's file,
  ask first, or open a pull request and request their review.
- **Shared files** (the database schema, the Daily log page, the type definitions, the app
  frame): keep changes small, add your part next to the others, and mention it in your pull request.
- **A database schema change** needs the team's agreement first. After it's merged, everyone
  runs `init-db` and `seed-demo`.

## 6. Code style

- **Start every file with the comment header** used throughout the project:
  - **WHAT IT DOES**
  - **HOW IT CONNECTS**
  - **CREDIT**, if you reuse someone's work
- **Write code that reads like the code around it.** Match its names, comments and style.
- **Error messages** say what's wrong and how to fix it, in plain words (NFR 6.3).
- **Python:** follow the existing modules, with a docstring on every function.
- **TypeScript and React:** one component per file, in your feature's folder.
  Prettier formatting is available with `npx pnpm@10.18.3 exec prettier --write <file>`.

## 7. Never commit

- `node_modules/` and `dist/` (installed packages and build output)
- `wellness_planner/instance/` (your local database and secret key)
- `.venv/`, `__pycache__/`, `.pytest_cache/`
- `wellness_replit/` and `wellness_replit.zip` (rebuilt by `make_replit_zip.py`)
- any real password, key or personal data

The `.gitignore` files already skip these; check `git status` anyway.

## 8. Deploying

**We don't deploy until the team agrees the app is complete.** This includes Replit's Publish
button. To show the app, run it locally or use the Replit preview (see REPLIT_SETUP.md).
