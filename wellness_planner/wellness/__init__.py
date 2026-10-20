# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Student Wellness Planner backend: the application factory - Bobby (integration).

WHAT THIS FILE DOES
    create_app() builds the Flask app: loads the settings (secret key, database path,
    session rules), connects the database and demo-data commands, and registers every
    feature's routes. Flask calls it when you run: flask --app wellness run

HOW IT CONNECTS
    - db.py (database), seed.py (demo data), auth.py (accounts) are set up here.
    - main.py, sleep.py and progress.py are the original server-rendered HTML pages.
    - api/ is the JSON API the React front end uses (wellness_frontend); every route
      there starts with /api.
    - tests/conftest.py calls create_app(test_config) to use a temporary database.
"""
import os
from datetime import timedelta

from flask import Flask


def create_app(test_config=None):
    """Create and configure the app. Tests pass test_config to use a temporary database."""
    # instance_relative_config: the database lives in the instance/ folder, which isn't committed.
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        # SECRET_KEY signs the login cookie. The fallback is only for local development;
        # Replit's start.sh sets a random one.
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-change-me"),
        DATABASE=os.path.join(app.instance_path, "wellness.sqlite"),
        # NFR 6.2: log out after 30 minutes of inactivity (refreshed on every request).
        PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
        SESSION_COOKIE_HTTPONLY=True,     # page scripts can't read the login cookie
        SESSION_COOKIE_SAMESITE="Lax",    # other websites can't send it along with their requests
        # TEMPORARY: show the demo account's login on the login screen (for teammates,
        # instructors and testers). Set SHOW_DEMO_LOGIN=0 to hide it; turn it off before deploying.
        SHOW_DEMO_LOGIN=os.environ.get("SHOW_DEMO_LOGIN", "1") != "0",
    )
    # On Replit the app is shown inside replit.com's preview frame, which browsers treat as a
    # different site; the login cookie must be SameSite=None + Secure or it isn't sent there.
    # (Replit sets REPL_ID. Mutating requests are still JSON-only, so CSRF protection holds.)
    if os.environ.get("REPL_ID"):
        app.config.update(SESSION_COOKIE_SAMESITE="None", SESSION_COOKIE_SECURE=True)
    if test_config:
        app.config.update(test_config)

    os.makedirs(app.instance_path, exist_ok=True)

    from . import db, seed
    db.init_app(app)
    seed.init_app(app)

    from . import auth, main, progress, sleep
    app.register_blueprint(auth.bp)
    app.register_blueprint(main.bp)
    app.register_blueprint(sleep.bp)
    app.register_blueprint(progress.bp)

    # JSON API for the React front end (wellness_frontend); every route starts with /api.
    from .api import register_api
    register_api(app)

    # Teammates' features (schedule, stress, food, exercise, screen time, compare) are API
    # modules under api/; they're registered in api/__init__.py, not here.

    return app
