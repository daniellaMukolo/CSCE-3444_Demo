# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Tests for accounts (auth.py, UC-01) and the NFR 6.2 security rules - Bobby."""
from wellness.db import get_db

from .conftest import register


def test_register_stores_hashed_password(client, app):
    response = register(client)
    assert response.headers["Location"] == "/dashboard"
    with app.app_context():
        user = get_db().execute("SELECT * FROM users").fetchone()
    assert user["password_hash"] != "wellness123"


def test_short_password_rejected(client):
    response = register(client, password="short")
    assert b"at least 8 characters" in response.data


def test_duplicate_email_offers_login(client):
    register(client)
    client.post("/auth/logout")
    response = register(client)
    assert b"already registered" in response.data
    assert b"Log in instead" in response.data


def test_login_and_wrong_password(client):
    register(client)
    client.post("/auth/logout")
    bad = client.post("/auth/login", data={"email": "alexa@my.unt.edu", "password": "wrongpass1"})
    assert b"Email or password is incorrect" in bad.data
    good = client.post("/auth/login", data={"email": "alexa@my.unt.edu", "password": "wellness123"})
    assert good.headers["Location"] == "/dashboard"


def test_lockout_after_five_failures(client):
    register(client)
    client.post("/auth/logout")
    for _ in range(5):
        client.post("/auth/login", data={"email": "alexa@my.unt.edu", "password": "wrongpass1"})
    response = client.post("/auth/login", data={"email": "alexa@my.unt.edu", "password": "wellness123"})
    assert b"Too many failed attempts" in response.data


def test_pages_require_login(client):
    for path in ("/dashboard", "/sleep/", "/progress/", "/profile"):
        assert client.get(path).headers["Location"] == "/auth/login"
