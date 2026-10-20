# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Daniella Mukolo.
    
"""Compare Routines API (FR-09 / UC-09) - Daniella.

WHAT THIS FILE DOES
    Compares two "routines" side by side. A routine is simply a date range, for
    example "last week" versus "the week before". For each tracked area (sleep,
    stress, exercise, food, screen time) it returns both averages, the change,
    and whether the change is better or worse.

HOW IT CONNECTS
    - The browser calls GET /api/compare?aStart=...&aEnd=...&bStart=...&bEnd=...
      from features/compare/ComparePage.tsx.
    - It does NOT write any new SQL. summarize() in wellness/progress.py already
      calculates every average for a date range, so this file calls it twice
      (once per routine) and compares the results. That is why there is no
      "routines" table in schema.sql.
    - api/__init__.py registers this file's blueprint (`bp`) under /api.

EXAMPLE RESPONSE (shortened)
    {"a": {"start": "2026-10-04", "end": "2026-10-10", "loggedDays": 6},
     "b": {"start": "2026-10-11", "end": "2026-10-17", "loggedDays": 7},
     "enoughData": true,
     "rows": [{"key": "sleep", "label": "Sleep", "unit": "hrs / night",
               "a": 6.8, "b": 7.4, "change": 0.6, "direction": "better"}, ...]}
"""
from datetime import date, timedelta

# Blueprint groups this file's routes; jsonify turns a Python dict into a JSON response;
# request.args holds the ?name=value parts of the URL; g.user is the logged-in student.
from flask import Blueprint, g, jsonify, request

from ..progress import MIN_DAYS_FOR_PROGRESS, summarize
from .helpers import api_login_required, parse_day

bp = Blueprint("api_compare", __name__, url_prefix="/compare")

MAX_RANGE_DAYS = 31   # keep each routine to about a month

# For each area, is a higher number better? Stress and screen time are better when lower.
# (The SRS and design doc agree on these directions; change them here if the team decides otherwise.)
HIGHER_IS_BETTER = {"sleep": True, "stress": False, "exercise": True, "food": True, "screen": False}


def default_ranges():
    """Routine B = the last 7 days ending today; routine A = the 7 days before that."""
    today = date.today()
    b_start = today - timedelta(days=6)
    a_end = b_start - timedelta(days=1)
    return (a_end - timedelta(days=6), a_end), (b_start, today)


def read_range(prefix, default):
    """Read one routine's dates from the URL, e.g. ?aStart=2026-10-01&aEnd=2026-10-07.

    Returns ((start, end), errors). Missing dates fall back to the defaults.
    """
    errors = {}
    start_text = request.args.get(f"{prefix}Start") or default[0].isoformat()
    end_text = request.args.get(f"{prefix}End") or default[1].isoformat()
    start, start_error = parse_day(start_text)   # parse_day also rejects future dates
    end, end_error = parse_day(end_text)
    if start_error:
        errors[f"{prefix}Start"] = start_error
    if end_error:
        errors[f"{prefix}End"] = end_error
    if not errors:
        if end < start:
            errors[f"{prefix}End"] = "The end date needs to be on or after the start date."
        elif (end - start).days + 1 > MAX_RANGE_DAYS:
            errors[f"{prefix}End"] = f"Keep each routine to {MAX_RANGE_DAYS} days or fewer."
    return (start, end), errors


def compare_row(key, a_category, b_category):
    """Build one table row: both scores, the change, and whether it's better or worse."""
    a, b = a_category["score"], b_category["score"]
    row = {"key": key, "label": a_category["label"], "unit": a_category["unit"],
           "a": a, "b": b, "change": None, "direction": "none"}
    # If either routine has no data for this area there is nothing to compare.
    if a is None or b is None:
        return row
    change = round(b - a, 1)
    row["change"] = change
    if change == 0:
        row["direction"] = "same"
    else:
        went_up = change > 0
        # "better" when it went up and higher is better, or went down and lower is better.
        row["direction"] = "better" if went_up == HIGHER_IS_BETTER[key] else "worse"
    return row


@bp.get("")
@api_login_required
def compare():
    """Compare routine A with routine B (both are date ranges)."""
    default_a, default_b = default_ranges()
    (a_start, a_end), a_errors = read_range("a", default_a)
    (b_start, b_end), b_errors = read_range("b", default_b)
    errors = {**a_errors, **b_errors}   # merge both dictionaries of errors
    if errors:
        return jsonify(errors=errors), 400

    # The heavy lifting: summarize() returns averages for every area in each range.
    a = summarize(g.user["id"], a_start, a_end)
    b = summarize(g.user["id"], b_start, b_end)

    rows = [compare_row(key, a["categories"][key], b["categories"][key]) for key in HIGHER_IS_BETTER]
    # UC-09 alternative flow: if either routine has too few logged days, say so instead.
    enough = a["logged_days"] >= MIN_DAYS_FOR_PROGRESS and b["logged_days"] >= MIN_DAYS_FOR_PROGRESS
    return jsonify(
        a={"start": a_start.isoformat(), "end": a_end.isoformat(), "loggedDays": a["logged_days"]},
        b={"start": b_start.isoformat(), "end": b_end.isoformat(), "loggedDays": b["logged_days"]},
        enoughData=enough,
        minDays=MIN_DAYS_FOR_PROGRESS,
        rows=rows,
    )
