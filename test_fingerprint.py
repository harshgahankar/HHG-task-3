"""Tests for records.fingerprint module."""

from records.canonical import build_canonical_record
from records.fingerprint import generate_fingerprint


def test_same_content_same_hash():
    """Two differently-ordered dicts with identical values produce the same fingerprint."""
    a = {
        "link": "  https://example.com/photo  ",
        "source": "Example.com",
        "title": " A Photo ",
        "thumbnail": "https://img.example.com/thumb.jpg",
    }

    b = {
        "title": "A Photo",
        "thumbnail": "https://img.example.com/thumb.jpg",
        "source": "Example.com",
        "link": "https://example.com/photo",
    }

    assert generate_fingerprint(build_canonical_record(a)) == generate_fingerprint(build_canonical_record(b))


def test_single_field_change_changes_hash():
    """Changing any one field produces a different fingerprint."""
    base = {"source": "Wikipedia", "url": "https://example.com", "title": "Test", "image_url": ""}
    base_hash = generate_fingerprint(base)

    for field in base:
        modified = base.copy()
        modified[field] = modified[field] + "x"
        assert generate_fingerprint(modified) != base_hash, f"Hash unchanged after modifying '{field}'"


def test_hash_is_64_hex_chars():
    """Fingerprint is always a 64-character lowercase hex string."""
    record = {"source": "", "url": "", "title": "", "image_url": ""}
    h = generate_fingerprint(record)
    assert len(h) == 64
    assert all(c in "0123456789abcdef" for c in h)
