# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Demo data command - Bobby (shared; covers every section).

WHAT THIS FILE DOES
    `flask --app wellness seed-demo` creates (or resets) a demo student with 14 days of
    realistic sample data in every section, plus a weekly schedule. It's used for the
    recorded demo, since My Progress needs at least 3 logged days to show tips.

HOW IT CONNECTS
    - The demo login is DEMO_EMAIL / DEMO_PASSWORD below. It is a test-only account for
      local and Replit demo databases; never reuse this password anywhere real.
    - Meals use dishes from data/food_catalog.json and are scored with api/sections/food.py,
      so demo scores match what the app calculates.
    - Keep the INSERTs below in step with schema.sql. Run it again right before recording
      to reset the demo account.
"""
import random
from datetime import date, timedelta

import click
from werkzeug.security import generate_password_hash

from .db import get_db
from .api.sections import food
from .sleep import calculate_total_hours

DEMO_EMAIL = "alexa@my.unt.edu"
DEMO_PASSWORD = "wellness123"   # test-only credential for the local demo database

# Demo meal choices per meal type. Each choice is a list of (dish id, portion id or quantity)
# from data/food_catalog.json; each dish uses its usual ingredients from the catalog.
# "balanced" meals are used more in the most recent week, so Compare Routines shows progress.
SAMPLE_MEALS = {
    "Breakfast": {"balanced": [[("oatmeal", "small_bowl")], [("eggs_toast", "small_plate")]],
                  "quick": [[("pancakes", 2)], [("cereal", "small_bowl"), ("coffee", "small_cup")], [("bagel", 1)]]},
    "Lunch": {"balanced": [[("burrito_bowl", "large_bowl")], [("caesar_salad", "large_bowl")],
                           [("turkey_sandwich", 1), ("chips", "snack")]],
              "quick": [[("pizza", 2), ("soda", "small_cup")], [("tacos", 3), ("nachos", "small_plate")]]},
    "Dinner": {"balanced": [[("grilled_chicken_plate", "medium_plate")], [("stir_fry", "large_bowl")], [("sushi", 8)]],
               "quick": [[("burger", 1), ("fries", "small_plate")], [("spaghetti", "medium_plate")]]},
}

# Compare Routines compares the last 7 days (ending today) with the 7 days before that. The demo
# student builds better habits in the recent week: more sleep, less stress, more movement and
# better meals, while screen time creeps up a little, so the comparison isn't all good news.
RECENT_DAYS = 6   # days ago 1-6 (today stays empty so the demo can check in live)


def seed_demo(days=14):
    """Recreate the demo account with `days` of entries ending yesterday."""
    db = get_db()
    rng = random.Random(9)   # fixed seed: the same demo data every run
    db.execute("DELETE FROM users WHERE email = ?", (DEMO_EMAIL,))   # cascades to all entries
    user_id = db.execute(
        "INSERT INTO users (name, email, password_hash, year_in_school) VALUES (?, ?, ?, ?)",
        ("Alexa", DEMO_EMAIL, generate_password_hash(DEMO_PASSWORD), "Sophomore"),
    ).lastrowid

    dishes = food.dishes_by_id(food.load_catalog())
    for offset in range(1, days + 1):
        day = (date.today() - timedelta(days=offset)).isoformat()
        recent = offset <= RECENT_DAYS

        # Sleep: earlier, steadier bedtimes in the recent week (about 7.5-9 hours vs 5.5-7.5).
        if recent:
            bedtime = rng.choice(["22:30", "22:45", "23:00", "23:15"])
            wake = rng.choice(["07:00", "07:15", "07:30"])
        else:
            bedtime = rng.choice(["23:45", "00:15", "00:30", "01:00"])
            wake = rng.choice(["06:30", "06:45", "07:15"])
        quality = rng.randint(3, 5) if recent else rng.randint(2, 4)
        db.execute("INSERT INTO sleep_entries (user_id, entry_date, bedtime, wake_time, quality, total_hours)"
                   " VALUES (?, ?, ?, ?, ?, ?)",
                   (user_id, day, bedtime, wake, quality, calculate_total_hours(bedtime, wake)))

        # Stress: mostly 2-3 recently, 3-4 the week before (never 3 days of 4+ in a row near today).
        level = rng.choice([2, 2, 3, 3, 3]) if recent else rng.choice([3, 3, 4, 4, 5])
        db.execute("INSERT INTO stress_checkins (user_id, entry_date, stress_level, answers) VALUES (?, ?, ?, ?)",
                   (user_id, day, level, "".join(rng.choice("YN") for _ in range(5))))

        # Movement: most recent days have activity; the week before, about one day in three.
        if rng.random() < (0.85 if recent else 0.35):
            db.execute("INSERT INTO exercise_entries (user_id, entry_date, activity_type, duration_minutes)"
                       " VALUES (?, ?, ?, ?)",
                       (user_id, day, rng.choice(["Walking", "Gym", "Running", "Yoga"]),
                        rng.choice([30, 45, 60] if recent else [20, 30])))

        meals = []
        for meal_type, time in (("Breakfast", "08:15"), ("Lunch", "12:30"), ("Dinner", "18:45")):
            kind = "balanced" if rng.random() < (0.8 if recent else 0.3) else "quick"
            items = []
            for dish_id, amount in rng.choice(SAMPLE_MEALS[meal_type][kind]):
                dish = dishes[dish_id]
                items.append({"dish": dish_id, "ingredients": dish["ingredients"],
                              "portion": amount if isinstance(amount, str) else None,
                              "quantity": amount if isinstance(amount, int) else None})
            meals.append({"time": time, "mealType": meal_type, "items": items})
        clean, errors = food.validate({"meals": meals})
        assert not errors, errors
        clean["water"] = 0   # water is added just below
        food.save(db, user_id, day, clean)
        db.execute("INSERT INTO water_intake (user_id, entry_date, cups) VALUES (?, ?, ?)",
                   (user_id, day, rng.randint(3, 8)))

        db.execute("INSERT INTO screen_time_entries (user_id, entry_date, hours) VALUES (?, ?, ?)",
                   (user_id, day, round(rng.uniform(6.5, 7.5) if recent else rng.uniform(4.5, 6.5), 1)))

    for name, item_type, days_of_week, start, end, location, color in (
        ("CSCE 3444", "Class", "Mon,Wed", "11:30", "12:50", "Discovery Park B185", "#82a28a"),
        ("MATH 2700", "Class", "Tue,Thu", "09:30", "10:50", "GAB 105", "#d2a957"),
        ("Study group", "Study", "Tue,Thu", "15:00", "16:30", "Willis Library", "#7d9aa0"),
        ("Library shift", "Work", "Fri", "13:00", "17:00", "Willis Library", "#d88b72"),
    ):
        db.execute("INSERT INTO schedule_items (user_id, name, item_type, days, start_time, end_time, location, color)"
                   " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                   (user_id, name, item_type, days_of_week, start, end, location, color))

    db.execute("INSERT INTO daily_notes (user_id, entry_date, note) VALUES (?, ?, ?)",
               (user_id, (date.today() - timedelta(days=1)).isoformat(), "Finished my lab report early."))

    db.commit()


@click.command("seed-demo")
def seed_demo_command():
    """Create (or reset) the demo student account with sample data."""
    seed_demo()
    click.echo(f"Demo account ready: {DEMO_EMAIL}")


def init_app(app):
    """Register the seed-demo command with the app."""
    app.cli.add_command(seed_demo_command)
