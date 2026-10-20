# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Accounts API (FR-01 / UC-01) - Bobby.

WHAT THIS FILE DOES
    The addresses the React app uses for accounts: sign up, log in, log out,
    "who is logged in?", and editing the profile (name and year in school).

HOW IT CONNECTS
    - The rules (password length, lockout after 5 failures, password hashing) live in
      wellness/auth.py and are reused here, so the original Flask pages and the API agree.
    - start_session() stores the user's id in Flask's signed session cookie; on every later
      request auth.py reads it back into g.user.
    - The front end calls these through lib/api/auth.ts; features/auth/AuthPage.tsx is the
      login/sign-up screen and features/profile/ProfilePage.tsx is the profile page.

ADDRESSES (all start with /api/auth)
    POST /register   POST /login   POST /logout   GET /me   PUT /profile
    GET /demo   (temporary: the demo account's login, shown on the login screen)
"""
from flask import Blueprint, abort, current_app, g, jsonify, request, session

from ..auth import YEARS, check_login, create_user, start_session, validate_registration
from ..db import get_db
from .helpers import api_login_required, user_json

bp = Blueprint("api_auth", __name__, url_prefix="/auth")


@bp.post("/register")
def register():
    """Create an account and log in. 400 with field errors if something is wrong."""
    # get_json(silent=True) returns None instead of failing on bad JSON; `or {}` makes it a dict.
    values, errors = validate_registration(request.get_json(silent=True) or {})
    if errors:
        return jsonify(errors=errors), 400
    user_id = create_user(values)
    if user_id is None:   # create_user returns None when the email is already in the database
        return jsonify(errors={"email": "This email is already registered."}, emailTaken=True), 400
    start_session(user_id)
    user = get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return jsonify(user=user_json(user)), 201


@bp.post("/login")
def login():
    """Log in with email and password (5 failures lock the account for 15 minutes)."""
    data = request.get_json(silent=True) or {}
    user, error = check_login(str(data.get("email", "")), str(data.get("password", "")))
    if user is None:
        # The same message for a wrong email or wrong password, so nobody can test which emails exist.
        return jsonify(error=error), 401
    start_session(user["id"])
    return jsonify(user=user_json(user))


@bp.post("/logout")
def logout():
    """End the session."""
    session.clear()
    return jsonify(ok=True)


@bp.get("/demo")
def demo_login():
    """TEMPORARY: the demo student's login, so teammates, instructors and testers can try the app.

    The values come from seed.py (a test-only account created by `seed-demo`), so they're
    written in one place. Answers 404 when SHOW_DEMO_LOGIN is off (see wellness/__init__.py).
    """
    if not current_app.config["SHOW_DEMO_LOGIN"]:
        abort(404)
    from ..seed import DEMO_EMAIL, DEMO_PASSWORD
    return jsonify(email=DEMO_EMAIL, password=DEMO_PASSWORD)


@bp.get("/me")
def me():
    """The logged-in user, or 401. The front end calls this on page load."""
    if g.user is None:
        return jsonify(error="Not logged in."), 401
    return jsonify(user=user_json(g.user), years=YEARS)


@bp.put("/profile")
@api_login_required
def update_profile():
    """Change name and year in school (UC-01 part C)."""
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    year = str(data.get("year", ""))
    errors = {}
    if not name:
        errors["name"] = "Name can't be empty."
    if year not in YEARS:
        errors["year"] = "Choose your year in school."
    if errors:
        return jsonify(errors=errors), 400
    db = get_db()
    # WHERE id = g.user["id"]: a student can only ever change their own account.
    db.execute("UPDATE users SET name = ?, year_in_school = ? WHERE id = ?", (name, year, g.user["id"]))
    db.commit()
    user = db.execute("SELECT * FROM users WHERE id = ?", (g.user["id"],)).fetchone()
    return jsonify(user=user_json(user))
