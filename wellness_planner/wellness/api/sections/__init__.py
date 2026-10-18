"""Daily check-in sections - shared pattern (each module is owned by its section's teammate).

WHAT THIS FOLDER IS
    One module per daily check-in section:
        sleep.py (Bobby)  stress.py (Malika)  food.py (Malika)
        exercise.py (Daniella)  screen_time.py (Daniella)  notes.py (reflection, shared)

THE PATTERN EVERY MODULE FOLLOWS (same four functions):
    load(db, user_id, day)        -> the saved data for that day (None or [] if nothing saved)
    validate(data)                -> (clean, errors): clean is None when the section was left empty
    save(db, user_id, day, clean) -> replace that day's data (no commit; days.py commits)
    delete(db, user_id, day)      -> remove that day's data

HOW IT CONNECTS
    api/days.py calls these functions for every section, so adding a new section means
    adding a module here and listing it in days.SECTIONS. Because every section has the
    same four functions, days.py can save a whole day in one loop.
"""
