"""Google Lens reverse image search via SerpApi."""

from __future__ import annotations

import base64
import os
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

load_dotenv()

_LENS_URL = "https://serpapi.com/search.json"


class SerpApiError(Exception):
    """Raised when a SerpApi request fails."""


def _get_api_key(api_key: str | None = None) -> str:
    key = api_key or os.getenv("SERPAPI_KEY")
    if not key:
        raise SerpApiError(
            "SERPAPI_KEY is not set. "
            "Pass it explicitly or set it in .env / environment variables."
        )
    return key


def _image_to_data_url(image_path: str) -> str:
    """Read a local image file and return a base64 data-URL.

    Re-encodes via OpenCV and iteratively shrinks until the payload
    fits within SerpApi's GET-parameter size limit (~8 KB base64).
    """
    import cv2
    import numpy as np

    path = Path(image_path)
    if not path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    raw = path.read_bytes()
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Could not decode image: {image_path}")

    MAX_B64 = 8000

    for max_dim, quality in [(200, 50), (150, 40), (120, 35), (100, 30)]:
        h, w = img.shape[:2]
        scale = min(1.0, max_dim / max(h, w))
        resized = img if scale >= 1.0 else cv2.resize(img, (int(w * scale), int(h * scale)))
        _, buf = cv2.imencode(".jpg", resized, [cv2.IMWRITE_JPEG_QUALITY, quality])
        b64 = base64.b64encode(buf.tobytes()).decode()
        if len(b64) <= MAX_B64:
            return f"data:image/jpeg;base64,{b64}"

    return f"data:image/jpeg;base64,{b64}"


def reverse_image_search(
    image_path_or_url: str,
    api_key: str | None = None,
    type: str = "all",
) -> dict:
    """Run a Google Lens reverse image search via SerpApi.

    Parameters
    ----------
    image_path_or_url : str
        Local file path **or** public URL of the image to search.
    api_key : str, optional
        SerpApi key. Falls back to ``SERPAPI_KEY`` env var.
    type : str
        Lens search type: ``"all"``, ``"visual_matches"``,
        ``"exact_matches"``, ``"products"``, ``"about_this_image"``.

    Returns
    -------
    dict
        Raw JSON response from SerpApi.

    Raises
    ------
    SerpApiError
        On missing key, non-200 responses, or malformed payloads.
    FileNotFoundError
        If a local path is given but does not exist.
    """
    key = _get_api_key(api_key)

    parsed = urlparse(image_path_or_url)
    is_url = parsed.scheme in ("http", "https")

    if is_url:
        url_value = image_path_or_url
    else:
        url_value = _image_to_data_url(image_path_or_url)

    params: dict = {
        "engine": "google_lens",
        "api_key": key,
        "type": type,
        "url": url_value,
    }

    resp = requests.get(_LENS_URL, params=params, timeout=60)

    if resp.status_code != 200:
        raise SerpApiError(
            f"Google Lens search failed (HTTP {resp.status_code}): {resp.text}"
        )

    return resp.json()


def parse_lens_results(raw_json: dict) -> list[dict]:
    """Extract structured results from a SerpApi Google Lens response.

    Checks ``exact_matches`` first, then ``visual_matches``, then
    ``related_content`` — returning whichever non-empty list is found
    (exact matches prioritised).  Each item is normalised to::

        {"title": ..., "source": ..., "link": ..., "thumbnail": ...}

    Returns an empty list when no matches exist.
    """
    # Prefer exact_matches, then visual_matches, then related_content
    for key in ("exact_matches", "visual_matches", "related_content"):
        items = raw_json.get(key)
        if isinstance(items, list) and items:
            break
    else:
        return []

    results: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        results.append(
            {
                "title": item.get("title"),
                "source": item.get("source"),
                "link": item.get("link"),
                "thumbnail": item.get("thumbnail"),
            }
        )
    return results
