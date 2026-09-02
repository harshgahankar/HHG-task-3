"""Canonical record builder for stable hashing.

Field stability matters because these records are keyed by content hash.
If the same logical result produces different dicts (different key order,
extra whitespace, missing optional fields), the hash changes and the
record looks like a new entry.  By normalising every field to a fixed
shape and stripping whitespace we guarantee that identical logical
content always yields the same canonical dict—and therefore the same hash.
"""


def build_canonical_record(result: dict) -> dict:
    """Map a parsed search result into a stable canonical record.

    Parameters
    ----------
    result : dict
        A single item from ``parse_lens_results()`` containing keys
        ``title``, ``source``, ``link``, ``thumbnail``.

    Returns
    -------
    dict
        Canonical record with exactly four string fields:
        ``source``, ``url``, ``title``, ``image_url``.
        Missing or None values become empty strings; all strings are
        stripped of leading/trailing whitespace.
    """
    return {
        "source": (result.get("source") or "").strip(),
        "url": (result.get("link") or "").strip(),
        "title": (result.get("title") or "").strip(),
        "image_url": (result.get("thumbnail") or "").strip(),
    }
