"""Tests for the JSON API used by the React front end (wellness/api/) - shared: each teammate adds tests for their own section.

Run all tests from wellness_planner/ with: python -m pytest
"""
from datetime import date, timedelta

import pytest

from wellness.seed import DEMO_EMAIL, DEMO_PASSWORD, seed_demo

TODAY = date.today().isoformat()


def days_ago(n):
    return (date.today() - timedelta(days=n)).isoformat()


def sign_up(client, email="alexa@my.unt.edu"):
    return client.post("/api/auth/register", json={
        "name": "Alexa", "email": email, "password": "wellness123", "confirm": "wellness123", "year": "Sophomore"})


@pytest.fixture
def api_client(client):
    sign_up(client)
    return client


# A day using the sections added so far. Teammates: add your section's data here
# (and a test for its rules), e.g. "stress": {...}, "exercise": [...].
FULL_DAY = {
    "sleep": {"bedtime": "23:00", "wakeTime": "07:00", "quality": 4},
    "note": "Good day.",
}


# --- accounts -----------------------------------------------------------------

def test_register_login_me_logout(client):
    assert sign_up(client).status_code == 201
    assert client.get("/api/auth/me").get_json()["user"]["email"] == "alexa@my.unt.edu"
    client.post("/api/auth/logout", json={})
    assert client.get("/api/auth/me").status_code == 401
    bad = client.post("/api/auth/login", json={"email": "alexa@my.unt.edu", "password": "nope12345"})
    assert bad.status_code == 401 and "incorrect" in bad.get_json()["error"]
    good = client.post("/api/auth/login", json={"email": "alexa@my.unt.edu", "password": "wellness123"})
    assert good.status_code == 200 and "password_hash" not in good.get_json()["user"]


def test_register_errors_and_duplicate(client):
    short = client.post("/api/auth/register", json={"name": "", "email": "x", "password": "short",
                                                     "confirm": "short", "year": "?"})
    assert set(short.get_json()["errors"]) == {"name", "email", "password", "year"}
    sign_up(client)
    dup = sign_up(client)
    assert dup.status_code == 400 and dup.get_json()["emailTaken"]


def test_lockout_through_api(client):
    sign_up(client)
    client.post("/api/auth/logout", json={})
    for _ in range(5):
        client.post("/api/auth/login", json={"email": "alexa@my.unt.edu", "password": "wrongpass1"})
    locked = client.post("/api/auth/login", json={"email": "alexa@my.unt.edu", "password": "wellness123"})
    assert "Too many failed attempts" in locked.get_json()["error"]


def test_profile_update(api_client):
    response = api_client.put("/api/auth/profile", json={"name": "Alexa R", "year": "Junior"})
    assert response.get_json()["user"]["year"] == "Junior"
    assert api_client.put("/api/auth/profile", json={"name": "", "year": "Junior"}).status_code == 400


def test_login_required_and_json_required(client):
    assert client.get("/api/days").status_code == 401
    sign_up(client)
    assert client.put(f"/api/days/{TODAY}", data="x").status_code == 415


# --- daily check-ins ----------------------------------------------------------

def test_save_and_load_full_day(api_client):
    saved = api_client.put(f"/api/days/{TODAY}", json=FULL_DAY)
    assert saved.status_code == 200
    day = api_client.get(f"/api/days/{TODAY}").get_json()
    assert day["saved"] and day["sleep"]["totalHours"] == 8.0 and day["note"] == "Good day."
    listed = api_client.get("/api/days").get_json()
    assert listed["days"][0]["sections"] == ["sleep"] and listed["days"][0]["sleepHours"] == 8.0
    assert listed["trackedSections"] == ["sleep", "stress", "exercise", "food", "screenTime"]


def test_clearing_a_section_removes_it(api_client):
    api_client.put(f"/api/days/{TODAY}", json=FULL_DAY)
    api_client.put(f"/api/days/{TODAY}", json={**FULL_DAY, "sleep": {"bedtime": "", "wakeTime": ""}})
    day = api_client.get(f"/api/days/{TODAY}").get_json()
    assert day["sleep"] is None and day["note"] == "Good day."


def test_field_errors_are_keyed_by_section(api_client):
    bad = {"sleep": {"bedtime": "", "wakeTime": "07:00", "quality": 9}, "note": "x" * 1001}
    errors = api_client.put(f"/api/days/{TODAY}", json=bad).get_json()["errors"]
    assert {"sleep.bedtime", "sleep.quality", "note.note"} <= set(errors)


def test_empty_future_and_long_sleep(api_client):
    assert "form" in api_client.put(f"/api/days/{TODAY}", json={}).get_json()["errors"]
    future = (date.today() + timedelta(days=1)).isoformat()
    assert "date" in api_client.put(f"/api/days/{future}", json=FULL_DAY).get_json()["errors"]
    long_sleep = {"sleep": {"bedtime": "12:00", "wakeTime": "06:00"}}
    first = api_client.put(f"/api/days/{TODAY}", json=long_sleep)
    assert first.status_code == 409 and first.get_json()["totalHours"] == 18.0
    assert api_client.put(f"/api/days/{TODAY}", json={**long_sleep, "confirmLongSleep": True}).status_code == 200


def test_delete_day_and_privacy(client):
    sign_up(client, "first@my.unt.edu")
    client.put(f"/api/days/{TODAY}", json=FULL_DAY)
    client.post("/api/auth/logout", json={})
    sign_up(client, "second@my.unt.edu")
    assert client.get(f"/api/days/{TODAY}").get_json()["saved"] is False   # can't see the first user's day
    assert client.get("/api/days").get_json()["days"] == []
    client.post("/api/auth/logout", json={})
    client.post("/api/auth/login", json={"email": "first@my.unt.edu", "password": "wellness123"})
    client.delete(f"/api/days/{TODAY}", json={})
    assert client.get(f"/api/days/{TODAY}").get_json()["saved"] is False


def test_options(api_client):
    assert api_client.get("/api/days/options").get_json()["longSleepHours"] == 16


# --- progress -----------------------------------------------------------------

def test_progress_with_demo_data(client, app):
    with app.app_context():
        seed_demo()
    client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    progress = client.get("/api/progress?days=30").get_json()
    assert progress["enoughData"] and progress["period"] == 30
    assert progress["summary"]["categories"]["sleep"]["score"] is not None
    for category, tip in progress["categoryTips"].items():
        assert tip["category"] == category
    assert client.get("/api/progress/tips/sleep-short").status_code == 200
    assert client.get("/api/progress/tips/nope").status_code == 404


def test_progress_needs_data(api_client):
    assert api_client.get("/api/progress").get_json()["enoughData"] is False
