# Buenos Aires Venue Recommender

A Python CLI that analyses your personal Google data to surface the **best venues
in Buenos Aires for meeting people socially** — ranked by your actual behavioural
patterns rather than generic popularity.

---

## What it does

1. **Reads your Google Takeout export** (search history + Maps location timeline)
2. **Extracts social signals**: Buenos Aires-related queries, venue visits,
   time-of-day/day-of-week activity patterns
3. **Scores venues** using category overlap, neighbourhood affinity, hours
   alignment, and Google Maps ratings
4. **Outputs a self-contained HTML page** with ranked recommendations, score
   breakdowns, and direct Google Maps links

---

## Privacy notice

> **All data stays local.** The app reads your Takeout files on disk, runs
> entirely in memory, and writes a single HTML file. No personal data is sent
> to any third-party service except:
>
> - **Google Maps Places API** — if you provide an API key, venue names and
>   ratings are fetched from Google. Only a location (Buenos Aires) and venue
>   type are sent; none of your personal data is transmitted.
>
> Use `--dry-run` to inspect exactly which files would be read before
> committing.

---

## Requirements

- Python 3.10 or later
- No external libraries required for mock/fallback mode
- `requests` is needed only if you use a Places API key:

```bash
pip install -r requirements.txt
```

---

## Quickstart — mock mode (no Takeout export needed)

```bash
cd venue-recommender
python main.py --mock
```

This generates `recommendations.html` in the current directory using built-in
demo data. Open it in any browser.

---

## How to export your Google Takeout data

1. Go to [https://takeout.google.com](https://takeout.google.com)
2. Click **Deselect all**, then re-enable:
   - **My Activity** → select only *Search* activity
   - **Maps (your places)** and **Location History**
3. Choose **Export once**, format **JSON**, any delivery method
4. Download and unzip the archive

The relevant files will be at paths like:

```
Takeout/
  My Activity/
    Search/
      MyActivity.json          ← pass to --search-history
  Location History/
    Semantic Location History/ ← pass to --location-history (directory)
      2024_JANUARY.json
      2024_FEBRUARY.json
      ...
```

---

## Usage

```bash
# Mock mode (demo):
python main.py --mock

# Real Takeout data:
python main.py \
  --search-history  "~/Takeout/My Activity/Search/MyActivity.json" \
  --location-history "~/Takeout/Location History/Semantic Location History/"

# See what would happen without processing anything:
python main.py --mock --dry-run

# Use Google Maps Places API for live venue data:
python main.py --mock --places-api-key YOUR_KEY_HERE
# or set the environment variable:
export GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
python main.py --mock

# Show verbose phase-by-phase summaries:
python main.py --mock --verbose

# Also print a text table to stdout:
python main.py --mock --text

# Change output path or number of results:
python main.py --mock --output my_report.html --top 15

# Save the mock Takeout data as real files (to inspect the expected format):
python main.py --save-mock-takeout ./sample_takeout
```

---

## Google Maps Places API key

The app works without an API key in **fallback mode** (uses a built-in mock
venue pool). To get live venue data:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the **Places API (New)**
3. Create an API key under *APIs & Services → Credentials*
4. Restrict the key to the *Places API (New)* for security
5. Pass it via `--places-api-key` or the `GOOGLE_MAPS_API_KEY` env var

---

## JSON schema assumptions

### MyActivity.json (Search History)

```json
[
  {
    "header": "Búsqueda",
    "title": "Buscaste <query>",
    "titleUrl": "https://www.google.com/search?q=...",
    "time": "2024-03-15T22:30:00.000Z",
    "products": ["Búsqueda"],
    "subtitles": [],
    "details": []
  }
]
```

- Root is a **JSON array**
- `time` is ISO-8601 (required; records without it are skipped with a warning)
- `title` prefix `"Buscaste "` (Spanish) or `"Searched for "` (English) is
  stripped to extract the raw query
- `products`, `subtitles`, and `details` are ignored

### Semantic Location History (monthly JSON files)

```json
{
  "timelineObjects": [
    {
      "placeVisit": {
        "location": {
          "name": "Venue Name",
          "address": "Street, Barrio, Buenos Aires",
          "latitudeE7": -344356780,
          "longitudeE7": -584258300,
          "placeId": "ChIJ..."
        },
        "duration": {
          "startTimestamp": "2024-03-15T21:00:00Z",
          "endTimestamp": "2024-03-15T23:30:00Z"
        },
        "placeConfidence": "HIGH_CONFIDENCE"
      }
    },
    { "activitySegment": { ... } }
  ]
}
```

- `activitySegment` entries are ignored (only `placeVisit` is used)
- `location.name` or `location.address` must be present (records with neither
  are skipped)
- `startTimestamp` is required; `endTimestamp` is optional
- Coordinates are in E7 format (integer, divide by 1e7 for decimal degrees)

---

## Project structure

```
venue-recommender/
├── main.py          Entry point — CLI, argument parsing, pipeline orchestration
├── ingest.py        Phase 1: parse Google Takeout JSON files
├── signals.py       Phase 2: extract Buenos Aires social signals
├── scorer.py        Phase 3: score and rank venues
├── output.py        Phase 4: render self-contained HTML report
├── mock_data.py     Demo dataset: synthetic Takeout data + venue pool
├── requirements.txt Python dependencies
└── README.md        This file
```

---

## Scoring model

| Dimension       | Weight | Description |
|-----------------|--------|-------------|
| Category match  | 40%    | Overlap between venue type and user's top-interest categories |
| Barrio affinity | 20%    | Whether the user has searched or visited that neighbourhood |
| Hours alignment | 20%    | How much of the venue's open hours overlap with the user's peak activity times |
| Popularity      | 20%    | Normalised rating × log(review count) from Google Maps |

All scores are 0–1; the final score is displayed as a percentage (0–100).

---

## Anti-hallucination guarantees

- In **Places API mode**: all venue names, ratings, and review counts come
  directly from the Google Maps Places API. The app never invents venue data.
- In **mock/fallback mode**: venues are clearly labelled `[MOCK DATA]` in the
  HTML output with a prominent disclaimer banner.
- Fields unavailable in the API response are labelled `[UNAVAILABLE]` rather
  than estimated.
- If no Buenos Aires signals are found in the Takeout data, the app surfaces a
  clear warning explaining what was found vs. what was expected.
