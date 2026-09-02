"""Standalone test for reverse_image_search and parse_lens_results."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from search.lens_search import reverse_image_search, parse_lens_results, SerpApiError


def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: python {Path(__file__).name} <image_path_or_url>")
        sys.exit(1)

    target = sys.argv[1]

    try:
        result = reverse_image_search(target)
    except (SerpApiError, FileNotFoundError) as e:
        print(f"Error: {e}")
        sys.exit(1)

    print("=== Raw JSON ===")
    print(json.dumps(result, indent=2))

    parsed = parse_lens_results(result)
    print(f"\n=== Parsed Results ({len(parsed)} items) ===")
    for i, item in enumerate(parsed, 1):
        print(f"{i}. {item['title']}")
        print(f"   Source: {item['source']}")
        print(f"   Link: {item['link']}")
        print(f"   Thumbnail: {item['thumbnail']}")


if __name__ == "__main__":
    main()
