-- Student Wellness Planner database schema - shared (each table is marked with its owner).
-- WHAT THIS FILE DOES: defines every table for the whole team.
-- HOW IT CONNECTS: db.py runs it for `flask --app wellness init-db` (deletes all data);
-- each section module in api/sections/ reads and writes its own table(s).
-- Every entry belongs to a user and a date. Dates are 'YYYY-MM-DD' text, times 'HH:MM'.
-- A "routine" for Compare Routines (UC-09) is a date range, so it needs no table.
-- progress.py reads the stress, exercise, food and screen time tables for My Progress.
-- Change this file only after the team agrees; then everyone re-runs init-db and seed-demo.

DROP TABLE IF EXISTS daily_notes;
DROP TABLE IF EXISTS screen_time_entries;
DROP TABLE IF EXISTS water_intake;
DROP TABLE IF EXISTS food_items;
DROP TABLE IF EXISTS food_entries;
DROP TABLE IF EXISTS exercise_entries;
DROP TABLE IF EXISTS stress_checkins;
DROP TABLE IF EXISTS schedule_items;
DROP TABLE IF EXISTS sleep_entries;
DROP TABLE IF EXISTS users;

-- FR-01 / UC-01 (Bobby)
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,            -- NFR 6.2: never plain text
    year_in_school  TEXT NOT NULL,
    failed_logins   INTEGER NOT NULL DEFAULT 0,
    locked_until    TEXT,                     -- NFR 6.2: 15-minute lockout after 5 failures
    created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FR-02 / UC-02 (Bobby)
CREATE TABLE sleep_entries (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date   TEXT NOT NULL,               -- the morning the student woke up
    bedtime      TEXT NOT NULL,
    wake_time    TEXT NOT NULL,
    quality      INTEGER CHECK (quality BETWEEN 1 AND 5),   -- optional
    total_hours  REAL NOT NULL,
    UNIQUE (user_id, entry_date)
);

-- FR-04 / UC-04 (Malika)
CREATE TABLE schedule_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    item_type   TEXT NOT NULL CHECK (item_type IN ('Class', 'Work', 'Study', 'Other')),
    days        TEXT NOT NULL,                -- comma list, e.g. 'Mon,Wed,Fri'
    start_time  TEXT NOT NULL,
    end_time    TEXT NOT NULL,
    location    TEXT,                         -- optional, e.g. 'Discovery Park B185'
    color       TEXT                          -- optional color marker shown in the app
);

-- FR-05 / UC-05 (Malika)
CREATE TABLE stress_checkins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date    TEXT NOT NULL,
    stress_level  INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
    answers       TEXT NOT NULL,              -- five yes/no answers, e.g. 'YNNYN'
    note          TEXT,
    UNIQUE (user_id, entry_date)              -- one check-in per day
);

-- FR-07 / UC-07 (Daniella)
CREATE TABLE exercise_entries (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date        TEXT NOT NULL,
    activity_type     TEXT NOT NULL,
    duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0)
);

-- FR-06 / UC-06 (Malika)
CREATE TABLE food_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date  TEXT NOT NULL,
    meal_type   TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
    meal_time   TEXT,                         -- optional 'HH:MM'
    categories  TEXT NOT NULL,                -- comma list of the food groups in the meal's dishes
    meal_score  REAL NOT NULL,                -- average of its dishes' scores, 0 to 3 (3 = healthiest)
    note        TEXT
);

-- Each dish in a meal, picked from data/food_catalog.json (e.g. 3 tacos, a medium plate of nachos)
CREATE TABLE food_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id      INTEGER NOT NULL REFERENCES food_entries (id) ON DELETE CASCADE,
    position     INTEGER NOT NULL,            -- order within the meal
    dish         TEXT NOT NULL,               -- dish id from the catalog
    ingredients  TEXT NOT NULL,               -- comma list of ingredient ids
    portion      TEXT,                        -- portion id (e.g. 'medium_plate') for size-based dishes
    quantity     INTEGER,                     -- how many, for countable dishes (e.g. 3 tacos)
    score        REAL NOT NULL                -- average points of the ingredients' food groups
);

CREATE TABLE water_intake (
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date  TEXT NOT NULL,
    cups        INTEGER NOT NULL DEFAULT 0 CHECK (cups >= 0),
    PRIMARY KEY (user_id, entry_date)
);

-- FR-08 / UC-08 (Daniella)
CREATE TABLE screen_time_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date  TEXT NOT NULL,
    hours       REAL NOT NULL CHECK (hours BETWEEN 0 AND 24),
    UNIQUE (user_id, entry_date)
);

-- Optional free-text reflection for the day (shown on the dashboard)
CREATE TABLE daily_notes (
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date  TEXT NOT NULL,
    note        TEXT NOT NULL,
    PRIMARY KEY (user_id, entry_date)
);
