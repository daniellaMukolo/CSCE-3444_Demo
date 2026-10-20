# AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
"""Tests for sleep tracking (sleep.py, UC-02) - Bobby."""
from datetime import date, timedelta

import pytest

from wellness.db import get_db
from wellness.sleep import calculate_total_hours

from .conftest import register

TODAY = date.today().isoformat()


@pytest.mark.parametrize("bed, wake, hours", [
    ("23:00", "07:00", 8.0),
    ("01:30", "08:00", 6.5),
    ("22:15", "06:45", 8.5),
    ("07:00", "07:00", 24.0),
])
def test_calculate_total_hours(bed, wake, hours):
    assert calculate_total_hours(bed, wake) == hours


def save(client, **overrides):
    """Post the sleep form with valid defaults, overriding any given fields."""
    data = {"entry_date": TODAY, "bedtime": "23:00", "wake_time": "07:00", "quality": "4", **overrides}
    return client.post("/sleep/", data=data)


def test_save_entry(logged_in, app):
    assert save(logged_in).status_code == 302
    with app.app_context():
        assert get_db().execute("SELECT total_hours FROM sleep_entries").fetchone()[0] == 8.0


def test_future_date_rejected(logged_in):
    response = save(logged_in, entry_date=(date.today() + timedelta(days=1)).isoformat())
    assert b"can&#39;t be in the future" in response.data


def test_missing_time_rejected(logged_in):
    assert b"Enter your bedtime" in save(logged_in, bedtime="").data


def test_long_sleep_needs_confirmation(logged_in):
    assert b"Are those times right" in save(logged_in, bedtime="12:00", wake_time="06:00").data
    assert save(logged_in, bedtime="12:00", wake_time="06:00", confirm_long="1").status_code == 302


def test_same_date_asks_to_replace(logged_in, app):
    save(logged_in)
    assert b"already have a sleep entry" in save(logged_in, wake_time="08:00").data
    save(logged_in, wake_time="08:00", confirm_replace="1")
    with app.app_context():
        rows = get_db().execute("SELECT total_hours FROM sleep_entries").fetchall()
    assert [r[0] for r in rows] == [9.0]


def test_cannot_edit_other_users_entry(client):
    register(client, email="first@my.unt.edu")
    save(client)
    client.post("/auth/logout")
    register(client, email="second@my.unt.edu")
    assert client.get("/sleep/1/edit").status_code == 404
    assert client.post("/sleep/1/delete").status_code == 404
