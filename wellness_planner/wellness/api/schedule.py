"""Weekly schedule API (FR-04 / UC-04) - Malika.

WHAT THIS FILE DOES
    Lists, adds, edits and deletes the student's weekly schedule items (classes, work,
    study time). An item can repeat on several days, e.g. "CSCE 3444, Mon/Wed, 10:00-11:20".
    If a new item overlaps another on the same day, it warns first (UC-04 6a).

HOW IT CONNECTS
    - The data lives in the schedule_items table (wellness/schema.sql). The days are
      stored as text like "Mon,Wed"; item_json() turns them back into a list.
    - The front end calls these addresses through lib/api/schedule.ts:
      features/schedule/SchedulePage.tsx (My week) and the Today page's schedule card.
    - Overlaps return 409 {"warning": "overlap", "conflicts": [...]}; the page asks the
      student, then resends with "allowOverlap": true to save anyway.

ADDRESSES (all start with /api/schedule)
    GET ""   POST ""   PUT /<id>   DELETE /<id>

THE DATA SHAPE THE BROWSER SENDS AND RECEIVES:
    {"name": "CSCE 3444", "itemType": "Class", "days": ["Mon", "Wed"],
     "startTime": "10:00", "endTime": "11:20", "location": "NTDP B190", "color": "#7fa58a"}
"""
import re

from flask import Blueprint, abort, g, jsonify, request

from ..db import get_db
from .helpers import TIME_PATTERN, api_login_required

bp = Blueprint("api_schedule", __name__, url_prefix="/schedule")

DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
ITEM_TYPES = ["Class", "Work", "Study", "Other"]
COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")   # a hex color like "#7fa58a"


def item_json(row):
    """Turn a database row into the JSON shape the front end uses (camelCase names, days as a list)."""
    return {"id": row["id"], "name": row["name"], "itemType": row["item_type"],
            "days": row["days"].split(","), "startTime": row["start_time"], "endTime": row["end_time"],
            "location": row["location"] or "", "color": row["color"] or ""}


def validate(data):
    """Check an item from the form. Returns (clean, errors)."""
    name = str(data.get("name", "")).strip()
    item_type = data.get("itemType")
    days = data.get("days") or []
    start = str(data.get("startTime", ""))
    end = str(data.get("endTime", ""))
    location = str(data.get("location") or "").strip()
    color = str(data.get("color") or "")
    errors = {}
    if not name or len(name) > 80:
        errors["name"] = "Add a name for this item (up to 80 characters)."           # UC-04 5a
    if item_type not in ITEM_TYPES:
        errors["itemType"] = "Choose Class, Work, Study, or Other."
    if not days or any(d not in DAYS for d in days):
        errors["days"] = "Pick at least one day of the week."
    if not TIME_PATTERN.match(start):
        errors["startTime"] = "Enter a start time."
    if not TIME_PATTERN.match(end):
        errors["endTime"] = "Enter an end time."
    # 'HH:MM' text compares correctly as text ("09:30" < "10:00"), so no time conversion is needed.
    elif TIME_PATTERN.match(start) and end <= start:
        errors["endTime"] = "End time needs to be later than start time."           # UC-04 5b
    if len(location) > 100:
        errors["location"] = "Keep the location under 100 characters."
    if color and not COLOR_PATTERN.match(color):
        errors["color"] = "Choose one of the color markers."
    if errors:
        return None, errors
    ordered_days = [d for d in DAYS if d in days]   # keep Sun..Sat order, drop duplicates
    return {"name": name, "item_type": item_type, "days": ",".join(ordered_days), "start_time": start,
            "end_time": end, "location": location or None, "color": color or None}, {}


def find_overlaps(db, clean, exclude_id=None):
    """Names of the user's other items that share a day and overlap in time."""
    conflicts = []
    # When editing, leave the item itself out (exclude_id) so it doesn't "overlap" with itself.
    rows = db.execute("SELECT * FROM schedule_items WHERE user_id = ? AND id != ?",
                      (g.user["id"], exclude_id or 0)).fetchall()
    new_days = set(clean["days"].split(","))
    for row in rows:
        # `&` between two sets keeps the days they have in common, e.g. {"Mon","Wed"} & {"Wed"} = {"Wed"}.
        shares_day = new_days & set(row["days"].split(","))
        # Two time ranges overlap when each one starts before the other one ends.
        if shares_day and clean["start_time"] < row["end_time"] and row["start_time"] < clean["end_time"]:
            conflicts.append(row["name"])
    return conflicts


def get_own_item(item_id):
    """The item with this id if it belongs to the logged-in student; otherwise stop with 404.
    Checking user_id means nobody can edit or delete another student's items by guessing ids."""
    row = get_db().execute("SELECT * FROM schedule_items WHERE id = ? AND user_id = ?",
                           (item_id, g.user["id"])).fetchone()
    if row is None:
        abort(404, description="That schedule item wasn't found.")
    return row


def save_item(item_id=None):
    """Shared by add and edit: validate, check overlaps, then insert or update."""
    is_new = item_id is None
    data = request.get_json(silent=True) or {}
    clean, errors = validate(data)
    if errors:
        return jsonify(errors=errors), 400
    db = get_db()
    conflicts = find_overlaps(db, clean, item_id)
    if conflicts and not data.get("allowOverlap"):
        return jsonify(warning="overlap", conflicts=conflicts), 409
    values = (clean["name"], clean["item_type"], clean["days"], clean["start_time"], clean["end_time"],
              clean["location"], clean["color"])
    if item_id is None:
        item_id = db.execute("INSERT INTO schedule_items (name, item_type, days, start_time, end_time, location,"
                             " color, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", values + (g.user["id"],)).lastrowid
    else:
        db.execute("UPDATE schedule_items SET name = ?, item_type = ?, days = ?, start_time = ?, end_time = ?,"
                   " location = ?, color = ? WHERE id = ? AND user_id = ?", values + (item_id, g.user["id"]))
    db.commit()
    return jsonify(item=item_json(get_own_item(item_id))), 201 if is_new else 200


@bp.get("")
@api_login_required
def list_items():
    """All of the student's items, earliest first, plus the day and type choices for the form."""
    rows = get_db().execute("SELECT * FROM schedule_items WHERE user_id = ? ORDER BY start_time, name",
                            (g.user["id"],)).fetchall()
    return jsonify(items=[item_json(r) for r in rows], days=DAYS, itemTypes=ITEM_TYPES)


@bp.post("")
@api_login_required
def add_item():
    """Add a new item (201 when created)."""
    return save_item()


@bp.put("/<int:item_id>")
@api_login_required
def edit_item(item_id):
    """Change an existing item. <int:item_id> in the address only accepts whole numbers."""
    get_own_item(item_id)   # 404 unless it's this student's item
    return save_item(item_id)


@bp.delete("/<int:item_id>")
@api_login_required
def delete_item(item_id):
    """Delete one item."""
    get_own_item(item_id)   # 404 unless it's this student's item
    db = get_db()
    db.execute("DELETE FROM schedule_items WHERE id = ? AND user_id = ?", (item_id, g.user["id"]))
    db.commit()
    return jsonify(ok=True)
