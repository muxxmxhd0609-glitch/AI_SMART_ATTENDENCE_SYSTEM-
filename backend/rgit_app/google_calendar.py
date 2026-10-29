"""
RGIT Bangalore - Google Calendar Government Holiday Service
Synchronizes official Indian National & Karnataka State Government Holidays
directly from Google Calendar's public Indian Holidays feed:
'en.indian#holiday@group.v.calendar.google.com'

Provides:
- Auto-caching with offline resilience (pre-baked gazetted holidays)
- Month-wise holiday lookup (Day Number -> Holiday Name)
- Non-working day validation (Sundays & Official Holidays)
- Working days calculation till date
"""

import json
import logging
import re
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger("rgit_google_calendar")

CACHE_FILE = Path(__file__).resolve().parent / "google_holidays_cache.json"
GOOGLE_CALENDAR_ICAL_URL = (
    "https://calendar.google.com/calendar/ical/"
    "en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics"
)

# Comprehensive Indian National & Karnataka Gazetted Government Holidays (Pre-baked fallback)
DEFAULT_GAZETTED_HOLIDAYS: Dict[str, str] = {
    # 2026 Official Karnataka & Indian Government Holidays
    "2026-01-01": "New Year's Day",
    "2026-01-14": "Makara Sankranti / Pongal",
    "2026-01-26": "Republic Day",
    "2026-02-15": "Maha Shivaratri",
    "2026-03-04": "Holi",
    "2026-03-19": "Ugadi / Gudi Padwa",
    "2026-03-21": "Ramzan Id / Eid-ul-Fitr",
    "2026-03-31": "Mahavir Jayanti",
    "2026-04-03": "Good Friday",
    "2026-04-14": "Dr. B.R. Ambedkar Jayanti",
    "2026-05-01": "May Day / Labour Day",
    "2026-05-28": "Bakrid / Eid-ul-Adha",
    "2026-06-26": "Muharram",
    "2026-08-15": "Independence Day",
    "2026-08-26": "Milad-un-Nabi",
    "2026-09-14": "Ganesh Chaturthi",
    # October 2026 Government Holidays
    "2026-10-02": "Mahatma Gandhi Jayanti",
    "2026-10-19": "Maha Navami / Ayudha Pooja",
    "2026-10-20": "Dussehra / Vijayadashami",
    "2026-10-26": "Maharishi Valmiki Jayanti",
    # November 2026 Government Holidays
    "2026-11-01": "Kannada Rajyotsava",
    "2026-11-08": "Naraka Chaturdashi (Diwali)",
    "2026-11-09": "Balipadyami / Deepavali",
    "2026-11-24": "Guru Nanak Jayanti",
    "2026-11-27": "Kanakadasa Jayanti",
    # December 2026 Government Holidays
    "2026-12-25": "Christmas Day",
    # 2025 Key Gazetted Holidays
    "2025-01-26": "Republic Day",
    "2025-03-30": "Ugadi",
    "2025-03-31": "Eid-ul-Fitr",
    "2025-04-14": "Dr. B.R. Ambedkar Jayanti",
    "2025-05-01": "May Day",
    "2025-08-15": "Independence Day",
    "2025-10-02": "Mahatma Gandhi Jayanti",
    "2025-10-20": "Dussehra / Vijayadashami",
    "2025-11-01": "Kannada Rajyotsava",
    "2025-11-10": "Deepavali",
    "2025-12-25": "Christmas",
}

# Major gazetted holiday keywords to prioritize from Google Calendar
GAZETTED_KEYWORDS = [
    "gandhi", "dussehra", "republic", "independence", "ambedkar",
    "valmiki", "rajyotsava", "diwali", "deepavali", "ugadi",
    "shivaratri", "holi", "good friday", "christmas", "bakrid", "eid",
    "muharram", "ganesh", "guru nanak", "mahavir", "buddha",
    "sankranti", "pongal", "may day", "labour", "navami", "ayudha"
]

_memory_holiday_cache: Optional[Dict[str, str]] = None


def load_cached_holidays() -> Dict[str, str]:
    """Loads holidays from local disk cache, falling back to pre-baked gazetted holidays."""
    global _memory_holiday_cache
    if _memory_holiday_cache is not None:
        return _memory_holiday_cache

    holidays = dict(DEFAULT_GAZETTED_HOLIDAYS)

    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    holidays.update(data)
                    logger.info("Loaded %d holidays from disk cache.", len(holidays))
        except Exception as e:
            logger.warning("Could not read holiday cache file: %s", e)

    _memory_holiday_cache = holidays
    return holidays


def save_cached_holidays(holidays: Dict[str, str]) -> None:
    """Saves updated holidays to disk cache."""
    global _memory_holiday_cache
    _memory_holiday_cache = holidays
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(holidays, f, indent=2, sort_keys=True)
    except Exception as e:
        logger.warning("Could not write holiday cache file: %s", e)


def sync_google_calendar_holidays(timeout_seconds: int = 5) -> Dict[str, str]:
    """
    Fetches the latest official Indian Government Holidays from Google Calendar iCal.
    Updates the local cache and returns the complete merged dictionary of holidays.
    """
    holidays = load_cached_holidays()
    try:
        req = urllib.request.Request(
            GOOGLE_CALENDAR_ICAL_URL,
            headers={"User-Agent": "RGIT-AI-Smart-Attendance/2.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            content = resp.read().decode("utf-8", errors="ignore")

        events = re.findall(r"BEGIN:VEVENT.*?END:VEVENT", content, re.DOTALL)
        count_added = 0

        for ev in events:
            dt_match = re.search(r"DTSTART(?:;VALUE=DATE)?:(\d{8})", ev)
            summary_match = re.search(r"SUMMARY:(.*?)\r?\n", ev)
            if not dt_match or not summary_match:
                continue

            raw_date = dt_match.group(1)
            raw_summary = summary_match.group(1).strip()
            date_str = f"{raw_date[0:4]}-{raw_date[4:6]}-{raw_date[6:8]}"

            # Only include major public/gazetted holidays
            summary_lower = raw_summary.lower()
            if any(k in summary_lower for k in GAZETTED_KEYWORDS):
                holidays[date_str] = raw_summary
                count_added += 1

        save_cached_holidays(holidays)
        logger.info("Google Calendar sync successful: %d holidays tracked.", len(holidays))
    except Exception as ex:
        logger.warning("Google Calendar online sync skipped (%s), using pre-cached holidays.", ex)

    return holidays


def get_all_holidays() -> Dict[str, str]:
    """Returns the merged dictionary of all tracked Google Calendar government holidays."""
    return load_cached_holidays()


def get_holidays_for_month(year: int, month: int) -> Dict[int, str]:
    """
    Returns a dictionary of {day_number: holiday_name} for the given year and month.
    Example for October 2026:
    {
        2: "Mahatma Gandhi Jayanti",
        19: "Maha Navami / Ayudha Pooja",
        20: "Dussehra / Vijayadashami",
        26: "Maharishi Valmiki Jayanti"
    }
    """
    all_holidays = get_all_holidays()
    month_prefix = f"{year:04d}-{month:02d}-"
    result: Dict[int, str] = {}

    for d_str, name in all_holidays.items():
        if d_str.startswith(month_prefix):
            try:
                day_num = int(d_str.split("-")[2])
                result[day_num] = name
            except Exception:
                pass

    return result


def is_government_holiday(dt: date) -> Tuple[bool, Optional[str]]:
    """
    Checks if a specific date is an official Government Holiday from Google Calendar.
    Returns (is_holiday, holiday_name).
    """
    dt_str = dt.strftime("%Y-%m-%d")
    all_holidays = get_all_holidays()
    if dt_str in all_holidays:
        return True, all_holidays[dt_str]
    return False, None


def is_non_working_day(dt: date) -> Tuple[bool, Optional[str]]:
    """
    Returns True if the date is either a Sunday or an official Government Holiday.
    Returns (is_non_working, reason).
    """
    if dt.weekday() == 6:
        return True, "Sunday"

    is_gov, name = is_government_holiday(dt)
    if is_gov:
        return True, name

    return False, None


def get_month_working_days(year: int, month: int, till_date: Optional[date] = None) -> List[int]:
    """
    Returns a list of day numbers (1..31) that were valid academic working days
    (i.e., NOT Sundays and NOT official Government Holidays).
    If till_date is provided, only days <= till_date are included.
    """
    import calendar
    days_in_month = calendar.monthrange(year, month)[1]
    working_days = []

    for d in range(1, days_in_month + 1):
        dt = date(year, month, d)
        if till_date and dt > till_date:
            break
        non_working, _ = is_non_working_day(dt)
        if not non_working:
            working_days.append(d)

    return working_days


# Initialize cache at module load
try:
    sync_google_calendar_holidays(timeout_seconds=3)
except Exception:
    load_cached_holidays()
