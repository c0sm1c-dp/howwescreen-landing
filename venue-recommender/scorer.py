"""
scorer.py — Phase 3: Score and rank Buenos Aires venues.

Scoring model (fallback / no Places API):
  - category_match  (40%) — how well the venue's categories overlap with the
                             user's top-interest categories
  - barrio_affinity (20%) — whether the user has searched/visited that barrio
  - time_alignment  (20%) — whether the venue's opening hours overlap with the
                             user's peak activity times
  - popularity      (20%) — normalized rating × log(review_count)

When a Google Maps Places API key is provided (places_api_key != None), the
scorer fetches live venue data and replaces the mock venue pool.  Without a
key it uses the MOCK_VENUES from mock_data.py, clearly labelled in output.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

from signals import SignalProfile, DAY_NAMES

# ---------------------------------------------------------------------------
# Venue enrichment via Google Maps Places API (optional)
# ---------------------------------------------------------------------------

# Category mapping between venue tags and our taxonomy labels
TAG_TO_CATEGORY: dict[str, str] = {
    "cafe": "cafe",
    "coworking_friendly": "coworking",
    "craft_beer": "bar",
    "communal_tables": "bar",
    "trivia_nights": "bar",
    "live_jazz": "live_music",
    "intimate_venue": "live_music",
    "coworking": "coworking",
    "networking_events": "event_space",
    "startup_community": "event_space",
    "tango": "tango_milonga",
    "milonga": "tango_milonga",
    "social_dancing": "tango_milonga",
    "beginner_classes": "tango_milonga",
    "rooftop": "bar",
    "cocktails": "bar",
    "wine": "bar",
    "sommelier": "bar",
    "market": "market",
    "outdoor": "outdoor_social",
    "art_exhibitions": "cultural_center",
    "workshops": "cultural_center",
    "community_events": "cultural_center",
    "live_music": "live_music",
    "dinner": "restaurant",
    "indie_music": "live_music",
    "concerts": "live_music",
    "tech_meetups": "event_space",
    "networking": "event_space",
}

PRICE_LABELS = {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ScoredVenue:
    place_id: str
    name: str
    barrio: str
    address: str
    categories: list[str]
    rating: Optional[float]
    review_count: Optional[int]
    price_level: Optional[int]
    maps_url: str
    tags: list[str]
    opening_hours: dict

    # Scoring breakdown
    score_total: float = 0.0
    score_category: float = 0.0
    score_barrio: float = 0.0
    score_time: float = 0.0
    score_popularity: float = 0.0

    # Explanation
    match_reasons: list[str] = field(default_factory=list)
    best_times: str = "[UNAVAILABLE]"
    data_source: str = "mock"  # "mock" | "places_api"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _venue_categories(venue: dict) -> set[str]:
    """Flatten venue['categories'] + tag→category mappings into a set."""
    cats: set[str] = set(venue.get("categories", []))
    for tag in venue.get("tags", []):
        mapped = TAG_TO_CATEGORY.get(tag)
        if mapped:
            cats.add(mapped)
    return cats


def _category_score(venue_cats: set[str], profile: SignalProfile) -> float:
    """
    0–1 score for how much the venue's categories overlap with
    the user's interest profile.
    """
    if not profile.category_scores:
        return 0.0

    total_weight = sum(profile.category_scores.values())
    if total_weight == 0:
        return 0.0

    matched_weight = sum(
        profile.category_scores.get(cat, 0)
        for cat in venue_cats
    )
    return min(matched_weight / total_weight, 1.0)


def _barrio_score(venue: dict, profile: SignalProfile) -> float:
    """0–1 score for barrio familiarity."""
    if not profile.top_barrios:
        return 0.0
    barrio = venue.get("barrio", "").lower().title()
    # Normalise (e.g. "Palermo Soho" → "Palermo")
    barrio_root = barrio.split()[0] if barrio else ""
    total = sum(profile.top_barrios.values())
    exact = profile.top_barrios.get(barrio, 0)
    root_matches = sum(v for k, v in profile.top_barrios.items() if k.startswith(barrio_root))
    return min((exact + root_matches * 0.5) / max(total, 1), 1.0)


def _opening_hours_overlap(venue: dict, profile: SignalProfile) -> float:
    """
    0–1 score: what fraction of the user's peak hours fall within
    the venue's typical open hours?
    """
    peak_hours = profile.time_pattern.peak_hours
    if not peak_hours:
        return 0.5  # no data — neutral

    periods = venue.get("opening_hours", {}).get("periods", [])
    if not periods:
        return 0.5  # no hours data — neutral

    def _open_at_hour(h: int) -> bool:
        for period in periods:
            open_time = int(period.get("open", {}).get("time", "0000"))
            close_time = int(period.get("close", {}).get("time", "2359"))
            open_h = open_time // 100
            close_h = close_time // 100
            # Handle venues that close after midnight
            if close_h < open_h:
                if h >= open_h or h < close_h:
                    return True
            else:
                if open_h <= h < close_h:
                    return True
        return False

    matched = sum(1 for h in peak_hours if _open_at_hour(h))
    return matched / len(peak_hours)


def _popularity_score(venue: dict) -> float:
    """0–1 score combining rating and review volume."""
    rating = venue.get("rating")
    reviews = venue.get("user_ratings_total", 0)

    if rating is None:
        return 0.0

    # Normalise rating (assume max 5.0)
    norm_rating = (rating - 1.0) / 4.0  # maps 1→0, 5→1

    # Log-scale review count (100 reviews → 0.5, 1000 → 0.75)
    if reviews > 0:
        log_reviews = math.log10(reviews) / 4.0  # log10(10000) = 4 → max 1
        log_reviews = min(log_reviews, 1.0)
    else:
        log_reviews = 0.0

    return 0.6 * norm_rating + 0.4 * log_reviews


def _best_times_label(venue: dict, profile: SignalProfile) -> str:
    """Human-readable best-times string."""
    peak_hours = profile.time_pattern.peak_hours
    peak_days = profile.time_pattern.peak_days

    if not peak_hours and not peak_days:
        return "[UNAVAILABLE — no activity data]"

    parts = []
    if peak_days:
        parts.append(", ".join(peak_days[:3]))
    if peak_hours:
        # Express as a range
        min_h = min(peak_hours)
        max_h = max(peak_hours)
        parts.append(f"{min_h:02d}:00–{max_h + 1:02d}:00")

    return " | ".join(parts) if parts else "[UNAVAILABLE]"


def _build_match_reasons(
    venue: dict,
    venue_cats: set[str],
    profile: SignalProfile,
    scores: dict,
) -> list[str]:
    """Generate 2–4 bullet-point match reasons."""
    reasons = []

    # Category match
    matched_cats = venue_cats & set(profile.category_scores.keys())
    if matched_cats:
        top_cat = max(matched_cats, key=lambda c: profile.category_scores.get(c, 0))
        cat_label = top_cat.replace("_", " ").title()
        reasons.append(f"Matches your interest in {cat_label}")

    # Barrio affinity
    barrio = venue.get("barrio", "")
    barrio_root = barrio.split()[0] if barrio else ""
    matching_barrios = [k for k in profile.top_barrios if k.startswith(barrio_root)]
    if matching_barrios:
        reasons.append(f"You've searched {barrio} {profile.top_barrios.get(barrio, sum(profile.top_barrios.get(b, 0) for b in matching_barrios))}× — this is your turf")

    # Time alignment
    if scores["time"] >= 0.7:
        reasons.append(f"Open during your peak hours ({profile.time_pattern.human_hours()})")

    # Social tags
    social_tags = {"communal_tables", "social", "networking", "community_events",
                   "trivia_nights", "social_dancing", "beginner_friendly",
                   "laptop_friendly", "tech_meetups", "outdoor"}
    matching_social = social_tags & set(venue.get("tags", []))
    if matching_social:
        tag_label = list(matching_social)[0].replace("_", " ")
        reasons.append(f"Tagged as '{tag_label}' — high social opportunity")

    # Rating
    rating = venue.get("rating")
    reviews = venue.get("user_ratings_total", 0)
    if rating and rating >= 4.5:
        reasons.append(f"Highly rated: {rating}/5 from {reviews:,} reviews")
    elif rating and rating >= 4.0:
        reasons.append(f"Well rated: {rating}/5 from {reviews:,} reviews")

    return reasons[:4] if reasons else ["No specific match reasons available"]


# ---------------------------------------------------------------------------
# Places API integration (stub — activated when api_key is provided)
# ---------------------------------------------------------------------------

def fetch_venues_from_places_api(
    api_key: str,
    location: tuple[float, float] = (-34.6037, -58.3816),  # Buenos Aires centroid
    radius_m: int = 15000,
    max_results: int = 60,
) -> list[dict]:
    """
    Fetch nearby venues from the Google Maps Places API (New).

    Requires a valid API key with the Places API (New) enabled.
    Returns a list of venue dicts normalised to the same schema as MOCK_VENUES.

    NOTE: This function is not called in fallback/mock mode.
    """
    try:
        import requests
    except ImportError:
        raise RuntimeError(
            "The 'requests' library is required for Places API mode. "
            "Run: pip install requests"
        )

    endpoint = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,"
            "places.location,places.rating,places.userRatingCount,"
            "places.priceLevel,places.types,places.regularOpeningHours,"
            "places.googleMapsUri"
        ),
    }
    # Social venue types to search for
    included_types = [
        "bar", "cafe", "night_club", "restaurant", "cultural_center",
        "tourist_attraction", "event_venue",
    ]

    all_venues: list[dict] = []
    for venue_type in included_types:
        payload = {
            "includedTypes": [venue_type],
            "maxResultCount": min(max_results, 20),
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": location[0], "longitude": location[1]},
                    "radius": float(radius_m),
                }
            },
        }
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=15)
        if resp.status_code != 200:
            print(f"  [Places API] Warning: {venue_type} search returned {resp.status_code}")
            continue

        data = resp.json()
        for place in data.get("places", []):
            venue = _normalise_places_response(place)
            if venue:
                all_venues.append(venue)

    # Deduplicate by place_id
    seen: set[str] = set()
    unique: list[dict] = []
    for v in all_venues:
        if v["place_id"] not in seen:
            seen.add(v["place_id"])
            unique.append(v)

    return unique


def _normalise_places_response(place: dict) -> Optional[dict]:
    """Convert a raw Places API (New) response into our venue schema."""
    place_id = place.get("id")
    if not place_id:
        return None

    name = place.get("displayName", {}).get("text", "[UNAVAILABLE]")
    address = place.get("formattedAddress", "[UNAVAILABLE]")
    loc = place.get("location", {})
    lat = loc.get("latitude")
    lng = loc.get("longitude")
    rating = place.get("rating")
    reviews = place.get("userRatingCount")
    price_raw = place.get("priceLevel", "")
    price_map = {
        "PRICE_LEVEL_INEXPENSIVE": 1,
        "PRICE_LEVEL_MODERATE": 2,
        "PRICE_LEVEL_EXPENSIVE": 3,
        "PRICE_LEVEL_VERY_EXPENSIVE": 4,
    }
    price_level = price_map.get(price_raw)
    categories = place.get("types", [])
    maps_url = place.get("googleMapsUri", f"https://maps.google.com/?place_id={place_id}")

    # Approximate barrio from address
    barrio = _extract_barrio_from_address(address)

    return {
        "place_id": place_id,
        "name": name,
        "barrio": barrio,
        "address": address,
        "categories": categories,
        "rating": rating,
        "user_ratings_total": reviews,
        "price_level": price_level,
        "opening_hours": place.get("regularOpeningHours", {}),
        "maps_url": maps_url,
        "lat": lat,
        "lng": lng,
        "tags": [],  # Places API (New) doesn't return tags; would need review parsing
    }


def _extract_barrio_from_address(address: str) -> str:
    """Extract a barrio name from a formatted address string."""
    KNOWN_BARRIOS = [
        "Palermo Soho", "Palermo Hollywood", "Palermo Viejo", "Palermo",
        "San Telmo", "Recoleta", "Villa Crespo", "Almagro", "Chacarita",
        "Colegiales", "Belgrano", "Caballito", "Balvanera", "San Nicolás",
        "Monserrat", "Puerto Madero", "La Boca", "Barracas", "Floresta",
        "Flores", "Once",
    ]
    for barrio in KNOWN_BARRIOS:
        if barrio.lower() in address.lower():
            return barrio
    return "Buenos Aires"


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------

def score_venues(
    profile: SignalProfile,
    venues: Optional[list[dict]] = None,
    places_api_key: Optional[str] = None,
    top_n: int = 10,
) -> list[ScoredVenue]:
    """
    Score and rank venues against the user's signal profile.

    Args:
        profile:          SignalProfile from signals.py
        venues:           Optional explicit venue list (for testing).
                          If None, uses Places API or mock data.
        places_api_key:   If provided, fetches live data from Places API.
        top_n:            Number of top venues to return.

    Returns:
        List of ScoredVenue sorted by score_total descending.
    """
    data_source = "mock"

    if venues is None:
        if places_api_key:
            print("  Fetching venues from Google Maps Places API…")
            venues = fetch_venues_from_places_api(places_api_key)
            data_source = "places_api"
            print(f"  Retrieved {len(venues)} unique venues from Places API.")
        else:
            from mock_data import MOCK_VENUES
            venues = MOCK_VENUES
            data_source = "mock"

    scored: list[ScoredVenue] = []

    for venue in venues:
        venue_cats = _venue_categories(venue)

        s_cat = _category_score(venue_cats, profile)
        s_bar = _barrio_score(venue, profile)
        s_time = _opening_hours_overlap(venue, profile)
        s_pop = _popularity_score(venue)

        # Weighted total
        total = (
            0.40 * s_cat
            + 0.20 * s_bar
            + 0.20 * s_time
            + 0.20 * s_pop
        )

        reasons = _build_match_reasons(venue, venue_cats, profile, {
            "category": s_cat,
            "barrio": s_bar,
            "time": s_time,
            "popularity": s_pop,
        })

        best_times = _best_times_label(venue, profile)

        sv = ScoredVenue(
            place_id=venue["place_id"],
            name=venue["name"],
            barrio=venue.get("barrio", "[UNAVAILABLE]"),
            address=venue.get("address", "[UNAVAILABLE]"),
            categories=list(venue.get("categories", [])),
            rating=venue.get("rating"),
            review_count=venue.get("user_ratings_total"),
            price_level=venue.get("price_level"),
            maps_url=venue.get("maps_url", ""),
            tags=venue.get("tags", []),
            opening_hours=venue.get("opening_hours", {}),
            score_total=round(total, 4),
            score_category=round(s_cat, 4),
            score_barrio=round(s_bar, 4),
            score_time=round(s_time, 4),
            score_popularity=round(s_pop, 4),
            match_reasons=reasons,
            best_times=best_times,
            data_source=data_source,
        )
        scored.append(sv)

    scored.sort(key=lambda v: v.score_total, reverse=True)
    return scored[:top_n]


def print_score_summary(venues: list[ScoredVenue]) -> None:
    """Print a Phase 3 summary table."""
    print("=" * 60)
    print("PHASE 3 — VENUE SCORING SUMMARY")
    print("=" * 60)
    print(f"  {'#':<3} {'Venue':<38} {'Score':>6} {'Rating':>7}")
    print("  " + "-" * 56)
    for rank, v in enumerate(venues, 1):
        rating_str = f"{v.rating}/5" if v.rating is not None else "[N/A]"
        name_trunc = v.name[:37] + "…" if len(v.name) > 38 else v.name
        print(f"  {rank:<3} {name_trunc:<38} {v.score_total:>6.3f} {rating_str:>7}")
    print("=" * 60 + "\n")
