"""Shared pytest fixtures: a fresh app and database per test, a client, and a logged-in client."""
import pytest

from wellness import create_app
from wellness.db import init_db


@pytest.fixture
def app(tmp_path):
    """App using a temporary database that is deleted after the test."""
    app = create_app({"TESTING": True, "SECRET_KEY": "test", "DATABASE": str(tmp_path / "test.sqlite")})
    with app.app_context():
        init_db()
    return app


@pytest.fixture
def client(app):
    """Test client for sending requests to the app."""
    return app.test_client()


def register(client, email="alexa@my.unt.edu", password="wellness123", name="Alexa"):
    """Submit the sign-up form (which also logs the client in)."""
    return client.post("/auth/register", data={
        "name": name, "email": email, "password": password, "confirm": password, "year": "Sophomore",
    })


@pytest.fixture
def logged_in(client):
    """A client that has signed up and is logged in."""
    register(client)
    return client
