# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Database connection - Bobby (shared by every feature).

WHAT THIS FILE DOES
    Opens the SQLite database for each request and closes it afterward, and adds the
    `flask --app wellness init-db` command that creates fresh, empty tables.

HOW IT CONNECTS
    - Every feature reads and saves data through get_db(); nobody opens the file directly.
    - The tables are defined in schema.sql. The database file itself is
      instance/wellness.sqlite (its path is set in wellness/__init__.py). It is never
      committed to GitHub, because it holds each person's local data.
    - init_app() is called once from create_app() in wellness/__init__.py.
"""
import sqlite3

import click
from flask import current_app, g


def get_db():
    """Return this request's database connection, opening it on first use."""
    # `g` is Flask's per-request storage: one connection is shared by everything in a
    # request and thrown away when the request ends.
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row            # read columns by name: row["email"]
        g.db.execute("PRAGMA foreign_keys = ON")  # needed for ON DELETE CASCADE
    return g.db


def close_db(e=None):
    """Close the connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Drop and recreate every table from schema.sql."""
    db = get_db()
    with current_app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf-8"))


@click.command("init-db")
def init_db_command():
    """Delete all data and create fresh tables."""
    init_db()
    click.echo("Initialized the database.")


def init_app(app):
    """Register the cleanup hook and the init-db command with the app."""
    app.teardown_appcontext(close_db)   # run close_db after every request
    app.cli.add_command(init_db_command)
