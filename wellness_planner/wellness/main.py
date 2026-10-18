"""Original HTML dashboard and profile pages (FR-01 profile basics) - Bobby.

WHAT THIS FILE DOES
    The first, server-rendered version of the dashboard and profile pages (Jinja
    templates in templates/main/). The React app replaced them with
    features/dashboard/DashboardPage.tsx and features/profile/ProfilePage.tsx; these
    still work at /dashboard and /profile as a fallback.

HOW IT CONNECTS
    - TRACKERS lists the dashboard tiles. A tile becomes a link once the blueprint for its
      endpoint is registered; until then it shows "Coming soon".
    - progress.py reuses available_trackers() for its page menu.
"""
from flask import Blueprint, current_app, flash, g, redirect, render_template, request, url_for

from .auth import YEARS, login_required
from .db import get_db

bp = Blueprint("main", __name__)

# (tile label, endpoint, description). Teammates' blueprints must use these endpoint names.
TRACKERS = [
    ("Sleep", "sleep.index", "Bedtime, wake time, sleep quality"),
    ("Stress Check-in", "stress.index", "Daily stress rating and questions"),
    ("Exercise", "exercise.index", "Activity and minutes"),
    ("Food", "food.index", "Meals, food score, water"),
    ("Schedule", "schedule.index", "Classes, work, and study blocks"),
    ("Screen Time", "screen_time.index", "Daily hours on screens"),
]


def available_trackers():
    """Return TRACKERS with a fourth value: True if that page is registered."""
    return [(label, endpoint, blurb, endpoint in current_app.view_functions)
            for label, endpoint, blurb in TRACKERS]


@bp.route("/")
def index():
    """Send logged-in users to the dashboard and everyone else to login."""
    return redirect(url_for("main.dashboard" if g.user else "auth.login"))


@bp.route("/dashboard")
@login_required
def dashboard():
    """Show the dashboard tiles."""
    return render_template("main/dashboard.html", trackers=available_trackers())


@bp.route("/profile", methods=("GET", "POST"))
@login_required
def profile():
    """View and edit name and year in school (UC-01 part C)."""
    values = {"name": g.user["name"], "year": g.user["year_in_school"]}
    errors = {}
    if request.method == "POST":
        values = {"name": request.form.get("name", "").strip(), "year": request.form.get("year", "")}
        if not values["name"]:
            errors["name"] = "Name can't be empty."
        if values["year"] not in YEARS:
            errors["year"] = "Choose your year in school."
        if not errors:
            db = get_db()
            db.execute("UPDATE users SET name = ?, year_in_school = ? WHERE id = ?",
                       (values["name"], values["year"], g.user["id"]))
            db.commit()
            flash("Profile saved.", "success")
            return redirect(url_for("main.profile"))
    return render_template("main/profile.html", values=values, errors=errors, years=YEARS)
