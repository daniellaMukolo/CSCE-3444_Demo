"""Tests for My Progress (progress.py, UC-03) - Bobby."""
from wellness.seed import DEMO_EMAIL, DEMO_PASSWORD, seed_demo


def test_needs_three_days(logged_in):
    assert b"Log at least 3 days" in logged_in.get("/progress/").data


def test_progress_with_demo_data(client, app):
    with app.app_context():
        seed_demo()
    client.post("/auth/login", data={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    for days in ("7", "30"):
        page = client.get(f"/progress/?days={days}").data
        assert b"Routine Feedback" in page
        assert b"chart-sleep" in page
        assert b"not medical advice" in page


def test_recommendation_detail(logged_in):
    assert b"Source:" in logged_in.get("/progress/tip/sleep-short").data
    assert logged_in.get("/progress/tip/nope").status_code == 404
