# DRAFT FOR DANIELLA: a temporary working draft written with Claude AI so that every
# planned feature of the app could be run and tested together. This section is Daniella's
# to design and write. She can keep, change or replace any part of it, or none of it.
# Every part is explained in the comments below, so pieces are easy to reuse or rewrite.

"""Screen time section (FR-08 / UC-08) - Daniella.

WHAT THIS FILE DOES
    Saves and loads how many hours a student spent on screens for one day.
    There is at most one screen time entry per day.

HOW IT CONNECTS
    - api/days.py calls the four functions below when the Daily log page loads,
      saves, or deletes a day.
    - The data lives in the screen_time_entries table (wellness/schema.sql). Its
      UNIQUE (user_id, entry_date) rule is what allows only one entry per day.
    - progress.py averages `hours` for My Progress; compare.py compares two weeks.
    - The front end field is features/daily-log/ScreenTimeSection.tsx.

THE DATA SHAPE THE BROWSER SENDS AND RECEIVES:
    {"hours": 4.5}      or   null when screen time wasn't logged that day
"""

MAX_HOURS = 24


def load(db, user_id, day):
    """Return {"hours": number} for that day, or None if nothing was saved."""
    row = db.execute(
        "SELECT hours FROM screen_time_entries WHERE user_id = ? AND entry_date = ?",
        (user_id, day),
    ).fetchone()   # fetchone() gives one row, or None when there isn't one
    return None if row is None else {"hours": row["hours"]}


def validate(data):
    """Check the hours the browser sent. Returns (clean, errors) like every section."""
    # A blank box arrives as None or "" and means "not logged today".
    if not data or data.get("hours") in (None, ""):
        return None, {}

    hours = data.get("hours")
    # Accept whole numbers and decimals (4 or 4.25), but not text or True/False.
    if not isinstance(hours, (int, float)) or isinstance(hours, bool) or not 0 <= hours <= MAX_HOURS:
        return None, {"hours": f"Enter hours from 0 to {MAX_HOURS}, for example 4.5."}

    # round() keeps the stored value tidy if the browser sends something like 4.2500000001.
    return {"hours": round(float(hours), 2)}, {}


def save(db, user_id, day, clean):
    """Replace that day's screen time with the new value (days.py commits afterwards)."""
    delete(db, user_id, day)
    db.execute(
        "INSERT INTO screen_time_entries (user_id, entry_date, hours) VALUES (?, ?, ?)",
        (user_id, day, clean["hours"]),
    )


def delete(db, user_id, day):
    """Remove that day's screen time entry, if there is one."""
    db.execute("DELETE FROM screen_time_entries WHERE user_id = ? AND entry_date = ?", (user_id, day))
