"""Daily check-ins API - shared (integration by Bobby; each section module is its owner's).

WHAT THIS FILE DOES
    Loads, saves and deletes everything logged for one day. The Daily log page sends the
    whole day at once; this file asks every section to check its part, and only if all of
    them pass does it save them all together (or nothing at all).

HOW IT CONNECTS
    - Each section (sleep, stress, exercise, food, screen time, reflection) has its own
      module in api/sections/ with the same four functions: load, validate, save, delete.
      SECTIONS below maps each JSON key to its module.
    - The front end calls these addresses through lib/api/days.ts. LogPage.tsx sends the day;
      the Today page and the saved-days list use list_days().
    - Errors come back keyed by section and field ("exercise.minutes.0"), so the page can
      show each message next to the right box (NFR 6.3).

ADDRESSES (all start with /api/days)
    GET /options      the choice lists for the form (activities, meals, food catalog, ...)
    GET ""            saved days, newest first, with a short summary of each
    GET /<date>       one day        PUT /<date>  save one day     DELETE /<date>  delete it
"""
from flask import Blueprint, g, jsonify, request

from ..db import get_db
from .helpers import api_login_required, parse_day
from .sections import notes, sleep

bp = Blueprint("api_days", __name__, url_prefix="/days")

# JSON key -> section module. The front end uses the same keys.
# Teammates: add your section here when your module is ready (see docs/INTEGRATION.md, section 4):
#   "stress": stress, "exercise": exercise, "food": food, "screenTime": screen_time
SECTIONS = {
    "sleep": sleep,
    "note": notes,
}


def load_day(db, user_id, day):
    """Everything saved for one day, plus whether to show the stress support message."""
    # Ask every section for its data: {"sleep": {...}, "stress": None, "exercise": [], ...}
    result = {key: module.load(db, user_id, day) for key, module in SECTIONS.items()}
    # The day counts as saved if any section has something (None and [] mean "nothing").
    saved = any(value not in (None, []) for value in result.values())
    # supportMessage comes from the stress section (needs_support) once it's added.
    result.update(date=day, saved=saved, supportMessage=False)
    return result


@bp.get("/options")
@api_login_required
def options():
    """The choice lists the Daily log form needs, kept on the server so there is one source."""
    # Teammates: add your section's choice lists here (activity types, meal types and
    # the food catalog, stress questions) so the form reads them from one place.
    return jsonify(longSleepHours=sleep.LONG_SLEEP_HOURS)


# The sections that count toward a "complete" day on the dashboard (the reflection is optional).
TRACKED_SECTIONS = ["sleep", "stress", "exercise", "food", "screenTime"]


@bp.get("")
@api_login_required
def list_days():
    """Saved days, newest first, with a short summary for each (?limit=30).

    Each day lists `sections`: which tracked sections have data, so the dashboard
    can show complete, partly done, or not logged.
    """
    # Keep the limit between 1 and 366 days, whatever the address asks for.
    limit = min(max(request.args.get("limit", 30, type=int), 1), 366)
    db, uid = get_db(), g.user["id"]
    summary = {}   # date -> that day's summary, filled in by the queries below

    def day_entry(day):
        """The summary for `day`, creating an empty one the first time the day is seen."""
        return summary.setdefault(day, {"date": day, "sleepHours": None, "exerciseMinutes": 0,
                                        "mealCount": 0, "sections": []})

    # (query, summary field to fill or None, section it counts toward or None)
    queries = [
        ("SELECT entry_date AS day, total_hours AS value FROM sleep_entries WHERE user_id = ?", "sleepHours", "sleep"),
        ("SELECT entry_date AS day, SUM(duration_minutes) AS value FROM exercise_entries WHERE user_id = ?"
         " GROUP BY entry_date", "exerciseMinutes", "exercise"),
        ("SELECT entry_date AS day, COUNT(*) AS value FROM food_entries WHERE user_id = ? GROUP BY entry_date",
         "mealCount", "food"),
        ("SELECT DISTINCT entry_date AS day FROM stress_checkins WHERE user_id = ?", None, "stress"),
        ("SELECT DISTINCT entry_date AS day FROM screen_time_entries WHERE user_id = ?", None, "screenTime"),
        ("SELECT DISTINCT entry_date AS day FROM water_intake WHERE user_id = ?", None, None),
        ("SELECT DISTINCT entry_date AS day FROM daily_notes WHERE user_id = ?", None, None),
    ]
    for sql, field, section in queries:
        for row in db.execute(sql, (uid,)):
            entry = day_entry(row["day"])
            if field:
                entry[field] = row["value"]
            if section:
                entry["sections"].append(section)

    # Put each day's sections in the standard order (sleep, stress, exercise, food, screenTime).
    for entry in summary.values():
        entry["sections"].sort(key=TRACKED_SECTIONS.index)
    days = sorted(summary.values(), key=lambda d: d["date"], reverse=True)[:limit]
    return jsonify(days=days, trackedSections=TRACKED_SECTIONS)


@bp.get("/<day>")
@api_login_required
def get_day(day):
    """Everything saved for one day (empty sections are null or [])."""
    parsed, error = parse_day(day, allow_future=True)
    if error:
        return jsonify(error=error), 400
    return jsonify(load_day(get_db(), g.user["id"], parsed.isoformat()))


@bp.put("/<day>")
@api_login_required
def save_day(day):
    """Validate every section, then save them all together.

    400 {"errors": {"sleep.bedtime": "..."}}  -> show each message next to its field
    409 {"confirm": "longSleep"}              -> ask "are those times right?" (UC-02 5a),
                                                then resend with "confirmLongSleep": true
    """
    parsed, error = parse_day(day)
    if error:
        return jsonify(errors={"date": error}), 400
    day = parsed.isoformat()
    data = request.get_json(silent=True) or {}

    # Step 1: every section checks its own part. Nothing is saved yet.
    clean, errors = {}, {}
    for key, module in SECTIONS.items():
        section_clean, section_errors = module.validate(data.get(key))
        clean[key] = section_clean
        # Prefix each field with its section: "minutes.0" from exercise becomes "exercise.minutes.0".
        errors.update({f"{key}.{field}": message for field, message in section_errors.items()})
    if errors:
        return jsonify(errors=errors), 400
    if all(value is None for value in clean.values()):
        return jsonify(errors={"form": "Add at least one thing before saving."}), 400

    # Step 2: very long sleep might be a typo (AM/PM mix-up), so ask once before saving.
    sleep_clean = clean["sleep"]
    if sleep_clean and sleep_clean["totalHours"] > sleep.LONG_SLEEP_HOURS and not data.get("confirmLongSleep"):
        return jsonify(confirm="longSleep", totalHours=sleep_clean["totalHours"]), 409

    # Step 3: save every section, then commit once. If anything fails before commit(),
    # SQLite throws the whole change away, so a day is never half saved.
    db, uid = get_db(), g.user["id"]
    for key, module in SECTIONS.items():
        if clean[key] is None:
            module.delete(db, uid, day)       # the student cleared this section
        else:
            module.save(db, uid, day, clean[key])
    db.commit()
    return jsonify(load_day(db, uid, day))


@bp.delete("/<day>")
@api_login_required
def delete_day(day):
    """Delete everything saved for one day."""
    parsed, error = parse_day(day, allow_future=True)
    if error:
        return jsonify(error=error), 400
    db, uid = get_db(), g.user["id"]
    for module in SECTIONS.values():
        module.delete(db, uid, parsed.isoformat())
    db.commit()
    return jsonify(ok=True)
