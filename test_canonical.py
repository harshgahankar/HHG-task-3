"""Tests for records.canonical module."""

from records.canonical import build_canonical_record


def test_canonical_stability():
    """Same logical content with different key order and whitespace produces identical output."""
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

    assert build_canonical_record(a) == build_canonical_record(b)


def test_canonical_exact_output():
    """Verify exact field mapping and normalisation."""
    result = {
        "source": "  Wikipedia  ",
        "link": "https://en.wikipedia.org/wiki/Test",
        "title": "Test Page",
        "thumbnail": None,
    }

    record = build_canonical_record(result)

    assert record == {
        "source": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Test",
        "title": "Test Page",
        "image_url": "",
    }


def test_canonical_missing_keys():
    """Empty dict yields all empty strings."""
    assert build_canonical_record({}) == {
        "source": "",
        "url": "",
        "title": "",
        "image_url": "",
    }


def test_canonical_no_none_values():
    """Output never contains None."""
    record = build_canonical_record({"source": None, "link": None, "title": None, "thumbnail": None})
    for v in record.values():
        assert v is not None
        assert isinstance(v, str)
