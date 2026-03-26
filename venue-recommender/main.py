#!/usr/bin/env python3
"""
main.py — Buenos Aires Venue Recommender CLI

Usage examples:

  # Run with mock data (no Takeout export required):
  python main.py --mock

  # Run against real Google Takeout export:
  python main.py \
    --search-history  ~/Takeout/MyActivity/Search/MyActivity.json \
    --location-history ~/Takeout/Location\ History/Semantic\ Location\ History/

  # Dry-run: show what data would be read without processing it:
  python main.py --mock --dry-run

  # Use a Google Maps Places API key for live venue data:
  python main.py --mock --places-api-key YOUR_KEY_HERE

  # Change output location or format:
  python main.py --mock --output my_report.html --top 15
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# CLI argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="venue-recommender",
        description=(
            "Analyse your Google Takeout data to find the best Buenos Aires "
            "venues for meeting people socially."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    data_group = p.add_argument_group("Data sources")
    data_group.add_argument(
        "--mock",
        action="store_true",
        help="Use the built-in mock dataset (no Takeout export required).",
    )
    data_group.add_argument(
        "--search-history",
        metavar="PATH",
        help="Path to MyActivity.json from Google Takeout (Search history).",
    )
    data_group.add_argument(
        "--location-history",
        metavar="DIR",
        help=(
            "Path to the 'Semantic Location History' directory from Google Takeout "
            "(contains one JSON file per month)."
        ),
    )

    api_group = p.add_argument_group("Google Maps Places API")
    api_group.add_argument(
        "--places-api-key",
        metavar="KEY",
        default=os.environ.get("GOOGLE_MAPS_API_KEY"),
        help=(
            "Google Maps Places API key. If omitted, the app falls back to "
            "the built-in mock venue pool. Can also be set via the "
            "GOOGLE_MAPS_API_KEY environment variable."
        ),
    )

    output_group = p.add_argument_group("Output")
    output_group.add_argument(
        "--output",
        metavar="FILE",
        default="recommendations.html",
        help="Output HTML file path (default: recommendations.html).",
    )
    output_group.add_argument(
        "--top",
        type=int,
        default=10,
        metavar="N",
        help="Number of top venues to include (default: 10).",
    )
    output_group.add_argument(
        "--text",
        action="store_true",
        help="Also print a compact text table to stdout.",
    )

    p.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Show which data files would be read and what the app would do, "
            "without actually processing any data."
        ),
    )
    p.add_argument(
        "--save-mock-takeout",
        metavar="DIR",
        help=(
            "Write the mock Takeout dataset to DIR as real JSON files "
            "(useful for inspecting the expected file format)."
        ),
    )
    p.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print phase-by-phase summaries to stdout.",
    )
    return p


# ---------------------------------------------------------------------------
# Dry-run logic
# ---------------------------------------------------------------------------

def dry_run(args: argparse.Namespace) -> None:
    print("\n=== DRY RUN ===")
    print("This is what the app would do:\n")

    if args.mock:
        print("  Data source: MOCK DATASET (built-in)")
        print("    → Search history: ~28 synthetic queries about Buenos Aires")
        print("    → Location history: ~60 synthetic venue visits across 6 months")
    else:
        sh = args.search_history or "[NOT PROVIDED — search signals will be unavailable]"
        lh = args.location_history or "[NOT PROVIDED — visit signals will be unavailable]"
        print(f"  Search history path : {sh}")
        print(f"  Location history dir: {lh}")

    if args.places_api_key:
        print(f"\n  Places API key: {'*' * (len(args.places_api_key) - 4)}{args.places_api_key[-4:]}")
        print("  → Venue data would be fetched live from Google Maps Places API")
    else:
        print("\n  Places API key: NOT PROVIDED — will use mock venue pool")

    print(f"\n  Output file   : {args.output}")
    print(f"  Top N venues  : {args.top}")
    print("\nNo data was read or processed. Re-run without --dry-run to proceed.")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(args: argparse.Namespace) -> None:
    # ------------------------------------------------------------------
    # Phase 1 — Ingest
    # ------------------------------------------------------------------
    print("\n[Phase 1] Ingesting data…")
    from ingest import ingest, print_ingest_summary
    result = ingest(
        search_history_path=args.search_history,
        location_history_dir=args.location_history,
        use_mock=args.mock,
    )
    if args.verbose:
        print_ingest_summary(result)
    else:
        print(
            f"  Found {len(result.search_events):,} search events, "
            f"{len(result.place_visits):,} place visits."
        )
        if result.warnings:
            for w in result.warnings:
                print(f"  ⚠  {w}")

    # ------------------------------------------------------------------
    # Phase 2 — Signal extraction
    # ------------------------------------------------------------------
    print("\n[Phase 2] Extracting social signals…")
    from signals import extract_signals, print_signal_summary
    profile = extract_signals(result)
    if args.verbose:
        print_signal_summary(profile)
    else:
        top_cats = profile.category_scores.most_common(3)
        cat_str = ", ".join(f"{c} ({s})" for c, s in top_cats)
        print(f"  Top categories: {cat_str or '[none detected]'}")
        print(f"  BA searches: {profile.ba_search_count} | BA visits: {len(profile.ba_visits)}")
        if profile.time_pattern.peak_hours:
            print(f"  Peak activity: {profile.time_pattern.human_hours()}")
        if profile.warnings:
            for w in profile.warnings:
                print(f"  ⚠  {w}")

    # ------------------------------------------------------------------
    # Phase 3 — Scoring
    # ------------------------------------------------------------------
    print("\n[Phase 3] Scoring venues…")
    from scorer import score_venues, print_score_summary
    scored = score_venues(
        profile=profile,
        places_api_key=args.places_api_key,
        top_n=args.top,
    )
    if args.verbose:
        print_score_summary(scored)
    else:
        src = "Places API" if args.places_api_key else "mock venue pool"
        print(f"  Scored {args.top} venues from {src}.")
        if scored:
            print(f"  Top pick: {scored[0].name} ({scored[0].barrio}) — score {scored[0].score_total:.3f}")

    # ------------------------------------------------------------------
    # Phase 4 — Output
    # ------------------------------------------------------------------
    print("\n[Phase 4] Rendering output…")
    from output import render_html, render_text

    html_path = render_html(
        venues=scored,
        profile=profile,
        ingest_warnings=result.warnings,
        ingest_source=result.source,
        output_path=args.output,
    )
    print(f"  HTML report written to: {html_path}")

    if args.text:
        render_text(scored)

    print(f"\n✓ Done. Open {html_path} in your browser to view recommendations.\n")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    # Validate: need at least one data source
    if not args.mock and not args.search_history and not args.location_history:
        if args.save_mock_takeout:
            # Allow --save-mock-takeout without other data flags
            pass
        elif not args.dry_run:
            parser.error(
                "Provide at least one data source:\n"
                "  --mock                  use built-in mock data\n"
                "  --search-history PATH   path to MyActivity.json\n"
                "  --location-history DIR  path to Semantic Location History dir\n"
                "\nRun with --help for full usage."
            )

    # Optional: save mock Takeout to disk
    if args.save_mock_takeout:
        from mock_data import save_mock_takeout
        save_mock_takeout(args.save_mock_takeout)
        if not args.mock and not args.search_history and not args.location_history:
            return  # only saving was requested

    # Dry run
    if args.dry_run:
        dry_run(args)
        return

    # Full pipeline
    try:
        run(args)
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(1)
    except Exception as exc:
        print(f"\n✗ Error: {exc}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        else:
            print("  Re-run with --verbose for full traceback.")
        sys.exit(1)


if __name__ == "__main__":
    main()
