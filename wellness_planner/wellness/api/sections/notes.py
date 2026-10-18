"""Reflection section ("Anything else?") - shared, maintained by Bobby.

WHAT THIS FILE DOES
    Saves and loads an optional free-text note for the day (up to 1,000 characters).
    It isn't one of the SRS's tracked areas, so it doesn't count toward a "complete" day.

HOW IT CONNECTS
    - api/days.py calls the four functions below like every other section.
    - The data lives in the daily_notes table (wellness/schema.sql), one row per day.
    - The front end box is features/daily-log/ReflectionSection.tsx; the Today page
      (features/dashboard/DashboardPage.tsx) shows today's note.

THE DATA SHAPE THE BROWSER SENDS AND RECEIVES:
    "Felt good after the study group."      or   null when there's no note
"""

MAX_LENGTH = 1000


def load(db, user_id, day):
    """Return that day's note as text, or None if there isn't one."""
    row = db.execute("SELECT note FROM daily_notes WHERE user_id = ? AND entry_date = ?", (user_id, day)).fetchone()
    return None if row is None else row["note"]


def validate(data):
    """Check the note. Returns (clean, errors) like every section."""
    note = str(data or "").strip()
    if not note:
        return None, {}   # an empty box means "no note today"
    if len(note) > MAX_LENGTH:
        # {MAX_LENGTH:,} writes the number with a comma: 1,000.
        return None, {"note": f"Keep your reflection under {MAX_LENGTH:,} characters."}
    return note, {}


def save(db, user_id, day, clean):
    """Replace that day's note (days.py commits afterwards)."""
    delete(db, user_id, day)
    db.execute("INSERT INTO daily_notes (user_id, entry_date, note) VALUES (?, ?, ?)", (user_id, day, clean))


def delete(db, user_id, day):
    """Remove that day's note, if there is one."""
    db.execute("DELETE FROM daily_notes WHERE user_id = ? AND entry_date = ?", (user_id, day))
