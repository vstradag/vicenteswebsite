#!/usr/bin/env python3
"""
Fetch Google Scholar stats using the scholarly library.
Run locally or from GitHub Actions to update public/scholar-stats.json.
No Google permission needed – scholarly scrapes Scholar (may be rate-limited).
"""
import json
import os
import sys

try:
    from scholarly import scholarly
except ImportError:
    print("Install: pip install scholarly", file=sys.stderr)
    sys.exit(1)

# Scholar author ID from config (user=0YSmKi4AAAAJ)
AUTHOR_ID = os.environ.get("SCHOLAR_AUTHOR_ID", "0YSmKi4AAAAJ")
OUTPUT_PATH = os.environ.get(
    "SCHOLAR_OUTPUT",
    os.path.join(os.path.dirname(__file__), "..", "public", "scholar-stats.json"),
)


def fetch_stats():
    try:
        author = scholarly.search_author_id(AUTHOR_ID)
        # Fill indices (h-index, i10-index) – may require extra request
        author = scholarly.fill(author, sections=["indices"])
    except Exception as e:
        print(f"scholarly fetch failed: {e}", file=sys.stderr)
        return None

    citations = author.get("citedby") or 0
    h_index = author.get("hindex") or 0
    i10_index = author.get("i10index") or 0

    return {
        "citations": int(citations) if citations else 0,
        "hIndex": int(h_index) if h_index else 0,
        "i10Index": int(i10_index) if i10_index else 0,
        "source": "scholarly",
    }


def main():
    stats = fetch_stats()
    if not stats:
        sys.exit(1)

    output_dir = os.path.dirname(OUTPUT_PATH)
    if output_dir and not os.path.isdir(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(stats, f, indent=2)

    print(f"Wrote {OUTPUT_PATH}: {stats}")


if __name__ == "__main__":
    main()
