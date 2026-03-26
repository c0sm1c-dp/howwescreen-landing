"""
mock_data.py — Realistic Buenos Aires mock dataset for development/demo purposes.

This module provides two things:
  1. A mock Google Takeout export (search history + location timeline).
  2. A mock venue pool that simulates what the Google Places API would return.

IMPORTANT: All venue names, coordinates, and ratings in this file are
ILLUSTRATIVE MOCK DATA generated for development. They do not represent
real establishments and should not be treated as factual recommendations.
In production mode (with a real Places API key), all venue data is fetched
live from the Google Maps Places API.
"""

from __future__ import annotations
import json
import random
from datetime import datetime, timedelta, timezone

# ---------------------------------------------------------------------------
# Mock Search History  (mirrors MyActivity.json from Google Takeout)
# ---------------------------------------------------------------------------

MOCK_SEARCH_QUERIES = [
    # Social / nightlife
    "bares palermo buenos aires",
    "mejores bares palermo soho",
    "bar de vinos recoleta",
    "cervecerías artesanales villa crespo",
    "rooftop bar buenos aires",
    "bares jazz san telmo",
    # Cafés / coworking
    "cafés con wifi palermo buenos aires",
    "mejores cafes para trabajar buenos aires",
    "coworking palermo hollywood",
    "cafe specialty coffee buenos aires",
    "cafe tranquilo para estudiar recoleta",
    # Meetups / events
    "meetup tecnología buenos aires 2024",
    "networking eventos startup buenos aires",
    "clases de baile tango buenos aires",
    "milonga san telmo horarios",
    "clases de salsa palermo",
    # Culture / dining
    "restaurante con música en vivo buenos aires",
    "feria artesanal palermo domingo",
    "mercado de pulgas san telmo horarios",
    "shows teatro palermo",
    "exposición arte buenos aires 2024",
    # Fitness / active social
    "parque centenary running group",
    "yoga clase grupal palermo",
    "clases crossfit villa crespo",
    # Generic location searches
    "palermo soho que hacer",
    "san telmo turismo",
    "recoleta barrio cosas para hacer",
    "villa crespo bares",
]


def _make_search_event(query: str, base_dt: datetime) -> dict:
    """Format a single search event in MyActivity.json style."""
    return {
        "header": "Búsqueda",
        "title": f"Buscaste {query}",
        "titleUrl": f"https://www.google.com/search?q={query.replace(' ', '+')}",
        "subtitles": [],
        "details": [],
        "activityControls": ["Actividad web y de aplicaciones"],
        "products": ["Búsqueda"],
        "time": base_dt.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }


def generate_mock_search_history() -> list[dict]:
    """Return a list of search events spread across the past 6 months."""
    events = []
    now = datetime(2024, 3, 15, tzinfo=timezone.utc)
    random.seed(42)
    for i, query in enumerate(MOCK_SEARCH_QUERIES):
        # Spread queries across 180 days; skew toward evenings / weekends
        days_ago = random.randint(1, 180)
        hour = random.choice([10, 12, 14, 19, 20, 21, 22, 23])
        minute = random.randint(0, 59)
        dt = now - timedelta(days=days_ago, hours=(23 - hour), minutes=minute)
        events.append(_make_search_event(query, dt))
    # Sort newest first (matches real Takeout order)
    events.sort(key=lambda e: e["time"], reverse=True)
    return events


# ---------------------------------------------------------------------------
# Mock Location History  (mirrors Semantic Location History JSON)
# ---------------------------------------------------------------------------

# Each entry: (place_name, barrio, lat_e7, lng_e7, category)
MOCK_VISITED_PLACES = [
    ("Café Palermo Wifi", "Palermo Soho", -344356780, -584258300, "cafe"),
    ("Cervecería Villa Crespo", "Villa Crespo", -344498210, -584432100, "bar"),
    ("Bar Jazz San Telmo", "San Telmo", -344618900, -583820500, "bar"),
    ("Coworking Palermo Hollywood", "Palermo Hollywood", -344279000, -584380000, "coworking"),
    ("Milonga La Catedral", "Almagro", -344575000, -583968000, "tango_milonga"),
    ("Rooftop Bar Recoleta", "Recoleta", -344127000, -583907000, "bar"),
    ("Feria Artesanal Palermo", "Palermo Soho", -344401000, -584250000, "market"),
    ("Wine Bar Recoleta", "Recoleta", -344100000, -583920000, "bar"),
    ("Café Specialty Colegiales", "Colegiales", -344228000, -584365000, "cafe"),
    ("Restaurante Con Música Palermo", "Palermo Viejo", -344350000, -584310000, "restaurant"),
    ("Cervecería Artesanal San Telmo", "San Telmo", -344650000, -583835000, "bar"),
    ("Espacio Cultural Almagro", "Almagro", -344560000, -583990000, "cultural_center"),
    ("Clases Tango Centro", "San Nicolás", -344600000, -583720000, "dance_school"),
    ("Parque Palermo Running", "Palermo", -344408000, -584573000, "park"),
    ("Bar Indie Chacarita", "Chacarita", -344212000, -584493000, "bar"),
]


def _make_place_visit(
    place: tuple,
    base_dt: datetime,
    duration_minutes: int,
) -> dict:
    name, barrio, lat_e7, lng_e7, category = place
    start = base_dt
    end = base_dt + timedelta(minutes=duration_minutes)
    return {
        "placeVisit": {
            "location": {
                "latitudeE7": lat_e7,
                "longitudeE7": lng_e7,
                "placeId": f"ChIJMOCK_{name.replace(' ', '_').upper()}",
                "address": f"{barrio}, Buenos Aires, Argentina",
                "name": name,
                "locationConfidence": round(random.uniform(72, 98), 1),
            },
            "duration": {
                "startTimestamp": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "endTimestamp": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            },
            "placeConfidence": "HIGH_CONFIDENCE",
            "visitConfidence": random.randint(75, 99),
        }
    }


def generate_mock_location_history() -> dict:
    """
    Return a dict keyed by 'YYYY_MONTHNAME' containing Semantic Location
    History objects — the same structure Google Takeout produces.
    """
    random.seed(99)
    now = datetime(2024, 3, 15, tzinfo=timezone.utc)
    months: dict[str, list[dict]] = {}

    for _ in range(60):  # 60 random visits across 6 months
        place = random.choice(MOCK_VISITED_PLACES)
        days_ago = random.randint(1, 180)
        # Social hours: mostly evenings / weekends
        hour = random.choice([11, 13, 15, 18, 19, 20, 21, 22, 23])
        minute = random.randint(0, 59)
        dt = now - timedelta(days=days_ago) + timedelta(hours=hour, minutes=minute)
        dt = dt.replace(tzinfo=timezone.utc)
        duration = random.randint(30, 180)

        month_key = dt.strftime("%Y_%B").upper()
        if month_key not in months:
            months[month_key] = []
        months[month_key].append(_make_place_visit(place, dt, duration))

    # Wrap in the Semantic Location History envelope
    return {
        month: {"timelineObjects": visits}
        for month, visits in months.items()
    }


# ---------------------------------------------------------------------------
# Mock Venue Pool  (simulates Places API search results for Buenos Aires)
# ---------------------------------------------------------------------------

MOCK_VENUES: list[dict] = [
    {
        "place_id": "MOCK_001",
        "name": "Café Palermo Wifi Hub",
        "barrio": "Palermo Soho",
        "address": "Thames 1885, Palermo, Buenos Aires",
        "categories": ["cafe", "coworking_friendly"],
        "rating": 4.5,
        "user_ratings_total": 312,
        "price_level": 2,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "0800"}, "close": {"day": d, "time": "2200"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Café+Palermo+Wifi+Hub,+Buenos+Aires",
        "lat": -34.5930,
        "lng": -58.4258,
        "tags": ["wifi", "specialty_coffee", "laptop_friendly", "community_events"],
    },
    {
        "place_id": "MOCK_002",
        "name": "Cervecería Artesanal Villa Crespo",
        "barrio": "Villa Crespo",
        "address": "Av. Corrientes 5200, Villa Crespo, Buenos Aires",
        "categories": ["bar", "brewery"],
        "rating": 4.6,
        "user_ratings_total": 489,
        "price_level": 2,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "1800"}, "close": {"day": d, "time": "0200"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Cervecería+Artesanal+Villa+Crespo,+Buenos+Aires",
        "lat": -34.5988,
        "lng": -58.4432,
        "tags": ["craft_beer", "communal_tables", "trivia_nights", "social"],
    },
    {
        "place_id": "MOCK_003",
        "name": "Jazz Club San Telmo",
        "barrio": "San Telmo",
        "address": "Defensa 695, San Telmo, Buenos Aires",
        "categories": ["bar", "live_music"],
        "rating": 4.7,
        "user_ratings_total": 621,
        "price_level": 2,
        "opening_hours": {
            "open_now": False,
            "periods": [{"open": {"day": d, "time": "2000"}, "close": {"day": d, "time": "0300"}} for d in [3, 4, 5, 6]],
        },
        "maps_url": "https://maps.google.com/?q=Jazz+Club+San+Telmo,+Buenos+Aires",
        "lat": -34.6189,
        "lng": -58.3720,
        "tags": ["live_jazz", "intimate_venue", "social", "drinks"],
    },
    {
        "place_id": "MOCK_004",
        "name": "Espacio Coworking Palermo Hollywood",
        "barrio": "Palermo Hollywood",
        "address": "Humboldt 1550, Palermo, Buenos Aires",
        "categories": ["coworking", "event_space"],
        "rating": 4.4,
        "user_ratings_total": 187,
        "price_level": 2,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "0900"}, "close": {"day": d, "time": "2100"}} for d in range(1, 6)],
        },
        "maps_url": "https://maps.google.com/?q=Espacio+Coworking+Palermo+Hollywood,+Buenos+Aires",
        "lat": -34.5879,
        "lng": -58.4380,
        "tags": ["coworking", "networking_events", "startup_community", "wifi"],
    },
    {
        "place_id": "MOCK_005",
        "name": "Milonga La Catedral Almagro",
        "barrio": "Almagro",
        "address": "Sarmiento 4006, Almagro, Buenos Aires",
        "categories": ["dance_school", "tango_milonga", "cultural_center"],
        "rating": 4.8,
        "user_ratings_total": 934,
        "price_level": 1,
        "opening_hours": {
            "open_now": False,
            "periods": [{"open": {"day": d, "time": "2200"}, "close": {"day": d, "time": "0500"}} for d in [3, 4, 5, 6]],
        },
        "maps_url": "https://maps.google.com/?q=Milonga+La+Catedral+Almagro,+Buenos+Aires",
        "lat": -34.6055,
        "lng": -58.4168,
        "tags": ["tango", "milonga", "beginner_classes", "social_dancing", "cultural"],
    },
    {
        "place_id": "MOCK_006",
        "name": "Rooftop Recoleta Bar",
        "barrio": "Recoleta",
        "address": "Av. Callao 1234, Recoleta, Buenos Aires",
        "categories": ["bar", "rooftop"],
        "rating": 4.3,
        "user_ratings_total": 408,
        "price_level": 3,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "1700"}, "close": {"day": d, "time": "0100"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Rooftop+Recoleta+Bar,+Buenos Aires",
        "lat": -34.5880,
        "lng": -58.3940,
        "tags": ["rooftop", "cocktails", "sunset_views", "social", "city_views"],
    },
    {
        "place_id": "MOCK_007",
        "name": "Feria Artesanal Palermo Domingos",
        "barrio": "Palermo Soho",
        "address": "Plaza Serrano, Palermo, Buenos Aires",
        "categories": ["market", "outdoor_event"],
        "rating": 4.5,
        "user_ratings_total": 1240,
        "price_level": 1,
        "opening_hours": {
            "open_now": False,
            "periods": [{"open": {"day": 0, "time": "1000"}, "close": {"day": 0, "time": "2000"}}],
        },
        "maps_url": "https://maps.google.com/?q=Feria+Artesanal+Palermo,+Buenos+Aires",
        "lat": -34.5930,
        "lng": -58.4250,
        "tags": ["market", "outdoor", "social", "art", "sundays", "community"],
    },
    {
        "place_id": "MOCK_008",
        "name": "Bar de Vinos Recoleta",
        "barrio": "Recoleta",
        "address": "Junín 1885, Recoleta, Buenos Aires",
        "categories": ["bar", "wine_bar"],
        "rating": 4.6,
        "user_ratings_total": 356,
        "price_level": 3,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "1800"}, "close": {"day": d, "time": "0100"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Bar+de+Vinos+Recoleta,+Buenos+Aires",
        "lat": -34.5875,
        "lng": -58.3950,
        "tags": ["wine", "intimate", "date_night", "sommelier", "malbec"],
    },
    {
        "place_id": "MOCK_009",
        "name": "Café Specialty Colegiales",
        "barrio": "Colegiales",
        "address": "Av. Álvarez Thomas 400, Colegiales, Buenos Aires",
        "categories": ["cafe"],
        "rating": 4.7,
        "user_ratings_total": 278,
        "price_level": 2,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "0730"}, "close": {"day": d, "time": "2000"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Café+Specialty+Colegiales,+Buenos+Aires",
        "lat": -34.5728,
        "lng": -58.4365,
        "tags": ["specialty_coffee", "single_origin", "barista_events", "cozy"],
    },
    {
        "place_id": "MOCK_010",
        "name": "Restaurante Música en Vivo Palermo",
        "barrio": "Palermo Viejo",
        "address": "Costa Rica 4800, Palermo Viejo, Buenos Aires",
        "categories": ["restaurant", "live_music"],
        "rating": 4.4,
        "user_ratings_total": 512,
        "price_level": 3,
        "opening_hours": {
            "open_now": False,
            "periods": [{"open": {"day": d, "time": "2000"}, "close": {"day": d, "time": "0130"}} for d in [2, 3, 4, 5, 6]],
        },
        "maps_url": "https://maps.google.com/?q=Restaurante+Música+Palermo,+Buenos+Aires",
        "lat": -34.5850,
        "lng": -58.4310,
        "tags": ["live_music", "dinner", "social", "folk", "rock_nacional"],
    },
    {
        "place_id": "MOCK_011",
        "name": "Cervecería San Telmo Histórico",
        "barrio": "San Telmo",
        "address": "Bolívar 498, San Telmo, Buenos Aires",
        "categories": ["bar", "brewery"],
        "rating": 4.5,
        "user_ratings_total": 723,
        "price_level": 2,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "1700"}, "close": {"day": d, "time": "0200"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Cervecería+San+Telmo,+Buenos+Aires",
        "lat": -34.6185,
        "lng": -58.3735,
        "tags": ["craft_beer", "historic_building", "social", "outdoor_seating"],
    },
    {
        "place_id": "MOCK_012",
        "name": "Espacio Cultural Almagro",
        "barrio": "Almagro",
        "address": "Av. Rivadavia 4300, Almagro, Buenos Aires",
        "categories": ["cultural_center", "event_space"],
        "rating": 4.6,
        "user_ratings_total": 445,
        "price_level": 1,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "1500"}, "close": {"day": d, "time": "2300"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Espacio+Cultural+Almagro,+Buenos+Aires",
        "lat": -34.6210,
        "lng": -58.4100,
        "tags": ["art_exhibitions", "workshops", "community_events", "cinema", "theater"],
    },
    {
        "place_id": "MOCK_013",
        "name": "Academia Tango Centro",
        "barrio": "San Nicolás",
        "address": "Corrientes 1234, San Nicolás, Buenos Aires",
        "categories": ["dance_school", "tango_milonga"],
        "rating": 4.7,
        "user_ratings_total": 389,
        "price_level": 2,
        "opening_hours": {
            "open_now": False,
            "periods": [{"open": {"day": d, "time": "1800"}, "close": {"day": d, "time": "2300"}} for d in range(7)],
        },
        "maps_url": "https://maps.google.com/?q=Academia+Tango+Centro,+Buenos+Aires",
        "lat": -34.6050,
        "lng": -58.3850,
        "tags": ["tango_classes", "beginner_friendly", "social_dancing", "cultural"],
    },
    {
        "place_id": "MOCK_014",
        "name": "Bar Indie Chacarita",
        "barrio": "Chacarita",
        "address": "Av. Corrientes 6500, Chacarita, Buenos Aires",
        "categories": ["bar", "live_music"],
        "rating": 4.4,
        "user_ratings_total": 298,
        "price_level": 2,
        "opening_hours": {
            "open_now": False,
            "periods": [{"open": {"day": d, "time": "2000"}, "close": {"day": d, "time": "0400"}} for d in [4, 5, 6]],
        },
        "maps_url": "https://maps.google.com/?q=Bar+Indie+Chacarita,+Buenos+Aires",
        "lat": -34.5845,
        "lng": -58.4630,
        "tags": ["indie_music", "concerts", "young_crowd", "social", "underground"],
    },
    {
        "place_id": "MOCK_015",
        "name": "Meetup Tech Hub Palermo",
        "barrio": "Palermo",
        "address": "Godoy Cruz 2550, Palermo, Buenos Aires",
        "categories": ["coworking", "event_space"],
        "rating": 4.3,
        "user_ratings_total": 156,
        "price_level": 2,
        "opening_hours": {
            "open_now": True,
            "periods": [{"open": {"day": d, "time": "0900"}, "close": {"day": d, "time": "2200"}} for d in range(1, 6)],
        },
        "maps_url": "https://maps.google.com/?q=Meetup+Tech+Hub+Palermo,+Buenos+Aires",
        "lat": -34.5830,
        "lng": -58.4290,
        "tags": ["tech_meetups", "startup_events", "networking", "coworking", "workshops"],
    },
]


def save_mock_takeout(output_dir: str = "mock_takeout") -> None:
    """
    Write mock Takeout files to disk so they can be used as
    real file inputs during development.
    """
    import os
    os.makedirs(output_dir, exist_ok=True)

    # Search history
    search_path = os.path.join(output_dir, "MyActivity.json")
    with open(search_path, "w", encoding="utf-8") as f:
        json.dump(generate_mock_search_history(), f, ensure_ascii=False, indent=2)

    # Location history — one file per month
    loc_dir = os.path.join(output_dir, "Semantic Location History")
    os.makedirs(loc_dir, exist_ok=True)
    location_data = generate_mock_location_history()
    for month_key, data in location_data.items():
        path = os.path.join(loc_dir, f"{month_key}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Mock Takeout data written to '{output_dir}/'")
    print(f"  {search_path}")
    for month_key in location_data:
        print(f"  {loc_dir}/{month_key}.json")
