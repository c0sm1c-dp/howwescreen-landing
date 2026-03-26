"""
ingest.py — Phase 1: Google Takeout data ingestion.

=== SCHEMA ASSUMPTIONS ===

MyActivity.json (Google Search History):
  - Root is a JSON array.
  - Each element MAY have: "title" (str), "time" (ISO-8601 str), "products" (list[str]).
  - The "title" field for search events typically reads "Buscaste <query>" (es)
    or "Searched for <query>" (en).  We strip the prefix with a regex.
  - Elements without "time" are skipped with a warning.

Semantic Location History (Maps Timeline):
  - One JSON file per month, e.g. 2024_MARCH.json or 2024_MARCH.json
  - Root object has key "timelineObjects" → list.
  - Each element is either {"placeVisit": {...}} or {"activitySegment": {...}}.
  - placeVisit.location MAY contain: "name", "address", "latitudeE7", "longitudeE7".
  - placeVisit.duration has "startTimestamp" and "endTimestamp" (ISO-8601 str).
  - Missing fields are tolerated; affected records are flagged as warnings.

All warnings are collected and printed in the Phase 1 summary.
"""

from __future__ import annotations

import json
import os
import re
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class SearchEvent:
    query: str
    timestamp: datetime
    product: str = "Search"


@dataclass
class PlaceVisit:
    name: str
    address: str
    lat: Optional[float]
    lng: Optional[float]
    start: datetime
    end: Optional[datetime]
    place_id: Optional[str] = None


@dataclass
class IngestResult:
    search_events: list[SearchEvent] = field(default_factory=list)
    place_visits: list[PlaceVisit] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    source: str = "unknown"   # "real" | "mock"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Prefixes used in multiple locales to introduce the search query
_SEARCH_PREFIXES = re.compile(
    r"^(buscaste|searched for|you searched for|búsqueda de)\s+",
    re.IGNORECASE,
)


def _parse_iso(ts: str) -> Optional[datetime]:
    """Parse an ISO-8601 timestamp string; return None on failure."""
    if not ts:
        return None
    # Handle both 'Z' suffix and '+00:00' offset
    ts = ts.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(ts)
    except ValueError:
        try:
            # Fallback: strip sub-second precision
            ts_clean = re.sub(r"\.\d+", "", ts)
            return datetime.fromisoformat(ts_clean)
        except ValueError:
            return None


def _latE7_to_float(value: Optional[int]) -> Optional[float]:
    if value is None:
        return None
    return value / 1e7


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def parse_search_history(path: str | Path) -> tuple[list[SearchEvent], list[str]]:
    """
    Parse a MyActivity.json file.

    Returns (events, warnings).
    """
    events: list[SearchEvent] = []
    warns: list[str] = []
    path = Path(path)

    if not path.exists():
        warns.append(f"Search history file not found: {path}")
        return events, warns

    try:
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
    except json.JSONDecodeError as exc:
        warns.append(f"Could not parse {path}: {exc}")
        return events, warns

    if not isinstance(raw, list):
        warns.append(f"{path}: expected a JSON array at root, got {type(raw).__name__}")
        return events, warns

    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            continues = True
            warns.append(f"Search history item {i}: not a dict, skipping")
            continue

        title: str = item.get("title", "")
        time_str: str = item.get("time", "")
        products: list = item.get("products", [])

        if not time_str:
            warns.append(f"Search history item {i} (title={title!r}): missing 'time', skipping")
            continue

        ts = _parse_iso(time_str)
        if ts is None:
            warns.append(f"Search history item {i}: unparseable timestamp {time_str!r}, skipping")
            continue

        # Extract query from title
        query = _SEARCH_PREFIXES.sub("", title).strip()
        if not query:
            continue  # probably not a search event

        product = products[0] if products else "Search"
        events.append(SearchEvent(query=query, timestamp=ts, product=product))

    return events, warns


def parse_location_history(directory: str | Path) -> tuple[list[PlaceVisit], list[str]]:
    """
    Parse all Semantic Location History JSON files in *directory*.

    Returns (visits, warnings).
    """
    visits: list[PlaceVisit] = []
    warns: list[str] = []
    directory = Path(directory)

    if not directory.exists():
        warns.append(f"Location history directory not found: {directory}")
        return visits, warns

    json_files = sorted(directory.glob("*.json"))
    if not json_files:
        warns.append(f"No JSON files found in location history directory: {directory}")
        return visits, warns

    for fpath in json_files:
        try:
            with open(fpath, encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as exc:
            warns.append(f"Could not parse {fpath.name}: {exc}")
            continue

        timeline = data.get("timelineObjects", [])
        if not isinstance(timeline, list):
            warns.append(f"{fpath.name}: 'timelineObjects' is not a list, skipping file")
            continue

        for obj in timeline:
            if "placeVisit" not in obj:
                continue  # skip activitySegment entries

            pv = obj["placeVisit"]
            loc = pv.get("location", {})
            duration = pv.get("duration", {})

            name = loc.get("name", "")
            address = loc.get("address", "")
            lat = _latE7_to_float(loc.get("latitudeE7"))
            lng = _latE7_to_float(loc.get("longitudeE7"))
            place_id = loc.get("placeId")

            start_str = duration.get("startTimestamp", "")
            end_str = duration.get("endTimestamp", "")

            if not start_str:
                warns.append(f"{fpath.name}: placeVisit missing startTimestamp, skipping")
                continue

            start = _parse_iso(start_str)
            if start is None:
                warns.append(f"{fpath.name}: unparseable startTimestamp {start_str!r}, skipping")
                continue

            end = _parse_iso(end_str) if end_str else None

            if not name and not address:
                warns.append(f"{fpath.name}: placeVisit has no name or address, skipping")
                continue

            visits.append(
                PlaceVisit(
                    name=name or "[UNAVAILABLE]",
                    address=address or "[UNAVAILABLE]",
                    lat=lat,
                    lng=lng,
                    start=start,
                    end=end,
                    place_id=place_id,
                )
            )

    return visits, warns


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def ingest(
    search_history_path: Optional[str] = None,
    location_history_dir: Optional[str] = None,
    use_mock: bool = False,
) -> IngestResult:
    """
    Ingest Google Takeout data.

    If use_mock=True, generates an in-memory mock dataset.
    Otherwise, reads from the provided file paths.
    """
    result = IngestResult()

    if use_mock:
        from mock_data import generate_mock_search_history, generate_mock_location_history
        import tempfile, shutil

        # Write mock data to a temp dir and parse it through the same parsers
        # (this validates our parsers against our own schema assumptions)
        tmp = tempfile.mkdtemp(prefix="venue_mock_")
        try:
            # Search history
            sh_path = os.path.join(tmp, "MyActivity.json")
            with open(sh_path, "w", encoding="utf-8") as f:
                json.dump(generate_mock_search_history(), f, ensure_ascii=False)

            # Location history
            loc_dir = os.path.join(tmp, "Semantic Location History")
            os.makedirs(loc_dir)
            for month_key, data in generate_mock_location_history().items():
                with open(os.path.join(loc_dir, f"{month_key}.json"), "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)

            events, w1 = parse_search_history(sh_path)
            visits, w2 = parse_location_history(loc_dir)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

        result.search_events = events
        result.place_visits = visits
        result.warnings = w1 + w2
        result.source = "mock"
        return result

    # --- Real Takeout data ---
    all_warnings: list[str] = []

    if search_history_path:
        events, w = parse_search_history(search_history_path)
        result.search_events = events
        all_warnings.extend(w)
    else:
        all_warnings.append(
            "No search history path provided (--search-history). "
            "Search-based signals will be unavailable."
        )

    if location_history_dir:
        visits, w = parse_location_history(location_history_dir)
        result.place_visits = visits
        all_warnings.extend(w)
    else:
        all_warnings.append(
            "No location history directory provided (--location-history). "
            "Visit-based signals will be unavailable."
        )

    result.warnings = all_warnings
    result.source = "real"
    return result


def print_ingest_summary(result: IngestResult) -> None:
    """Print a human-readable Phase 1 summary."""
    print("\n" + "=" * 60)
    print("PHASE 1 — DATA INGESTION SUMMARY")
    print("=" * 60)
    print(f"  Data source       : {result.source.upper()}")
    print(f"  Search events     : {len(result.search_events):,}")
    print(f"  Place visits      : {len(result.place_visits):,}")

    if result.warnings:
        print(f"\n  Warnings ({len(result.warnings)}):")
        for w in result.warnings:
            print(f"    ⚠  {w}")
    else:
        print("\n  No warnings.")

    if result.search_events:
        oldest = min(e.timestamp for e in result.search_events)
        newest = max(e.timestamp for e in result.search_events)
        print(f"\n  Search history span : {oldest.date()} → {newest.date()}")

    if result.place_visits:
        oldest_v = min(v.start for v in result.place_visits)
        newest_v = max(v.start for v in result.place_visits)
        print(f"  Visit history span  : {oldest_v.date()} → {newest_v.date()}")

    print("=" * 60 + "\n")
