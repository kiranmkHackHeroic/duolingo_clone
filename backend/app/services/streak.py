import datetime
from typing import Tuple

def compute_streak(
    last_activity_date: datetime.date | None, 
    current_streak: int, 
    today: datetime.date
) -> Tuple[int, bool]:
    """
    Computes the user's new streak.
    Returns:
        Tuple[int, bool]: (new_streak, was_incremented)
    """
    if last_activity_date is None:
        return 1, True

    delta = (today - last_activity_date).days

    if delta == 0:
        # Activity already recorded today, streak stays the same, not incremented again.
        return current_streak, False
    elif delta == 1:
        # Yesterday was the last activity, increment streak.
        return current_streak + 1, True
    else:
        # Missed a day or more, streak resets to 1.
        return 1, True
