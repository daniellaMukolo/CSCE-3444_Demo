"""Demo data command - Bobby (shared; covers every section).

WHAT THIS FILE DOES
    `flask --app wellness seed-demo` creates (or resets) a demo student with 14 days of
    realistic sample data in every section added so far. It's used for the
    recorded demo, since My Progress needs at least 3 logged days to show tips.

HOW IT CONNECTS
    - The demo login is DEMO_EMAIL / DEMO_PASSWORD below. It is a test-only account for
      local and Replit demo databases; never reuse this password anywhere real.
    - Teammates: add sample rows for your section inside seed_demo() (marked below), so
      the demo account shows your feature.
    - Keep the INSERTs below in step with schema.sql. Run it again right before recording
      to reset the demo account.
"""
import random
from datetime import date, timedelta

import click
from werkzeug.security import generate_password_hash

from .db import get_db
from .sleep import calculate_total_hours

DEMO_EMAIL = "alexa@my.unt.edu"
DEMO_PASSWORD = "wellness123"   # test-only credential for the local demo database


def seed_demo(days=14):
    """Recreate the demo account with `days` of entries ending yesterday."""
    db = get_db()
    rng = random.Random(9)   # fixed seed: the same demo data every run
    db.execute("DELETE FROM users WHERE email = ?", (DEMO_EMAIL,))   # cascades to all entries
    user_id = db.execute(
        "INSERT INTO users (name, email, password_hash, year_in_school) VALUES (?, ?, ?, ?)",
        ("Alexa", DEMO_EMAIL, generate_password_hash(DEMO_PASSWORD), "Sophomore"),
    ).lastrowid

    for offset in range(1, days + 1):
        day = (date.today() - timedelta(days=offset)).isoformat()

        bedtime = f"{rng.choice([22, 23, 0, 1]):02d}:{rng.choice([0, 15, 30, 45]):02d}"
        wake = f"{rng.choice([6, 7, 8]):02d}:{rng.choice([0, 15, 30, 45]):02d}"
        db.execute("INSERT INTO sleep_entries (user_id, entry_date, bedtime, wake_time, quality, total_hours)"
                   " VALUES (?, ?, ?, ?, ?, ?)",
                   (user_id, day, bedtime, wake, rng.randint(2, 5), calculate_total_hours(bedtime, wake)))

        # Teammates: add your section's sample rows for `day` here
        # (stress check-ins, exercise, meals and water, screen time).

    # Teammates: add the demo student's weekly schedule items here.

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
