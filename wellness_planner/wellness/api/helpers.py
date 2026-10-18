"""Small helpers shared by the API modules - Bobby (integration).

WHAT THIS FILE DOES
    Pieces every API module needs, kept in one place so they behave the same everywhere:
    the login check for API routes, date parsing, the time format, and the safe user fields.

HOW IT CONNECTS
    - api_login_required is placed above every API route that needs a logged-in student.
    - g.user is set for every request by auth.py (load_logged_in_user), from the session cookie.
    - parse_day is used by days.py, schedule.py and compare.py; TIME_PATTERN by the sections.
"""
import functools
import re
from datetime import date

from flask import g, jsonify

TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")   # 'HH:MM', 24-hour (00:00 to 23:59)


def api_login_required(view):
    """Like auth.login_required, but answers 401 JSON instead of redirecting."""
    # A decorator wraps a route function: the check below runs first, then the real route.
    # functools.wraps keeps the route's name so Flask can tell the routes apart.
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            # 401 tells the front end the session ended; it then shows the login page.
            return jsonify(error="Please log in to continue."), 401
        return view(**kwargs)
    return wrapped_view


def parse_day(text, allow_future=False):
    """Parse 'YYYY-MM-DD'. Returns (date, error); future dates are rejected unless allowed."""
    try:
        day = date.fromisoformat(str(text))
    except ValueError:
        return None, "Pick a valid date."
    if not allow_future and day > date.today():
        return None, "The date can't be in the future. Pick today or an earlier date."
    return day, None


def user_json(user):
    """The fields of a user row that are safe to send to the browser (never the password hash)."""
    return {"id": user["id"], "name": user["name"], "email": user["email"], "year": user["year_in_school"]}
