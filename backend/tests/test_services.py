import datetime
from app.services.streak import compute_streak

def test_streak_first_activity():
    # If there was no activity before, streak starts at 1
    new_streak, was_inc = compute_streak(None, 0, datetime.date(2026, 7, 10))
    assert new_streak == 1
    assert was_inc is True

def test_streak_consecutive_days():
    # If practiced yesterday, streak increments
    last_active = datetime.date(2026, 7, 9)
    today = datetime.date(2026, 7, 10)
    new_streak, was_inc = compute_streak(last_active, 5, today)
    assert new_streak == 6
    assert was_inc is True

def test_streak_same_day():
    # If practiced today already, streak remains unchanged and isn't incremented again
    last_active = datetime.date(2026, 7, 10)
    today = datetime.date(2026, 7, 10)
    new_streak, was_inc = compute_streak(last_active, 5, today)
    assert new_streak == 5
    assert was_inc is False

def test_streak_broken():
    # If missed a day, streak resets to 1
    last_active = datetime.date(2026, 7, 8)
    today = datetime.date(2026, 7, 10)
    new_streak, was_inc = compute_streak(last_active, 5, today)
    assert new_streak == 1
    assert was_inc is True
