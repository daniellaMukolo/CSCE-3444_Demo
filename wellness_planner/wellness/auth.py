# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Accounts (FR-01 / UC-01) - Bobby.

WHAT THIS FILE DOES
    Holds the account rules: sign up, log in, log out, and knowing who is logged in.
    Covers NFR 6.2: hashed passwords, an 8-character minimum, and a 15-minute lockout
    after 5 failed logins.

HOW IT CONNECTS
    - validate_registration(), create_user() and check_login() hold the rules. The JSON API
      in api/auth.py (used by the React app) and the original HTML pages below both use them.
    - load_logged_in_user() runs before EVERY request and puts the student in g.user, which
      every other file uses to show and save only that student's data.
    - The users table is in schema.sql (password_hash, failed_logins, locked_until).
    - The original HTML pages (templates/auth/) still work at /auth/login and /auth/register;
      the React login screen is features/auth/AuthPage.tsx.
"""
import functools
import sqlite3
from datetime import datetime, timedelta

from flask import Blueprint, flash, g, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_db

bp = Blueprint("auth", __name__, url_prefix="/auth")

YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
MIN_PASSWORD_LENGTH = 8
MAX_FAILED_LOGINS = 5
LOCKOUT = timedelta(minutes=15)


@bp.before_app_request
def load_logged_in_user():
    """Before every request, put the logged-in user's row in g.user (or None)."""
    # The session is a cookie signed with SECRET_KEY, so a browser can't fake a user_id.
    user_id = session.get("user_id")
    g.user = None
    if user_id is not None:
        g.user = get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def login_required(view):
    """Decorator for pages that need a logged-in user; others are sent to the login page."""
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            flash("Please log in to continue.", "warning")
            return redirect(url_for("auth.login"))
        return view(**kwargs)
    return wrapped_view


def start_session(user_id):
    """Log the user in. The session expires after PERMANENT_SESSION_LIFETIME of inactivity."""
    session.clear()           # drop anything left from an earlier session
    session.permanent = True  # use the 30-minute lifetime instead of "until the browser closes"
    session["user_id"] = user_id


def validate_registration(data):
    """Check sign-up fields. Returns (values, errors); errors maps field name to message."""
    values = {
        "name": str(data.get("name", "")).strip(),
        "email": str(data.get("email", "")).strip().lower(),
        "password": str(data.get("password", "")),
        "confirm": str(data.get("confirm", "")),
        "year": str(data.get("year", "")),
    }
    errors = {}
    if not values["name"]:
        errors["name"] = "Enter your name."
    if "@" not in values["email"] or "." not in values["email"].split("@")[-1]:
        errors["email"] = "Enter a valid email address, like alexa@my.unt.edu."
    if len(values["password"]) < MIN_PASSWORD_LENGTH:
        errors["password"] = f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
    elif values["password"] != values["confirm"]:
        errors["confirm"] = "Passwords do not match. Type the same password in both boxes."
    if values["year"] not in YEARS:
        errors["year"] = "Choose your year in school."
    return values, errors


def create_user(values):
    """Save a new account from validated values. Returns the new id, or None if the email is taken."""
    db = get_db()
    try:
        # generate_password_hash scrambles the password one way; only the hash is stored,
        # never the password itself. check_password_hash compares a login attempt to it.
        cur = db.execute(
            "INSERT INTO users (name, email, password_hash, year_in_school) VALUES (?, ?, ?, ?)",
            (values["name"], values["email"], generate_password_hash(values["password"]), values["year"]),
        )
        db.commit()
    except sqlite3.IntegrityError:   # email is UNIQUE (UC-01 3a)
        return None
    return cur.lastrowid


def check_login(email, password):
    """Check a login attempt and update the failure count. Returns (user, error)."""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
    now = datetime.now()

    # Locked accounts are refused before the password is even checked.
    if user and user["locked_until"] and datetime.fromisoformat(user["locked_until"]) > now:
        minutes = int((datetime.fromisoformat(user["locked_until"]) - now).total_seconds() // 60) + 1
        return None, f"Too many failed attempts. Try again in {minutes} minute(s)."
    if user is None or not check_password_hash(user["password_hash"], password):
        if user is not None:
            # Count the failure; on the 5th, lock the account and reset the counter.
            failed = user["failed_logins"] + 1
            locked_until = None
            if failed >= MAX_FAILED_LOGINS:
                locked_until = (now + LOCKOUT).isoformat(timespec="seconds")
                failed = 0
            db.execute("UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?",
                       (failed, locked_until, user["id"]))
            db.commit()
        return None, "Email or password is incorrect."   # same message either way (UC-01 6a)

    # A successful login clears the failure count.
    db.execute("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?", (user["id"],))
    db.commit()
    return user, None


# ----- The original HTML pages (server-rendered with Jinja templates) -----
# The React app uses api/auth.py instead; these remain as a working fallback.

@bp.route("/register", methods=("GET", "POST"))
def register():
    """Create an account, then log the new user in (UC-01 part A)."""
    form = request.form
    errors = {}
    email_taken = False
    if request.method == "POST":
        values, errors = validate_registration(form)
        if not errors:
            user_id = create_user(values)
            if user_id is None:
                errors["email"] = "This email is already registered."
                email_taken = True
            else:
                start_session(user_id)
                flash(f"Welcome, {values['name']}! Your account is ready.", "success")
                return redirect(url_for("main.dashboard"))

    return render_template("auth/register.html", form=form, errors=errors,
                           email_taken=email_taken, years=YEARS)


@bp.route("/login", methods=("GET", "POST"))
def login():
    """Check email and password, locking the account after too many failures (UC-01 part B)."""
    error = None
    email = ""
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        user, error = check_login(email, request.form.get("password", ""))
        if user is not None:
            start_session(user["id"])
            return redirect(url_for("main.dashboard"))

    return render_template("auth/login.html", error=error, email=email)


@bp.route("/logout", methods=("POST",))
def logout():
    """Log out and return to the login page."""
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("auth.login"))
