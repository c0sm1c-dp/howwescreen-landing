"""
output.py — Phase 4: Render venue recommendations to HTML (or plain text).

The HTML output is a self-contained single-file page with inline CSS and
no external dependencies — open it in any browser.
"""

from __future__ import annotations

import html
import json
import os
from datetime import datetime
from typing import Optional

from scorer import ScoredVenue, PRICE_LABELS
from signals import SignalProfile


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _esc(s: str) -> str:
    return html.escape(str(s))


def _star_display(rating: Optional[float]) -> str:
    if rating is None:
        return "[UNAVAILABLE]"
    full = int(rating)
    half = 1 if (rating - full) >= 0.5 else 0
    empty = 5 - full - half
    return "★" * full + "½" * half + "☆" * empty + f" {rating}"


def _price_display(level: Optional[int]) -> str:
    if level is None:
        return "[UNAVAILABLE]"
    return PRICE_LABELS.get(level, "[UNAVAILABLE]")


def _category_badge(cat: str) -> str:
    colour_map = {
        "bar": "#e74c3c",
        "cafe": "#8e44ad",
        "coworking": "#2980b9",
        "tango_milonga": "#d35400",
        "live_music": "#27ae60",
        "cultural_center": "#16a085",
        "market": "#f39c12",
        "event_space": "#2c3e50",
        "restaurant": "#c0392b",
        "outdoor_social": "#1abc9c",
    }
    colour = colour_map.get(cat, "#7f8c8d")
    label = cat.replace("_", " ").title()
    return f'<span class="badge" style="background:{colour}">{_esc(label)}</span>'


def _score_bar(score: float, color: str = "#3498db") -> str:
    pct = round(score * 100)
    return (
        f'<div class="score-bar-wrap">'
        f'<div class="score-bar" style="width:{pct}%;background:{color}"></div>'
        f'<span class="score-pct">{pct}%</span>'
        f'</div>'
    )


# ---------------------------------------------------------------------------
# HTML template
# ---------------------------------------------------------------------------

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Buenos Aires Venue Recommender</title>
<style>
  :root {{
    --bg: #0f1117;
    --card: #1a1d2e;
    --card2: #22263a;
    --accent: #6c63ff;
    --accent2: #ff6584;
    --text: #e8eaf6;
    --muted: #8892b0;
    --border: #2d3153;
    --green: #2ecc71;
    --orange: #f39c12;
    --red: #e74c3c;
  }}
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    min-height: 100vh;
  }}
  a {{ color: var(--accent); text-decoration: none; }}
  a:hover {{ text-decoration: underline; }}

  /* Header */
  header {{
    background: linear-gradient(135deg, #1a1d2e 0%, #0f1117 100%);
    border-bottom: 1px solid var(--border);
    padding: 2.5rem 2rem 2rem;
    text-align: center;
  }}
  header h1 {{ font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: .3rem; }}
  header p.subtitle {{ color: var(--muted); font-size: .95rem; }}
  .disclaimer {{
    display: inline-block;
    margin-top: 1rem;
    background: #2d2300;
    border: 1px solid #f39c12;
    border-radius: 6px;
    padding: .5rem 1rem;
    font-size: .8rem;
    color: #f39c12;
    max-width: 700px;
  }}

  /* Profile summary */
  .profile-section {{
    max-width: 960px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }}
  .profile-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }}
  .stat-card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.2rem 1.5rem;
  }}
  .stat-card .label {{ font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: .3rem; }}
  .stat-card .value {{ font-size: 1.6rem; font-weight: 700; color: var(--accent); }}
  .stat-card .sub {{ font-size: .78rem; color: var(--muted); margin-top: .2rem; }}

  /* Section headings */
  .section-title {{
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    border-left: 3px solid var(--accent);
    padding-left: .7rem;
    margin-bottom: 1rem;
  }}

  /* Interest tags */
  .interests {{
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
    margin: 1rem 0;
  }}
  .int-tag {{
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: .25rem .75rem;
    font-size: .8rem;
    color: var(--text);
  }}
  .int-tag span.dot {{
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    margin-right: 4px;
    vertical-align: middle;
  }}

  /* Venue cards */
  .venues {{
    max-width: 960px;
    margin: 0 auto 3rem;
    padding: 0 1.5rem;
    display: grid;
    gap: 1.5rem;
  }}
  .venue-card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: transform .15s, box-shadow .15s;
  }}
  .venue-card:hover {{
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(108,99,255,.15);
  }}
  .venue-header {{
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.3rem 1.5rem .8rem;
    gap: 1rem;
  }}
  .venue-rank {{
    font-size: 2rem;
    font-weight: 900;
    color: var(--accent);
    min-width: 2.5rem;
    line-height: 1;
  }}
  .venue-title-group {{ flex: 1; min-width: 0; }}
  .venue-name {{
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }}
  .venue-meta {{
    font-size: .82rem;
    color: var(--muted);
    margin-top: .15rem;
  }}
  .venue-score-circle {{
    flex-shrink: 0;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: 3px solid var(--accent);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: .65rem;
    color: var(--muted);
    text-align: center;
  }}
  .venue-score-circle .big {{ font-size: 1.1rem; font-weight: 800; color: var(--accent); }}

  .venue-body {{
    padding: 0 1.5rem 1.5rem;
  }}
  .venue-cats {{ display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .9rem; }}
  .badge {{
    display: inline-block;
    padding: .2rem .6rem;
    border-radius: 4px;
    font-size: .72rem;
    font-weight: 600;
    color: #fff;
  }}

  /* Score breakdown */
  .score-breakdown {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .4rem .8rem;
    margin-bottom: 1rem;
    font-size: .78rem;
  }}
  .score-row {{ display: flex; flex-direction: column; gap: 2px; }}
  .score-row label {{ color: var(--muted); font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }}
  .score-bar-wrap {{
    display: flex;
    align-items: center;
    gap: .4rem;
    height: 10px;
  }}
  .score-bar {{
    height: 8px;
    border-radius: 4px;
    min-width: 4px;
    max-width: 100%;
    flex-shrink: 0;
  }}
  .score-pct {{ font-size: .7rem; color: var(--muted); white-space: nowrap; }}

  /* Reasons */
  .reasons {{ margin-bottom: .9rem; }}
  .reasons .reason-item {{
    display: flex;
    align-items: flex-start;
    gap: .4rem;
    font-size: .82rem;
    color: var(--text);
    margin-bottom: .3rem;
  }}
  .reason-item .icon {{ color: var(--green); flex-shrink: 0; }}

  /* Best times & stats */
  .venue-footer {{
    display: flex;
    flex-wrap: wrap;
    gap: .7rem;
    align-items: center;
    padding-top: .8rem;
    border-top: 1px solid var(--border);
    font-size: .8rem;
  }}
  .info-chip {{
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: .2rem .7rem;
    color: var(--text);
    white-space: nowrap;
  }}
  .info-chip .chip-label {{ color: var(--muted); font-size: .7rem; }}
  .maps-link {{
    margin-left: auto;
    background: var(--accent);
    color: #fff !important;
    padding: .35rem .9rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: .82rem;
    white-space: nowrap;
  }}
  .maps-link:hover {{ background: #5a52d5; text-decoration: none; }}
  .data-badge {{
    font-size: .68rem;
    padding: .1rem .45rem;
    border-radius: 3px;
    background: #2d2300;
    color: #f39c12;
    border: 1px solid #f39c1240;
  }}

  /* Warnings */
  .warnings-section {{
    max-width: 960px;
    margin: 0 auto 2rem;
    padding: 0 1.5rem;
  }}
  .warning-box {{
    background: #1a1400;
    border: 1px solid #f39c12;
    border-radius: 8px;
    padding: 1rem 1.2rem;
    font-size: .82rem;
    color: #f0c060;
  }}
  .warning-box ul {{ padding-left: 1.2rem; }}
  .warning-box li {{ margin-bottom: .3rem; }}

  footer {{
    text-align: center;
    padding: 2rem;
    color: var(--muted);
    font-size: .78rem;
    border-top: 1px solid var(--border);
  }}

  @media (max-width: 600px) {{
    header h1 {{ font-size: 1.5rem; }}
    .venue-header {{ flex-wrap: wrap; }}
    .score-breakdown {{ grid-template-columns: 1fr; }}
    .venue-score-circle {{ display: none; }}
  }}
</style>
</head>
<body>

<header>
  <h1>📍 Buenos Aires Venue Recommender</h1>
  <p class="subtitle">Ranked by your actual behavioral patterns — searches, visits, and time-of-day habits</p>
  {disclaimer}
</header>

{profile_section}

{warnings_section}

<div class="venues">
  {venue_cards}
</div>

<footer>
  Generated {generated_at} · Data stays 100% local ·
  <a href="https://github.com/c0sm1c-dp/howwescreen-landing">HowWeScreen</a>
</footer>

</body>
</html>
"""


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _build_disclaimer(data_source: str) -> str:
    if data_source == "mock":
        return (
            '<div class="disclaimer">'
            '⚠ <strong>DEMO MODE</strong> — Venue data is illustrative mock data, '
            'not fetched from the Google Maps Places API. '
            'In production mode (with a real API key), all venue data comes live from Google.'
            '</div>'
        )
    return ""


def _build_profile_section(profile: SignalProfile, ingest_source: str) -> str:
    tp = profile.time_pattern
    top_cat = profile.category_scores.most_common(1)
    top_cat_label = top_cat[0][0].replace("_", " ").title() if top_cat else "[UNAVAILABLE]"
    top_barrio = profile.top_barrios.most_common(1)
    top_barrio_label = top_barrio[0][0] if top_barrio else "[UNAVAILABLE]"

    stats_html = f"""
    <div class="profile-grid">
      <div class="stat-card">
        <div class="label">Searches Analysed</div>
        <div class="value">{profile.total_searches:,}</div>
        <div class="sub">{profile.ba_search_count:,} Buenos Aires related</div>
      </div>
      <div class="stat-card">
        <div class="label">BA Place Visits</div>
        <div class="value">{len(profile.ba_visits):,}</div>
        <div class="sub">From location timeline</div>
      </div>
      <div class="stat-card">
        <div class="label">Top Interest</div>
        <div class="value" style="font-size:1.2rem">{_esc(top_cat_label)}</div>
        <div class="sub">Strongest category signal</div>
      </div>
      <div class="stat-card">
        <div class="label">Favorite Barrio</div>
        <div class="value" style="font-size:1.2rem">{_esc(top_barrio_label)}</div>
        <div class="sub">Most searched neighborhood</div>
      </div>
      <div class="stat-card">
        <div class="label">Peak Hours</div>
        <div class="value" style="font-size:1.1rem">{_esc(tp.human_hours())}</div>
        <div class="sub">When you're most active</div>
      </div>
      <div class="stat-card">
        <div class="label">Peak Days</div>
        <div class="value" style="font-size:1rem">{_esc(', '.join(tp.peak_days[:2]) if tp.peak_days else '[UNAVAILABLE]')}</div>
        <div class="sub">Most active days of week</div>
      </div>
    </div>
    """

    # Interest tags
    interest_tags = ""
    for cat, score in profile.category_scores.most_common(10):
        label = cat.replace("_", " ").title()
        interest_tags += f'<span class="int-tag"><span class="dot"></span>{_esc(label)} ({score})</span>\n'

    return f"""
    <div class="profile-section">
      <div class="section-title">Your Activity Profile</div>
      {stats_html}
      <div style="margin-top:1.2rem">
        <div class="section-title">Detected Interests</div>
        <div class="interests">{interest_tags}</div>
      </div>
    </div>
    """


def _build_warnings_section(
    ingest_warnings: list[str],
    signal_warnings: list[str],
) -> str:
    all_warnings = ingest_warnings + signal_warnings
    if not all_warnings:
        return ""
    items = "\n".join(f"<li>{_esc(w)}</li>" for w in all_warnings)
    return f"""
    <div class="warnings-section">
      <div class="section-title">⚠ Warnings &amp; Notes</div>
      <div class="warning-box">
        <ul>{items}</ul>
      </div>
    </div>
    """


def _build_venue_card(rank: int, venue: ScoredVenue) -> str:
    score_pct = round(venue.score_total * 100)

    # Category badges
    cats_html = ""
    for cat in venue.categories[:3]:
        cats_html += _category_badge(cat)
    if venue.data_source == "mock":
        cats_html += ' <span class="data-badge">MOCK DATA</span>'

    # Score breakdown bars
    breakdown = f"""
    <div class="score-breakdown">
      <div class="score-row">
        <label>Category Match</label>
        {_score_bar(venue.score_category, "#6c63ff")}
      </div>
      <div class="score-row">
        <label>Barrio Affinity</label>
        {_score_bar(venue.score_barrio, "#ff6584")}
      </div>
      <div class="score-row">
        <label>Hours Alignment</label>
        {_score_bar(venue.score_time, "#2ecc71")}
      </div>
      <div class="score-row">
        <label>Popularity</label>
        {_score_bar(venue.score_popularity, "#f39c12")}
      </div>
    </div>
    """

    # Match reasons
    reasons_html = ""
    for reason in venue.match_reasons:
        reasons_html += f'<div class="reason-item"><span class="icon">✓</span><span>{_esc(reason)}</span></div>\n'

    # Footer chips
    rating_str = _star_display(venue.rating)
    price_str = _price_display(venue.price_level)
    review_str = f"{venue.review_count:,}" if venue.review_count else "[UNAVAILABLE]"

    return f"""
    <div class="venue-card">
      <div class="venue-header">
        <div class="venue-rank">#{rank}</div>
        <div class="venue-title-group">
          <div class="venue-name">{_esc(venue.name)}</div>
          <div class="venue-meta">
            📍 {_esc(venue.barrio)} &nbsp;·&nbsp; {_esc(venue.address)}
          </div>
        </div>
        <div class="venue-score-circle">
          <span class="big">{score_pct}</span>
          <span>score</span>
        </div>
      </div>

      <div class="venue-body">
        <div class="venue-cats">{cats_html}</div>

        <div class="reasons">{reasons_html}</div>

        {breakdown}

        <div class="venue-footer">
          <span class="info-chip">
            <span class="chip-label">Rating </span>{_esc(rating_str)}
          </span>
          <span class="info-chip">
            <span class="chip-label">Reviews </span>{_esc(review_str)}
          </span>
          <span class="info-chip">
            <span class="chip-label">Price </span>{_esc(price_str)}
          </span>
          <span class="info-chip">
            <span class="chip-label">Best time </span>{_esc(venue.best_times)}
          </span>
          <a class="maps-link" href="{_esc(venue.maps_url)}" target="_blank" rel="noopener">
            Open in Maps ↗
          </a>
        </div>
      </div>
    </div>
    """


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def render_html(
    venues: list[ScoredVenue],
    profile: SignalProfile,
    ingest_warnings: list[str],
    ingest_source: str = "mock",
    output_path: str = "recommendations.html",
) -> str:
    """
    Render the full HTML page and write it to *output_path*.
    Returns the path to the written file.
    """
    data_source = venues[0].data_source if venues else "mock"
    disclaimer = _build_disclaimer(data_source)
    profile_section = _build_profile_section(profile, ingest_source)
    warnings_section = _build_warnings_section(ingest_warnings, profile.warnings)
    venue_cards = "\n".join(
        _build_venue_card(rank, v) for rank, v in enumerate(venues, 1)
    )
    if not venues:
        venue_cards = '<p style="text-align:center;color:var(--muted);padding:3rem">No venues to display.</p>'

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    page = _HTML_TEMPLATE.format(
        disclaimer=disclaimer,
        profile_section=profile_section,
        warnings_section=warnings_section,
        venue_cards=venue_cards,
        generated_at=generated_at,
    )

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(page)

    return output_path


def render_text(venues: list[ScoredVenue]) -> None:
    """Print a compact text table of top venues to stdout."""
    print("\n" + "=" * 72)
    print("  TOP BUENOS AIRES VENUES FOR MEETING PEOPLE")
    print("=" * 72)
    print(f"  {'#':<3} {'Venue':<36} {'Barrio':<20} {'Score':>5} {'Rating':>6}")
    print("  " + "-" * 68)
    for i, v in enumerate(venues, 1):
        name = v.name[:35] + "…" if len(v.name) > 36 else v.name
        barrio = v.barrio[:19] + "…" if len(v.barrio) > 20 else v.barrio
        rating = f"{v.rating}" if v.rating else "N/A"
        print(f"  {i:<3} {name:<36} {barrio:<20} {v.score_total:>5.3f} {rating:>6}")
    print("=" * 72 + "\n")
