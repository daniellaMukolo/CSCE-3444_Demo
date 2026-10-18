"""Stress check-in section (FR-05 / UC-05) - Malika.

WHAT THIS FILE DOES
    Saves and loads one stress check-in per day: a 1-5 stress level, Yes/No answers to
    five short questions, and an optional note. It also decides when to show the
    campus support message (stress of 4+ on 3 days in a row, UC-05 5a).

HOW IT CONNECTS
    - api/days.py calls load/validate/save/delete when the Daily log page loads, saves,
      or deletes a day, and calls needs_support() after a save.
    - QUESTIONS is sent to the browser by GET /api/days/options, so the questions are
      written only here; features/daily-log/StressSection.tsx shows them.
    - The data lives in the stress_checkins table (wellness/schema.sql).
    - progress.py averages stress_level for My Progress; compare.py compares two weeks.
    - When needs_support() is true, the front end shows features/daily-log/SupportPanel.tsx.

THE DATA SHAPE THE BROWSER SENDS AND RECEIVES:
    {"level": 3, "answers": [true, false, true, false, true], "note": "Big exam"}
"""
from datetime import date, timedelta

# The five questions. The first comes from the SRS; the team can reword the rest.
# Changing the number of questions also needs a matching change in StressSection.tsx's layout.
QUESTIONS = [
    "Did you feel overwhelmed today?",
    "Did you get enough sleep last night?",
    "Did you take at least one real break?",
    "Did schoolwork or your job feel unmanageable?",
    "Did you talk with a friend or family member?",
]
HIGH_STRESS = 4          # UC-05 5a: a level of 4 or more...
HIGH_STRESS_DAYS = 3     # ...on 3 days in a row shows a support message


def load(db, user_id, day):
    """Return that day's check-in as a dict, or None if nothing was saved."""
    row = db.execute("SELECT stress_level, answers, note FROM stress_checkins"
                     " WHERE user_id = ? AND entry_date = ?", (user_id, day)).fetchone()
    if row is None:
        return None
    # The answers are stored as text like "YNYNY"; turn each letter back into True/False.
    return {"level": row["stress_level"], "answers": [a == "Y" for a in row["answers"]], "note": row["note"] or ""}


def validate(data):
    """Check what the browser sent. Returns (clean, errors) like every section."""
    if not data or data.get("level") in (None, ""):
        return None, {}   # stress not logged today (no level chosen)
    errors = {}
    level = data.get("level")
    if level not in (1, 2, 3, 4, 5):
        errors["level"] = "Choose a stress level from 1 to 5."                    # UC-05 4a
    answers = data.get("answers") or []
    # Every question needs a real True/False answer (not missing, not text).
    if len(answers) != len(QUESTIONS) or any(a not in (True, False) for a in answers):
        errors["answers"] = "Answer all five questions with Yes or No."
    note = str(data.get("note") or "").strip()
    if len(note) > 500:
        errors["note"] = "Keep the note under 500 characters."
    if errors:
        return None, errors
    return {"level": level, "answers": answers, "note": note}, {}


def save(db, user_id, day, clean):
    """Replace that day's check-in (days.py commits once every section has saved)."""
    delete(db, user_id, day)
    # "".join(...) turns [True, False, ...] into compact text like "YN..." for one column.
    db.execute("INSERT INTO stress_checkins (user_id, entry_date, stress_level, answers, note) VALUES (?, ?, ?, ?, ?)",
               (user_id, day, clean["level"], "".join("Y" if a else "N" for a in clean["answers"]),
                clean["note"] or None))


def delete(db, user_id, day):
    """Remove that day's check-in, if there is one."""
    db.execute("DELETE FROM stress_checkins WHERE user_id = ? AND entry_date = ?", (user_id, day))


def needs_support(db, user_id, day):
    """True if stress was HIGH_STRESS or more on each of the HIGH_STRESS_DAYS days ending on `day`."""
    end = date.fromisoformat(day)
    start = (end - timedelta(days=HIGH_STRESS_DAYS - 1)).isoformat()
    # Count the high-stress days in the window; all 3 days must qualify (a missed day breaks the streak).
    count = db.execute("SELECT COUNT(*) FROM stress_checkins WHERE user_id = ? AND entry_date BETWEEN ? AND ?"
                       " AND stress_level >= ?", (user_id, start, day, HIGH_STRESS)).fetchone()[0]
    return count == HIGH_STRESS_DAYS
