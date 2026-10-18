"""Food section (FR-06 / UC-06) - Malika.

WHAT THIS FILE DOES
    Saves and loads the day's meals and cups of water. Each meal is made of dishes the
    student picked with pictures (no typing): a dish, its ingredients, and how much
    (a count like "3 tacos", or a size like "medium plate"). It also scores each meal.

HOW IT CONNECTS
    - api/days.py calls load/validate/save/delete like every section, and sends
      load_catalog() to the browser through GET /api/days/options.
    - The foods themselves live in data/food_catalog.json (NFR 6.5: content kept outside
      the code): cuisines -> dishes -> ingredients, each ingredient's food group and points,
      and each dish's portion rule.
    - The data lives in three tables (wellness/schema.sql): food_entries (one row per meal),
      food_items (one row per dish in a meal), and water_intake (one row per day).
    - progress.py averages the meal scores for My Progress; compare.py compares two weeks.
    - The front end is features/daily-log/MealsSection.tsx and the food/ folder (FoodPicker).
      food/catalog.ts calculates the same scores in the browser as a preview.

SCORES (3 = healthiest)
    dish score  = average points of its ingredients' food groups (portion size doesn't change it)
    meal score  = average of its dishes' scores
    daily score = average of the day's meal scores (progress.py computes it the same way)

THE DATA SHAPE THE BROWSER SENDS (scores are added by the server):
    {"meals": [{"time": "12:30", "mealType": "Lunch", "note": "",
                "items": [{"dish": "tacos", "ingredients": ["corn_tortilla", "beef"],
                           "portion": null, "quantity": 3}]}],
     "water": 6}
"""
import json
import math
from pathlib import Path

from ..helpers import TIME_PATTERN

# parents[2] goes up from api/sections/ to the wellness/ folder, where data/ lives.
CATALOG_FILE = Path(__file__).resolve().parents[2] / "data" / "food_catalog.json"
MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"]
MAX_MEALS = 10
MAX_ITEMS_PER_MEAL = 8
MAX_WATER_CUPS = 30


def round1(value):
    """Round to 1 decimal with halves going up (2.65 -> 2.7), matching the browser's preview.
    Python's round() would give 2.6 here because of how decimals are stored."""
    return math.floor(value * 10 + 0.5 + 1e-9) / 10


def load_catalog():
    """The whole food catalog, as sent to the browser (read fresh so edits apply without a restart)."""
    with CATALOG_FILE.open(encoding="utf-8") as f:
        catalog = json.load(f)
    catalog.pop("_note", None)   # "_note" is a comment for people editing the JSON file
    return catalog


def dishes_by_id(catalog):
    """Every dish from every cuisine in one lookup: {"tacos": {...}, "nachos": {...}}."""
    return {dish["id"]: dish for cuisine in catalog["cuisines"] for dish in cuisine["dishes"]}


def dish_score(catalog, ingredient_ids):
    """Average points of the ingredients' food groups."""
    # ingredient id -> its food group -> that group's points, e.g. "spinach" -> "vegetables" -> 3.
    points = [catalog["foodGroups"][catalog["ingredients"][i]["group"]]["points"] for i in ingredient_ids]
    return round1(sum(points) / len(points))


def load(db, user_id, day):
    """Return that day's meals, water and daily score, or None if nothing was saved."""
    meals = []
    # COALESCE(meal_time, '') puts meals without a time first, then the rest in time order.
    rows = db.execute("SELECT id, meal_time, meal_type, meal_score, note FROM food_entries"
                      " WHERE user_id = ? AND entry_date = ? ORDER BY COALESCE(meal_time, ''), id",
                      (user_id, day)).fetchall()
    for row in rows:
        # Each meal's dishes are in food_items, linked by meal_id; ingredients are stored
        # as comma-separated text ("corn_tortilla,beef") and split back into a list here.
        items = db.execute("SELECT dish, ingredients, portion, quantity, score FROM food_items"
                           " WHERE meal_id = ? ORDER BY position", (row["id"],)).fetchall()
        meals.append({
            "time": row["meal_time"] or "", "mealType": row["meal_type"], "score": row["meal_score"],
            "note": row["note"] or "",
            "items": [{"dish": i["dish"], "ingredients": i["ingredients"].split(","), "portion": i["portion"],
                       "quantity": i["quantity"], "score": i["score"]} for i in items],
        })
    water = db.execute("SELECT cups FROM water_intake WHERE user_id = ? AND entry_date = ?",
                       (user_id, day)).fetchone()
    if not meals and water is None:
        return None
    scores = [m["score"] for m in meals]
    return {"meals": meals, "water": water["cups"] if water else 0,
            "dailyScore": round1(sum(scores) / len(scores)) if scores else None}


def validate_item(catalog, dishes, item, prefix, errors):
    """Check one dish in a meal. Adds messages to `errors` and returns the cleaned item (or None)."""
    dish = dishes.get(item.get("dish"))
    if dish is None:
        errors[prefix] = "Pick a dish from the list."
        return None
    ingredients = item.get("ingredients") or []
    if not ingredients or any(i not in catalog["ingredients"] for i in ingredients):
        errors[prefix] = f"Pick at least one ingredient for your {dish['label'].lower()}."
        return None

    # The dish's portion rule says how "how much" is answered: a count (tacos) or a size (nachos).
    rule = dish["portion"]
    portion, quantity = None, None
    if rule["type"] == "count":
        quantity = item.get("quantity")
        if not isinstance(quantity, int) or isinstance(quantity, bool) or not 1 <= quantity <= rule["max"]:
            errors[prefix] = f"Choose how many {rule['unit']} (1 to {rule['max']})."
            return None
    else:
        portion = item.get("portion")
        if portion not in rule["options"]:
            errors[prefix] = f"Choose a portion size for your {dish['label'].lower()}."
            return None

    unique = list(dict.fromkeys(ingredients))   # drop duplicates, keep order
    return {"dish": dish["id"], "ingredients": unique, "portion": portion, "quantity": quantity,
            "score": dish_score(catalog, unique)}


def validate(data):
    """Check the meals and water. Returns (clean, errors) like every section.
    Error keys point at the exact spot, e.g. "mealType.0" (first meal) or "item.1.0"
    (second meal, first dish), so the page can show each message in the right place."""
    if not data:
        return None, {}
    meals = data.get("meals") or []
    water = data.get("water") or 0
    if not meals and not water:
        return None, {}   # nothing logged today
    errors = {}
    if not isinstance(meals, list) or len(meals) > MAX_MEALS:
        return None, {"meals": f"Add up to {MAX_MEALS} meals."}

    catalog = load_catalog()
    dishes = dishes_by_id(catalog)
    clean_meals = []
    for i, meal in enumerate(meals):
        time = str(meal.get("time") or "")
        meal_type = meal.get("mealType")
        items = meal.get("items") or []
        note = str(meal.get("note") or "").strip()
        if time and not TIME_PATTERN.match(time):
            errors[f"time.{i}"] = "Use a time like 12:30, or leave it blank."
        if meal_type not in MEAL_TYPES:
            errors[f"mealType.{i}"] = "Choose breakfast, lunch, dinner, or snack."             # UC-06 4a
        if not items:
            errors[f"items.{i}"] = "Add at least one food to this meal."                       # UC-06 4a
        elif len(items) > MAX_ITEMS_PER_MEAL:
            errors[f"items.{i}"] = f"Add up to {MAX_ITEMS_PER_MEAL} foods per meal."
        if len(note) > 200:
            errors[f"note.{i}"] = "Keep the note under 200 characters."
        clean_items = [validate_item(catalog, dishes, item, f"item.{i}.{j}", errors)
                       for j, item in enumerate(items[:MAX_ITEMS_PER_MEAL])]
        clean_meals.append({"time": time, "mealType": meal_type, "items": clean_items, "note": note})

    if not isinstance(water, int) or isinstance(water, bool) or not 0 <= water <= MAX_WATER_CUPS:
        errors["water"] = f"Water must be between 0 and {MAX_WATER_CUPS} cups."
    if errors:
        return None, errors

    # Everything is valid: add each meal's score and the list of food groups it included.
    for meal in clean_meals:
        scores = [item["score"] for item in meal["items"]]
        meal["score"] = round1(sum(scores) / len(scores))
        groups = {catalog["ingredients"][i]["group"] for item in meal["items"] for i in item["ingredients"]}
        meal["groups"] = sorted(groups)
    return {"meals": clean_meals, "water": water}, {}


def save(db, user_id, day, clean):
    """Replace that day's meals and water (days.py commits afterwards)."""
    delete(db, user_id, day)
    for meal in clean["meals"]:
        # lastrowid is the id SQLite gave the new meal row; its dishes point back to it.
        meal_id = db.execute(
            "INSERT INTO food_entries (user_id, entry_date, meal_time, meal_type, categories, meal_score, note)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, day, meal["time"] or None, meal["mealType"], ",".join(meal["groups"]),
             meal["score"], meal["note"] or None)).lastrowid
        for position, item in enumerate(meal["items"]):
            db.execute("INSERT INTO food_items (meal_id, position, dish, ingredients, portion, quantity, score)"
                       " VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (meal_id, position, item["dish"], ",".join(item["ingredients"]), item["portion"],
                        item["quantity"], item["score"]))
    if clean["water"]:
        db.execute("INSERT INTO water_intake (user_id, entry_date, cups) VALUES (?, ?, ?)",
                   (user_id, day, clean["water"]))


def delete(db, user_id, day):
    """Remove that day's meals and water."""
    # Deleting a meal also deletes its food_items (ON DELETE CASCADE in schema.sql).
    db.execute("DELETE FROM food_entries WHERE user_id = ? AND entry_date = ?", (user_id, day))
    db.execute("DELETE FROM water_intake WHERE user_id = ? AND entry_date = ?", (user_id, day))
