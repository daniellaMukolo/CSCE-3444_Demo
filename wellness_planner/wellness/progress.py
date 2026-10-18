"""My Progress (FR-03 / UC-03) - Bobby.

WHAT THIS FILE DOES
    The math behind "Your patterns": summarize() reads the five tracked tables (sleep,
    stress, exercise, food, screen time) for a date range and returns each category's
    average and its value for every day. match_recommendations() picks the routine-feedback
    tips that fit those averages. It also has the original server-rendered progress page.

HOW IT CONNECTS
    - api/progress.py (used by the React "Your patterns" page) calls summarize() and
      match_recommendations().
    - api/compare.py (Daniella, Compare Routines) calls summarize() once per date range.
    - Tips come from data/recommendations.json (the Recommendation Library, NFR 6.5), so
      they can be edited without changing code. Each tip has a category, a score range
      (min <= score < max), a priority, and a source.
"""
import json
from datetime import date, timedelta
from pathlib import Path

from flask import Blueprint, abort, current_app, g, render_template, request

from .auth import login_required
from .db import get_db
from .main import available_trackers

bp = Blueprint("progress", __name__, url_prefix="/progress")

# NFR 6.5: recommendations live in a data file so they can change without code changes.
RECOMMENDATIONS_FILE = Path(__file__).parent / "data" / "recommendations.json"
MIN_DAYS_FOR_PROGRESS = 3    # UC-03 2a
MAX_RECOMMENDATIONS = 3      # FR-03

# One value per day per category. Exercise is summed and food averaged per day,
# since a student can log several of those in one day.
CATEGORY_QUERIES = {
    "sleep": "SELECT entry_date AS day, total_hours AS value FROM sleep_entries"
             " WHERE user_id = ? AND entry_date BETWEEN ? AND ?",
    "stress": "SELECT entry_date AS day, stress_level AS value FROM stress_checkins"
              " WHERE user_id = ? AND entry_date BETWEEN ? AND ?",
    "exercise": "SELECT entry_date AS day, SUM(duration_minutes) AS value FROM exercise_entries"
                " WHERE user_id = ? AND entry_date BETWEEN ? AND ? GROUP BY entry_date",
    "food": "SELECT entry_date AS day, AVG(meal_score) AS value FROM food_entries"
            " WHERE user_id = ? AND entry_date BETWEEN ? AND ? GROUP BY entry_date",
    "screen": "SELECT entry_date AS day, hours AS value FROM screen_time_entries"
              " WHERE user_id = ? AND entry_date BETWEEN ? AND ?",
}

CATEGORY_LABELS = {
    "sleep": ("Sleep", "hrs / night"),
    "stress": ("Stress", "/ 5 average"),
    "exercise": ("Exercise", "min / week"),
    "food": ("Food", "/ 3 daily score"),
    "screen": ("Screen Time", "hrs / day"),
}


def summarize(user_id, start, end):
    """Averages and day-by-day values for every category from start to end (inclusive).

    Returns {"start", "end", "days", "categories", "logged_days"}. Each category has
    label, unit, score (None if no data) and series (one value or None per day).
    Exercise is minutes per week so 7- and 30-day periods are comparable.
    """
    db = get_db()
    # Every date in the range as 'YYYY-MM-DD' text: start, start+1, ... end.
    days = [(start + timedelta(days=n)).isoformat() for n in range((end - start).days + 1)]
    categories = {}
    logged_days = set()   # a set ignores repeats, so a day counts once however many areas were logged

    for key, sql in CATEGORY_QUERIES.items():
        # {date: value} for the days that have data in this category.
        by_day = {row["day"]: row["value"]
                  for row in db.execute(sql, (user_id, start.isoformat(), end.isoformat()))}
        logged_days.update(by_day)
        values = list(by_day.values())
        if not values:
            score = None
        elif key == "exercise":
            # Total minutes spread over the whole range, scaled to a week (a day off counts as 0).
            score = sum(values) / len(days) * 7
        else:
            score = sum(values) / len(values)   # the average of the days that were logged
        label, unit = CATEGORY_LABELS[key]
        categories[key] = {
            "label": label,
            "unit": unit,
            "score": None if score is None else round(score, 1),
            # One value per day for the chart; .get() gives None for days with nothing logged.
            "series": [by_day.get(day) for day in days],
        }

    return {"start": start, "end": end, "days": days, "categories": categories,
            "logged_days": len(logged_days)}


def load_recommendations():
    """Read the tip list from data/recommendations.json."""
    with RECOMMENDATIONS_FILE.open(encoding="utf-8") as f:
        return json.load(f)["recommendations"]


def match_recommendations(summary, limit=MAX_RECOMMENDATIONS):
    """Tips whose score range (min <= score < max) fits the summary, highest priority first.

    `limit` caps how many are returned (None = all of them).
    """
    matches = []
    for rec in load_recommendations():
        score = summary["categories"].get(rec["category"], {}).get("score")
        if score is not None and rec["min"] <= score < rec["max"]:
            matches.append(rec)
    # Lower priority numbers come first; tips without a priority go last.
    matches.sort(key=lambda rec: rec.get("priority", 99))
    return matches if limit is None else matches[:limit]


# ----- The original HTML progress pages (the React version uses api/progress.py) -----

@bp.route("/")
@login_required
def index():
    """My Progress page for the last 7 or 30 days (?days=7 or ?days=30)."""
    period = request.args.get("days", "7")
    if period not in ("7", "30"):
        period = "7"
    end = date.today()
    start = end - timedelta(days=int(period) - 1)
    summary = summarize(g.user["id"], start, end)
    enough_data = summary["logged_days"] >= MIN_DAYS_FOR_PROGRESS
    return render_template(
        "progress/index.html",
        period=period,
        summary=summary,
        enough_data=enough_data,
        recommendations=match_recommendations(summary) if enough_data else [],
        min_days=MIN_DAYS_FOR_PROGRESS,
        trackers=available_trackers(),
        has_compare="compare.index" in current_app.view_functions,
    )


@bp.route("/tip/<rec_id>")
@login_required
def recommendation(rec_id):
    """Full explanation and source for one tip (UC-03 steps 7-8)."""
    rec = next((r for r in load_recommendations() if r["id"] == rec_id), None)
    if rec is None:
        abort(404)
    return render_template("progress/recommendation.html", rec=rec)
