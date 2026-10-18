"""Sleep section (FR-02 / UC-02) - Bobby.

WHAT THIS FILE DOES
    Saves and loads one night of sleep for a day: bedtime, wake time, an optional
    1-5 quality rating, and the total hours (calculated here, never typed in).

HOW IT CONNECTS
    - api/days.py calls the four functions below when the Daily log page loads,
      saves, or deletes a day. This file never talks to the browser directly.
    - The hours math lives in wellness/sleep.py (calculate_total_hours), shared with
      the original Flask sleep pages, so both always agree.
    - The data lives in the sleep_entries table (wellness/schema.sql), one row per day.
    - progress.py averages total_hours for My Progress; compare.py compares two weeks.
    - The front end form is features/daily-log/SleepSection.tsx.

THE DATA SHAPE THE BROWSER SENDS AND RECEIVES:
    {"bedtime": "23:30", "wakeTime": "07:00", "quality": 4, "totalHours": 7.5}
    (the browser leaves out totalHours; the server adds it) or null when not logged.
"""
from ...sleep import LONG_SLEEP_HOURS, calculate_total_hours
from ..helpers import TIME_PATTERN

# __all__ lists what other files may import from here. LONG_SLEEP_HOURS is passed
# along so days.py can warn about very long sleep (UC-02 5a) without importing sleep.py.
__all__ = ["LONG_SLEEP_HOURS", "load", "validate", "save", "delete"]


def load(db, user_id, day):
    """Return that day's sleep as a dict, or None if nothing was saved."""
    # "?" placeholders let SQLite insert the values safely (prevents SQL injection), and
    # filtering by user_id means a student only ever sees their own rows (NFR 6.2).
    row = db.execute("SELECT bedtime, wake_time, quality, total_hours FROM sleep_entries"
                     " WHERE user_id = ? AND entry_date = ?", (user_id, day)).fetchone()
    if row is None:
        return None
    # Database column names (snake_case) become the names the front end uses (camelCase).
    return {"bedtime": row["bedtime"], "wakeTime": row["wake_time"],
            "quality": row["quality"], "totalHours": row["total_hours"]}


def validate(data):
    """Check what the browser sent. Returns (clean, errors) like every section:
    clean is None when sleep was left empty; errors is {field: message}."""
    if not data:
        return None, {}
    # `or ""` turns a missing value (None) into empty text so .strip() always works.
    bedtime = str(data.get("bedtime") or "").strip()
    wake = str(data.get("wakeTime") or "").strip()
    quality = data.get("quality")
    if not bedtime and not wake:
        return None, {}   # sleep not logged today
    errors = {}
    # TIME_PATTERN (api/helpers.py) accepts 24-hour 'HH:MM' text, which <input type="time"> sends.
    if not TIME_PATTERN.match(bedtime):
        errors["bedtime"] = "Enter your bedtime, for example 11:30 PM."          # UC-02 4a
    if not TIME_PATTERN.match(wake):
        errors["wakeTime"] = "Enter your wake time, for example 7:00 AM."
    if quality not in (None, "", 1, 2, 3, 4, 5):
        errors["quality"] = "Choose a rating from 1 to 5, or leave it blank."
    if errors:
        return None, errors
    # Total hours handle sleep past midnight (23:30 -> 07:00 = 7.5 hours).
    return {"bedtime": bedtime, "wakeTime": wake, "quality": quality or None,
            "totalHours": calculate_total_hours(bedtime, wake)}, {}


def save(db, user_id, day, clean):
    """Replace that day's sleep with the new values. days.py commits after every section
    is saved, so if any section fails, nothing is changed."""
    delete(db, user_id, day)
    db.execute("INSERT INTO sleep_entries (user_id, entry_date, bedtime, wake_time, quality, total_hours)"
               " VALUES (?, ?, ?, ?, ?, ?)",
               (user_id, day, clean["bedtime"], clean["wakeTime"], clean["quality"], clean["totalHours"]))


def delete(db, user_id, day):
    """Remove that day's sleep entry, if there is one."""
    db.execute("DELETE FROM sleep_entries WHERE user_id = ? AND entry_date = ?", (user_id, day))
