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


FULL_DAY = {
    "sleep": {"bedtime": "23:00", "wakeTime": "07:00", "quality": 4},
    "stress": {"level": 3, "answers": [True, False, True, False, True], "note": "Exam week"},
    "exercise": [{"activityType": "Walking", "minutes": 30}, {"activityType": "Gym", "minutes": 45}],
    "food": {"meals": [
        {"time": "08:00", "mealType": "Breakfast",
         "items": [{"dish": "oatmeal", "ingredients": ["oatmeal", "berries"], "portion": "small_bowl"}]},
        {"time": "12:30", "mealType": "Lunch",
         "items": [{"dish": "tacos", "ingredients": ["corn_tortilla", "beef", "cheese"], "quantity": 3},
                   {"dish": "nachos", "ingredients": ["tortilla_chips", "queso"], "portion": "medium_plate"}]}],
        "water": 6},
    "screenTime": {"hours": 4.5},
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


def test_demo_login_hint(client, app):
    hint = client.get("/api/auth/demo").get_json()
    assert hint["email"] == DEMO_EMAIL and hint["password"] == DEMO_PASSWORD
    app.config["SHOW_DEMO_LOGIN"] = False
    assert client.get("/api/auth/demo").status_code == 404


def test_profile_update(api_client):
    response = api_client.put("/api/auth/profile", json={"name": "Alexa R", "year": "Junior"})
    assert response.get_json()["user"]["year"] == "Junior"
    assert api_client.put("/api/auth/profile", json={"name": "", "year": "Junior"}).status_code == 400


def test_login_required_and_json_required(client):
    assert client.get("/api/days").status_code == 401
    assert client.get("/api/schedule").status_code == 401
    sign_up(client)
    assert client.put(f"/api/days/{TODAY}", data="x").status_code == 415


# --- daily check-ins ----------------------------------------------------------

def test_save_and_load_full_day(api_client):
    saved = api_client.put(f"/api/days/{TODAY}", json=FULL_DAY)
    assert saved.status_code == 200
    day = api_client.get(f"/api/days/{TODAY}").get_json()
    assert day["saved"] and day["sleep"]["totalHours"] == 8.0
    assert day["stress"]["answers"] == [True, False, True, False, True]
    assert [a["minutes"] for a in day["exercise"]] == [30, 45]
    # oatmeal: whole grains 3 + fruit 3 -> 3.0;  tacos: 3 + 2 + 2 -> 2.3;  nachos: 1 + 1 -> 1.0
    lunch = day["food"]["meals"][1]
    assert [i["score"] for i in lunch["items"]] == [2.3, 1.0] and lunch["items"][0]["quantity"] == 3
    assert lunch["items"][1]["portion"] == "medium_plate"
    assert [m["score"] for m in day["food"]["meals"]] == [3.0, 1.7] and day["food"]["dailyScore"] == 2.4
    assert day["food"]["water"] == 6 and day["screenTime"]["hours"] == 4.5 and day["note"] == "Good day."
    listed = api_client.get("/api/days").get_json()["days"][0]
    assert listed == {"date": TODAY, "sleepHours": 8.0, "exerciseMinutes": 75, "mealCount": 2,
                      "sections": ["sleep", "stress", "exercise", "food", "screenTime"]}


def test_partial_day_lists_only_its_sections(api_client):
    api_client.put(f"/api/days/{TODAY}", json={"sleep": FULL_DAY["sleep"], "screenTime": {"hours": 2}})
    listed = api_client.get("/api/days").get_json()
    assert listed["days"][0]["sections"] == ["sleep", "screenTime"]
    assert listed["trackedSections"] == ["sleep", "stress", "exercise", "food", "screenTime"]


def test_clearing_a_section_removes_it(api_client):
    api_client.put(f"/api/days/{TODAY}", json=FULL_DAY)
    api_client.put(f"/api/days/{TODAY}", json={**FULL_DAY, "exercise": [], "screenTime": {"hours": ""}})
    day = api_client.get(f"/api/days/{TODAY}").get_json()
    assert day["exercise"] == [] and day["screenTime"] is None and day["sleep"] is not None


def test_field_errors_are_keyed_by_section(api_client):
    bad = {"sleep": {"bedtime": "", "wakeTime": "07:00"}, "stress": {"level": 9, "answers": [True]},
           "exercise": [{"activityType": "Flying", "minutes": 0}], "screenTime": {"hours": 30},
           "food": {"meals": [{"mealType": "Brunch", "items": []}], "water": 0}}
    errors = api_client.put(f"/api/days/{TODAY}", json=bad).get_json()["errors"]
    assert {"sleep.bedtime", "stress.level", "stress.answers", "exercise.activityType.0",
            "exercise.minutes.0", "screenTime.hours", "food.mealType.0", "food.items.0"} <= set(errors)


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


def test_stress_support_message_after_three_hard_days(api_client):
    hard = {"stress": {"level": 4, "answers": [True] * 5}}
    for n in (2, 1):
        assert api_client.put(f"/api/days/{days_ago(n)}", json=hard).get_json()["supportMessage"] is False
    assert api_client.put(f"/api/days/{TODAY}", json=hard).get_json()["supportMessage"] is True


def test_options(api_client):
    options = api_client.get("/api/days/options").get_json()
    assert len(options["stressQuestions"]) == 5 and "Walking" in options["activityTypes"]
    catalog = options["foodCatalog"]
    assert catalog["foodGroups"]["other"]["points"] == 0 and len(catalog["cuisines"]) >= 10


def test_food_portion_rules(api_client):
    def save(item):
        return api_client.put(f"/api/days/{TODAY}", json={"food": {"meals": [{"mealType": "Lunch", "items": [item]}]}})
    assert "food.item.0.0" in save({"dish": "tacos", "ingredients": ["beef"], "quantity": 20}).get_json()["errors"]
    assert "food.item.0.0" in save({"dish": "nachos", "ingredients": ["queso"], "portion": "large_cup"}).get_json()["errors"]
    assert "food.item.0.0" in save({"dish": "tacos", "ingredients": [], "quantity": 2}).get_json()["errors"]
    assert "food.item.0.0" in save({"dish": "not_a_dish", "ingredients": ["beef"]}).get_json()["errors"]
    built = save({"dish": "build_your_own", "ingredients": ["apple", "something_else"], "portion": "snack"})
    assert built.status_code == 200 and built.get_json()["food"]["meals"][0]["items"][0]["score"] == 1.5


def test_food_catalog_is_consistent():
    """Every ingredient, food group and portion the catalog mentions must exist (catches typos in the JSON)."""
    from wellness.api.sections.food import load_catalog
    catalog = load_catalog()
    for ingredient in catalog["ingredients"].values():
        assert ingredient["group"] in catalog["foodGroups"], ingredient
    ids = set()
    for cuisine in catalog["cuisines"]:
        for dish in cuisine["dishes"]:
            assert dish["id"] not in ids, f"duplicate dish id {dish['id']}"
            ids.add(dish["id"])
            for ingredient in dish["ingredients"] + dish["extras"]:
                assert ingredient in catalog["ingredients"], f"{dish['id']}: unknown ingredient {ingredient}"
            rule = dish["portion"]
            if rule["type"] == "count":
                assert 1 <= rule["default"] <= rule["max"], dish["id"]
            else:
                assert rule["default"] in rule["options"] and set(rule["options"]) <= set(catalog["portions"]), dish["id"]


# --- schedule -----------------------------------------------------------------

CLASS = {"name": "CSCE 3444", "itemType": "Class", "days": ["Wed", "Mon"], "startTime": "11:30",
         "endTime": "12:50", "location": "Discovery Park", "color": "#82a28a"}


def test_schedule_add_overlap_edit_delete(api_client):
    created = api_client.post("/api/schedule", json=CLASS)
    assert created.status_code == 201 and created.get_json()["item"]["days"] == ["Mon", "Wed"]
    item_id = created.get_json()["item"]["id"]
    clash = {**CLASS, "name": "Lunch shift", "itemType": "Work", "days": ["Mon"], "startTime": "12:00", "endTime": "14:00"}
    warned = api_client.post("/api/schedule", json=clash)
    assert warned.status_code == 409 and warned.get_json()["conflicts"] == ["CSCE 3444"]
    assert api_client.post("/api/schedule", json={**clash, "allowOverlap": True}).status_code == 201
    bad = api_client.post("/api/schedule", json={**CLASS, "days": [], "endTime": "10:00"}).get_json()["errors"]
    assert {"days", "endTime"} <= set(bad)
    # Editing still warns about the overlap we accepted above, so confirm it the same way.
    edited = api_client.put(f"/api/schedule/{item_id}", json={**CLASS, "name": "CSCE 3444 lecture", "allowOverlap": True})
    assert edited.status_code == 200 and edited.get_json()["item"]["name"] == "CSCE 3444 lecture"
    api_client.delete(f"/api/schedule/{item_id}", json={})
    assert [i["name"] for i in api_client.get("/api/schedule").get_json()["items"]] == ["Lunch shift"]


def test_schedule_other_users_item_is_404(client):
    sign_up(client, "first@my.unt.edu")
    item_id = client.post("/api/schedule", json=CLASS).get_json()["item"]["id"]
    client.post("/api/auth/logout", json={})
    sign_up(client, "second@my.unt.edu")
    assert client.put(f"/api/schedule/{item_id}", json=CLASS).status_code == 404
    assert client.delete(f"/api/schedule/{item_id}", json={}).status_code == 404


# --- progress and compare -----------------------------------------------------

def test_progress_and_compare_with_demo_data(client, app):
    with app.app_context():
        seed_demo()
    client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    progress = client.get("/api/progress?days=30").get_json()
    assert progress["enoughData"] and progress["period"] == 30 and progress["recommendations"]
    for category, tip in progress["categoryTips"].items():
        assert tip["category"] == category
    assert client.get(f"/api/progress/tips/{progress['recommendations'][0]['id']}").status_code == 200
    compared = client.get("/api/compare").get_json()
    assert compared["enoughData"] and [r["key"] for r in compared["rows"]] == ["sleep", "stress", "exercise", "food", "screen"]
    assert all(r["direction"] in ("better", "worse", "same") for r in compared["rows"])


def test_progress_and_compare_need_data(api_client):
    assert api_client.get("/api/progress").get_json()["enoughData"] is False
    assert api_client.get("/api/compare").get_json()["enoughData"] is False
    bad = api_client.get(f"/api/compare?aStart={TODAY}&aEnd={days_ago(3)}").get_json()["errors"]
    assert "aEnd" in bad
