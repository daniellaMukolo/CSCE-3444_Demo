"""JSON API package - Bobby (integration).

WHAT THIS FILE DOES
    Groups every API module under one address prefix, /api, so the React front end
    (wellness_frontend) talks to the server through addresses like /api/days/2026-10-17.
    It also enforces one security rule for the whole API and returns errors as JSON.

HOW IT CONNECTS
    - create_app() in wellness/__init__.py calls register_api(app) once at startup.
    - Each feature has its own module and blueprint (a blueprint is a named group of routes):
        auth.py (Bobby), days.py (shared), schedule.py (Malika), progress.py (Bobby),
        compare.py (Daniella)
    - The front end's lib/api/*.ts files call these addresses.
"""
from flask import Blueprint, jsonify, request
from werkzeug.exceptions import HTTPException

from . import auth, compare, days, progress, schedule

api = Blueprint("api", __name__, url_prefix="/api")


@api.before_request
def require_json_for_changes():
    """Changes must be sent as JSON. Browsers can't send cross-site JSON with cookies,
    so this (with SameSite cookies) protects against cross-site request forgery."""
    # before_request runs before every /api route; returning a response here stops the request.
    if request.method in ("POST", "PUT", "DELETE") and not request.is_json:
        return jsonify(error="Send this request as JSON."), 415


# Put each feature's routes under /api (e.g. days.bp has url_prefix "/days" -> /api/days).
for module in (auth, days, schedule, progress, compare):
    api.register_blueprint(module.bp)


def register_api(app):
    """Attach the API to the app and return JSON (not HTML) errors for /api addresses."""
    app.register_blueprint(api)

    # abort(404, description="...") anywhere in the API becomes {"error": "..."} with status 404,
    # which lib/api/client.ts turns into a friendly message on the page.
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        if request.path.startswith("/api/"):
            return jsonify(error=error.description), error.code
        return error
