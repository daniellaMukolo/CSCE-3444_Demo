# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Daniella Mukolo.
"""Exercise section (FR-07 / UC-07) - Daniella.

WHAT THIS FILE DOES
    Saves and loads the activities a student logged for one day, for example
    "Walking, 30 minutes" and "Gym, 45 minutes". A day can have several activities.

HOW IT CONNECTS
    - api/days.py calls the four functions below when the Daily log page loads,
      saves, or deletes a day. This file never talks to the browser directly.
    - The data lives in the exercise_entries table (wellness/schema.sql):
      one row per activity, with entry_date, activity_type and duration_minutes.
    - progress.py adds up duration_minutes per day for the My Progress page,
      and compare.py uses those totals to compare two weeks.
    - The front end form is features/daily-log/MovementSection.tsx.

THE DATA SHAPE THE BROWSER SENDS AND RECEIVES (a list, one item per activity):
    [{"activityType": "Walking", "minutes": 30}, {"activityType": "Gym", "minutes": 45}]
"""

# The choices shown in the activity dropdown. Change this list to add or rename
# activities; MovementSection.tsx reads the same list from the day's API response.
ACTIVITY_TYPES = ["Walking", "Running", "Gym", "Cycling", "Sports", "Yoga", "Dance", "Other"]
MAX_MINUTES = 600       # 10 hours: anything longer is almost certainly a typo
MAX_ACTIVITIES = 10     # keeps one day's list a reasonable length


def load(db, user_id, day):
    """Return that day's activities as a list (an empty list if none were saved)."""
    # "?" placeholders let SQLite insert the values safely (this prevents SQL injection).
    # Filtering by user_id means a student can only ever read their own rows (NFR 6.2).
    rows = db.execute(
        "SELECT activity_type, duration_minutes FROM exercise_entries"
        " WHERE user_id = ? AND entry_date = ? ORDER BY id",
        (user_id, day),
    ).fetchall()
    # Convert database column names (snake_case) to the names the front end uses (camelCase).
    return [{"activityType": row["activity_type"], "minutes": row["duration_minutes"]} for row in rows]


def validate(data):
    """Check the activities the browser sent.

    Returns (clean, errors):
      - clean  = the list ready to save, or None if the student logged no activities
      - errors = {field: message}; the Daily log page shows each message next to its field
    """
    if not data:
        return None, {}   # an empty list means "no exercise logged today", which is allowed

    errors = {}
    if not isinstance(data, list) or len(data) > MAX_ACTIVITIES:
        return None, {"activities": f"Add up to {MAX_ACTIVITIES} activities."}

    clean = []
    # enumerate() gives each activity's position (0, 1, 2...) so the error can point at
    # the right row, e.g. "minutes.1" is the minutes box in the second row.
    for index, item in enumerate(data):
        activity = str(item.get("activityType", ""))
        minutes = item.get("minutes")
        if activity not in ACTIVITY_TYPES:
            errors[f"activityType.{index}"] = "Choose an activity from the list."
        # isinstance(minutes, bool) is checked because Python treats True as the number 1.
        if not isinstance(minutes, int) or isinstance(minutes, bool) or not 1 <= minutes <= MAX_MINUTES:
            errors[f"minutes.{index}"] = f"Enter whole minutes from 1 to {MAX_MINUTES}."
        clean.append({"activityType": activity, "minutes": minutes})

    if errors:
        return None, errors
    return clean, {}


def save(db, user_id, day, clean):
    """Replace that day's activities with the new list.

    Deleting first and then inserting is the simplest way to handle edits:
    the form always sends the whole list, so the saved list ends up matching it.
    days.py commits once after every section is saved, so a failed save changes nothing.
    """
    delete(db, user_id, day)
    for item in clean:
        db.execute(
            "INSERT INTO exercise_entries (user_id, entry_date, activity_type, duration_minutes) VALUES (?, ?, ?, ?)",
            (user_id, day, item["activityType"], item["minutes"]),
        )


def delete(db, user_id, day):
    """Remove every activity saved for that day."""
    db.execute("DELETE FROM exercise_entries WHERE user_id = ? AND entry_date = ?", (user_id, day))
