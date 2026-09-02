"""Fingerprint generator for canonical records.

Produces a deterministic SHA-256 hash from a canonical record dict.
The record is serialised with sorted keys and minimal JSON formatting
so that identical logical content always produces the same hex digest,
regardless of Python dict insertion order or minor whitespace differences.
"""

import hashlib
import json


def generate_fingerprint(record: dict) -> str:
    """Return a SHA-256 hex digest of the canonical record.

    Parameters
    ----------
    record : dict
        A canonical record (e.g. from ``build_canonical_record()``).

    Returns
    -------
    str
        Lowercase hex-encoded SHA-256 hash (64 characters).
    """
    payload = json.dumps(record, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
