# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Sleep tracking (FR-02 / UC-02) - Bobby.

WHAT THIS FILE DOES
    1. calculate_total_hours(): the sleep-hours rule, used everywhere (handles sleep that
       crosses midnight). LONG_SLEEP_HOURS is the "are those times right?" limit (UC-02 5a).
    2. The original server-rendered sleep pages (templates/sleep/): add, edit and delete
       sleep entries at /sleep. The React app replaced them with the Daily log page.

HOW IT CONNECTS
    - api/sections/sleep.py (used by the React Daily log) imports calculate_total_hours
      and LONG_SLEEP_HOURS from here, so both versions use the same rule.
    - seed.py uses calculate_total_hours for the demo data.
    - progress.py reads sleep_entries.total_hours for My Progress.
    - Pattern used by these pages: read_form() validates input, get_own_entry() enforces
      ownership, and successful POSTs redirect with a flash message.
"""
from datetime import date, datetime, timedelta

from flask import Blueprint, abort, flash, g, redirect, render_template, request, url_for

from .auth import login_required
from .db import get_db

bp = Blueprint("sleep", __name__, url_prefix="/sleep")

LONG_SLEEP_HOURS = 16   # UC-02 5a: ask the student to confirm anything longer


def calculate_total_hours(bedtime, wake_time):
    """Hours between two 'HH:MM' times. If wake time is not after bedtime, the sleep crossed midnight."""
    bed = datetime.strptime(bedtime, "%H:%M")      # "23:30" -> a time on a placeholder date
    wake = datetime.strptime(wake_time, "%H:%M")
    if wake <= bed:
        wake += timedelta(days=1)                   # e.g. 23:30 -> 07:00 means the next morning
    return round((wake - bed).total_seconds() / 3600, 2)   # seconds -> hours, 2 decimals


# ----- The original HTML sleep pages -----

def read_form(form):
    """Validate the sleep form. Returns (values, errors); errors maps field name to message."""
    values = {key: form.get(key, "").strip() for key in ("entry_date", "bedtime", "wake_time", "quality")}
    errors = {}

    try:
        if date.fromisoformat(values["entry_date"]) > date.today():
            errors["entry_date"] = "The date can't be in the future. Pick today or an earlier date."
            values["entry_date"] = date.today().isoformat()          # UC-02 3a
    except ValueError:
        errors["entry_date"] = "Pick a date for this entry."

    for key, label, example in (("bedtime", "bedtime", "11:30 PM"), ("wake_time", "wake time", "7:00 AM")):
        try:
            datetime.strptime(values[key], "%H:%M")
        except ValueError:
            errors[key] = f"Enter your {label}, for example {example}."   # UC-02 4a

    if values["quality"] and values["quality"] not in {"1", "2", "3", "4", "5"}:
        errors["quality"] = "Choose a rating from 1 to 5, or leave it blank."

    if not errors:
        values["total_hours"] = calculate_total_hours(values["bedtime"], values["wake_time"])
    return values, errors


def confirmation_needed(values, existing_entry, form):
    """Return 'long' or 'replace' if the student must confirm first, else None.

    The template adds a hidden confirm_long / confirm_replace field when it asks,
    so the next submit carries the student's answer.
    """
    if values["total_hours"] > LONG_SLEEP_HOURS and not form.get("confirm_long"):
        return "long"       # UC-02 5a
    if existing_entry is not None and not form.get("confirm_replace"):
        return "replace"    # UC-02 4b
    return None


def save_entry(db, values, entry_id=None):
    """Insert a new entry, or update entry_id if given."""
    quality = int(values["quality"]) if values["quality"] else None
    params = (values["entry_date"], values["bedtime"], values["wake_time"], quality, values["total_hours"])
    if entry_id is None:
        db.execute("INSERT INTO sleep_entries (entry_date, bedtime, wake_time, quality, total_hours, user_id)"
                   " VALUES (?, ?, ?, ?, ?, ?)", params + (g.user["id"],))
    else:
        db.execute("UPDATE sleep_entries SET entry_date = ?, bedtime = ?, wake_time = ?, quality = ?, total_hours = ?"
                   " WHERE id = ? AND user_id = ?", params + (entry_id, g.user["id"]))
    db.commit()


def get_own_entry(entry_id):
    """Load an entry only if it belongs to the logged-in user; otherwise 404 (NFR 6.2)."""
    entry = get_db().execute("SELECT * FROM sleep_entries WHERE id = ? AND user_id = ?",
                             (entry_id, g.user["id"])).fetchone()
    if entry is None:
        abort(404)
    return entry


@bp.route("/", methods=("GET", "POST"))
@login_required
def index():
    """Sleep page: GET shows the form and history; POST saves a new entry."""
    db = get_db()
    values = {"entry_date": date.today().isoformat(), "bedtime": "", "wake_time": "", "quality": ""}
    errors, prompt = {}, None

    if request.method == "POST":
        values, errors = read_form(request.form)
        if not errors:
            existing = db.execute("SELECT id FROM sleep_entries WHERE user_id = ? AND entry_date = ?",
                                  (g.user["id"], values["entry_date"])).fetchone()
            prompt = confirmation_needed(values, existing, request.form)
            if prompt is None:
                save_entry(db, values, existing["id"] if existing else None)
                flash(f"Saved {values['total_hours']} hours of sleep for {values['entry_date']}.", "success")
                return redirect(url_for("sleep.index"))

    history = db.execute("SELECT * FROM sleep_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 30",
                         (g.user["id"],)).fetchall()
    return render_template("sleep/index.html", values=values, errors=errors, prompt=prompt,
                           history=history, today=date.today().isoformat())


@bp.route("/<int:entry_id>/edit", methods=("GET", "POST"))
@login_required
def edit(entry_id):
    """Edit an earlier entry (UC-02 1a)."""
    entry = get_own_entry(entry_id)
    values = {**dict(entry), "quality": str(entry["quality"] or "")}
    errors, prompt = {}, None

    if request.method == "POST":
        values, errors = read_form(request.form)
        if not errors:
            db = get_db()
            clash = db.execute("SELECT id FROM sleep_entries WHERE user_id = ? AND entry_date = ? AND id != ?",
                               (g.user["id"], values["entry_date"], entry_id)).fetchone()
            if clash:
                errors["entry_date"] = "You already have a sleep entry for that date. Edit that one instead."
            else:
                prompt = confirmation_needed(values, None, request.form)
                if prompt is None:
                    save_entry(db, values, entry_id)
                    flash("Sleep entry updated.", "success")
                    return redirect(url_for("sleep.index"))

    return render_template("sleep/edit.html", entry=entry, values=values, errors=errors, prompt=prompt,
                           today=date.today().isoformat())


@bp.route("/<int:entry_id>/delete", methods=("POST",))
@login_required
def delete(entry_id):
    """Delete an entry (UC-02 1a). The page asks for confirmation before submitting."""
    get_own_entry(entry_id)
    db = get_db()
    db.execute("DELETE FROM sleep_entries WHERE id = ? AND user_id = ?", (entry_id, g.user["id"]))
    db.commit()
    flash("Sleep entry deleted.", "info")
    return redirect(url_for("sleep.index"))
