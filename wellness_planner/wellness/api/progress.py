"""My Progress API (FR-03 / UC-03) - Bobby.

WHAT THIS FILE DOES
    Sends the "Your patterns" page everything it shows: the averages and daily values for
    the last 7 or 30 days, the routine-feedback tips that match those numbers, and the
    single most important tip for each category (shown in that category's chart box).

HOW IT CONNECTS
    - The math is in wellness/progress.py: summarize() calculates the averages, and
      match_recommendations() picks tips from data/recommendations.json (the
      Recommendation Library, NFR 6.5).
    - Tips appear only after MIN_DAYS_FOR_PROGRESS logged days, so they're based on a pattern.
    - The front end calls these addresses through lib/api/progress.ts;
      features/progress/ProgressPage.tsx shows the results.

ADDRESSES (all start with /api/progress)
    GET ""?days=7 or 30      the summary, tips and categoryTips
    GET /tips/<id>           one tip in full, with its source
"""
from datetime import date, timedelta

from flask import Blueprint, abort, g, jsonify, request

from ..progress import MIN_DAYS_FOR_PROGRESS, load_recommendations, match_recommendations, summarize
from .helpers import api_login_required

bp = Blueprint("api_progress", __name__, url_prefix="/progress")


def summary_json(summary):
    """summarize() returns date objects; turn them into 'YYYY-MM-DD' text for JSON."""
    return {**summary, "start": summary["start"].isoformat(), "end": summary["end"].isoformat()}


@bp.get("")
@api_login_required
def get_progress():
    """The summary for the last 7 or 30 days (today included), with matching tips."""
    period = request.args.get("days", "7")
    if period not in ("7", "30"):
        period = "7"   # anything else falls back to a week
    end = date.today()
    # The range includes today, so 7 days = today and the 6 days before it.
    summary = summarize(g.user["id"], end - timedelta(days=int(period) - 1), end)
    enough = summary["logged_days"] >= MIN_DAYS_FOR_PROGRESS
    # categoryTips: the most important matching tip for each category, for the note in its chart box.
    category_tips = {}
    for rec in match_recommendations(summary, limit=None) if enough else []:
        category_tips.setdefault(rec["category"], rec)
    return jsonify(period=int(period), summary=summary_json(summary), enoughData=enough,
                   minDays=MIN_DAYS_FOR_PROGRESS,
                   recommendations=match_recommendations(summary) if enough else [],
                   categoryTips=category_tips)


@bp.get("/tips/<rec_id>")
@api_login_required
def get_tip(rec_id):
    """One recommendation in full (UC-03 steps 7-8)."""
    rec = next((r for r in load_recommendations() if r["id"] == rec_id), None)
    if rec is None:
        abort(404, description="That tip wasn't found.")
    return jsonify(rec)
