"""
signals.py — Phase 2: Extract Buenos Aires social signals from ingested data.

Produces a SignalProfile that captures:
  - Top venue categories the user searched for or visited
  - Buenos Aires-specific keyword hits
  - Time-of-day and day-of-week activity patterns
  - Inferred social interests (bars, cafes, tango, coworking, events, etc.)
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from ingest import IngestResult, SearchEvent, PlaceVisit


# ---------------------------------------------------------------------------
# Buenos Aires social keyword taxonomy
# ---------------------------------------------------------------------------

# Maps keyword patterns → canonical category label
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "bar": [
        r"\bbar(es)?\b", r"\bcervec", r"\bpub\b", r"\bbirra\b",
        r"\bcoctele", r"\bcerveza", r"\bcraft beer\b", r"\brooftop",
        r"\bvino(s)?\b", r"\bwine bar\b",
    ],
    "cafe": [
        r"\bcafé(s)?\b", r"\bcafe\b", r"\bcoffee\b", r"\bcafeter",
        r"\bbarista\b", r"\bespresso\b", r"\bspecialty coffee\b",
    ],
    "coworking": [
        r"\bcoworking\b", r"\bco-working\b", r"\bespacio de trabajo\b",
        r"\boficina compartida\b", r"\blaptop\b", r"\bwifi\b",
        r"\btrabaj\b",  # trabajar, trabajo, etc.
    ],
    "tango_milonga": [
        r"\btango\b", r"\bmilonga\b", r"\bbaile\b", r"\bdanza\b",
        r"\bclases de baile\b",
    ],
    "live_music": [
        r"\bjazz\b", r"\bmúsica en vivo\b", r"\bmusica en vivo\b",
        r"\bconcierto\b", r"\bshow\b", r"\brock nacional\b",
        r"\bindie\b", r"\bbanda\b",
    ],
    "cultural_center": [
        r"\bcultur\b", r"\barte\b", r"\bmuseo\b", r"\bexposici",
        r"\bgalería\b", r"\bteatro\b", r"\bcine\b",
    ],
    "market": [
        r"\bferia\b", r"\bmercado\b", r"\bartesanal\b", r"\bpulgas\b",
    ],
    "event_space": [
        r"\bmeetup\b", r"\bnetworking\b", r"\bevento(s)?\b",
        r"\bstartup\b", r"\btecnolog",
    ],
    "restaurant": [
        r"\brestaurante\b", r"\brestaurant\b", r"\bcena\b", r"\balmuerzo\b",
        r"\bparrilla\b", r"\bcomida\b",
    ],
    "outdoor_social": [
        r"\bparque\b", r"\brunning\b", r"\byoga\b", r"\bcrossfit\b",
        r"\bdeporte\b", r"\bfitness\b",
    ],
}

# Buenos Aires-specific location tokens
BA_TOKENS = re.compile(
    r"\b(buenos aires|palermo|san telmo|recoleta|villa crespo|almagro|"
    r"chacarita|colegiales|balvanera|caballito|belgrano|barracas|"
    r"la boca|monserrat|puerto madero|flores|floresta|once)\b",
    re.IGNORECASE,
)

# Known social/nightlife prefixes in searches
SOCIAL_INTENT_PATTERNS = re.compile(
    r"\b(mejores?|donde|d[oó]nde|qué hacer|que hacer|cosas para hacer|"
    r"salir|recomiend|buen plan|life|night|noche|fin de semana|weekend)\b",
    re.IGNORECASE,
)

# Day names
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class TimePattern:
    """Hour-of-day and day-of-week activity distributions."""
    hour_counts: Counter = field(default_factory=Counter)     # 0–23
    dow_counts: Counter = field(default_factory=Counter)      # 0=Mon … 6=Sun

    @property
    def peak_hours(self) -> list[int]:
        if not self.hour_counts:
            return []
        max_count = max(self.hour_counts.values())
        threshold = max_count * 0.6
        peaks = [h for h, c in self.hour_counts.items() if c >= threshold]
        return sorted(peaks)

    @property
    def peak_days(self) -> list[str]:
        if not self.dow_counts:
            return []
        max_count = max(self.dow_counts.values())
        threshold = max_count * 0.6
        return [DAY_NAMES[d] for d, c in self.dow_counts.items() if c >= threshold]

    def human_hours(self) -> str:
        peaks = self.peak_hours
        if not peaks:
            return "[UNAVAILABLE]"
        slots = []
        if any(h <= 12 for h in peaks):
            slots.append("mornings")
        if any(13 <= h <= 17 for h in peaks):
            slots.append("afternoons")
        if any(18 <= h <= 21 for h in peaks):
            slots.append("early evenings")
        if any(h >= 22 for h in peaks):
            slots.append("late nights")
        return ", ".join(slots) if slots else "[UNAVAILABLE]"


@dataclass
class SignalProfile:
    """Aggregated social signals extracted from a user's Takeout data."""
    category_scores: Counter = field(default_factory=Counter)
    ba_search_count: int = 0
    total_searches: int = 0
    ba_visits: list[PlaceVisit] = field(default_factory=list)
    ba_visit_categories: Counter = field(default_factory=Counter)
    time_pattern: TimePattern = field(default_factory=TimePattern)
    top_barrios: Counter = field(default_factory=Counter)
    social_query_count: int = 0
    warnings: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _classify_text(text: str) -> list[str]:
    """Return all category labels that match keywords in *text*."""
    text_lower = text.lower()
    matched = []
    for category, patterns in CATEGORY_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                matched.append(category)
                break
    return matched


def _extract_barrio(text: str) -> Optional[str]:
    """Return the first Buenos Aires barrio mentioned in *text*, or None."""
    m = BA_TOKENS.search(text)
    if m:
        return m.group(0).lower().title()
    return None


def _is_ba_related(text: str) -> bool:
    return bool(BA_TOKENS.search(text))


def _is_social_intent(text: str) -> bool:
    return bool(SOCIAL_INTENT_PATTERNS.search(text))


# ---------------------------------------------------------------------------
# Core extraction
# ---------------------------------------------------------------------------

def _process_search_events(
    events: list[SearchEvent],
    profile: SignalProfile,
) -> None:
    profile.total_searches = len(events)

    for event in events:
        query = event.query
        is_ba = _is_ba_related(query)

        if is_ba:
            profile.ba_search_count += 1

        if is_ba and _is_social_intent(query):
            profile.social_query_count += 1

        # Classify — weight BA queries more heavily
        cats = _classify_text(query)
        weight = 2 if is_ba else 1
        for cat in cats:
            profile.category_scores[cat] += weight

        # Time patterns from search timestamps
        profile.time_pattern.hour_counts[event.timestamp.hour] += 1
        profile.time_pattern.dow_counts[event.timestamp.weekday()] += 1

        # Barrio mentions
        barrio = _extract_barrio(query)
        if barrio:
            profile.top_barrios[barrio] += 1


def _is_ba_visit(visit: PlaceVisit) -> bool:
    """Heuristic: visit is in Buenos Aires if address or lat/lng match."""
    if visit.address and _is_ba_related(visit.address):
        return True
    # Rough bounding box: BA city is approx lat -34.4 to -34.7, lng -58.3 to -58.6
    if visit.lat is not None and visit.lng is not None:
        return -34.7 <= visit.lat <= -34.4 and -58.6 <= visit.lng <= -58.3
    return False


def _process_place_visits(
    visits: list[PlaceVisit],
    profile: SignalProfile,
) -> None:
    for visit in visits:
        if not _is_ba_visit(visit):
            continue

        profile.ba_visits.append(visit)

        # Classify the place name + address
        combined_text = f"{visit.name} {visit.address}"
        cats = _classify_text(combined_text)
        for cat in cats:
            profile.ba_visit_categories[cat] += 1
            profile.category_scores[cat] += 3  # visits carry more weight

        # Time patterns from visit start time
        profile.time_pattern.hour_counts[visit.start.hour] += 2
        profile.time_pattern.dow_counts[visit.start.weekday()] += 2

        # Barrio from address
        barrio = _extract_barrio(combined_text)
        if barrio:
            profile.top_barrios[barrio] += 1


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_signals(result: IngestResult) -> SignalProfile:
    """Build a SignalProfile from an IngestResult."""
    profile = SignalProfile()

    if not result.search_events and not result.place_visits:
        profile.warnings.append(
            "No data found in IngestResult. "
            "Cannot extract any signals — check your Takeout export."
        )
        return profile

    _process_search_events(result.search_events, profile)
    _process_place_visits(result.place_visits, profile)

    # Sanity checks
    if profile.ba_search_count == 0 and not profile.ba_visits:
        profile.warnings.append(
            "No Buenos Aires signals found in the data. "
            "The search history and location timeline contain no references to "
            "Buenos Aires neighborhoods, venues, or activities. "
            "Recommendations will be based on generic social categories only."
        )

    return profile


def print_signal_summary(profile: SignalProfile) -> None:
    """Print a human-readable Phase 2 summary."""
    print("=" * 60)
    print("PHASE 2 — SIGNAL EXTRACTION SUMMARY")
    print("=" * 60)
    print(f"  Total searches analysed   : {profile.total_searches:,}")
    print(f"  BA-related searches       : {profile.ba_search_count:,}")
    print(f"  Social-intent BA queries  : {profile.social_query_count:,}")
    print(f"  Buenos Aires place visits : {len(profile.ba_visits):,}")

    if profile.top_barrios:
        print("\n  Top barrios mentioned:")
        for barrio, count in profile.top_barrios.most_common(5):
            print(f"    {barrio:<25} {count:>4} mentions")

    if profile.category_scores:
        print("\n  Category interest scores:")
        for cat, score in profile.category_scores.most_common(8):
            bar = "█" * min(score, 30)
            print(f"    {cat:<20} {bar} ({score})")

    tp = profile.time_pattern
    if tp.peak_hours:
        print(f"\n  Peak activity hours   : {tp.human_hours()}")
        print(f"  Peak activity hours   : {[f'{h:02d}:00' for h in tp.peak_hours]}")
    if tp.peak_days:
        print(f"  Peak activity days    : {', '.join(tp.peak_days)}")

    if profile.warnings:
        print(f"\n  Warnings:")
        for w in profile.warnings:
            print(f"    ⚠  {w}")

    print("=" * 60 + "\n")
