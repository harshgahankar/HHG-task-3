"""End-to-end pipeline test with timing logs - comprehensive."""

import time
import tempfile
from pathlib import Path

import cv2
import numpy as np

from face.detector import FaceDetector
from search.lens_search import reverse_image_search, parse_lens_results, SerpApiError


def log(stage, elapsed):
    print(f"  [{elapsed:6.2f}s] {stage}")


def run_flow(label, img):
    print(f"\n{'=' * 60}")
    print(f"  TEST: {label}  (shape={img.shape})")
    print(f"{'=' * 60}")

    detector = FaceDetector()

    t0 = time.perf_counter()
    faces = detector.detect(img)
    t1 = time.perf_counter()
    log(f"Face detect -> {len(faces)} face(s)", t1 - t0)

    if len(faces) == 0:
        print("  -> No face detected. Pipeline stops here.")
        return

    if len(faces) > 1:
        areas = [(f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]) for f in faces]
        idx = int(np.argmax(areas))
        print(f"  -> Multiple faces, picked largest (idx={idx})")
    else:
        idx = 0

    selected = faces[idx]
    x1, y1, x2, y2 = [int(v) for v in selected["bbox"]]
    confidence = selected["det_score"] * 100
    print(f"  -> bbox=[{x1},{y1},{x2},{y2}]  confidence={confidence:.1f}%")

    t2 = time.perf_counter()
    emb = selected["embedding"]
    t3 = time.perf_counter()
    log(f"Embedding stored (shape={emb.shape})", t3 - t2)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, img)
        tmp_path = tmp.name

    t4 = time.perf_counter()
    try:
        raw = reverse_image_search(tmp_path)
    except Exception as e:
        t5 = time.perf_counter()
        log(f"SerpApi call FAILED: {e}", t5 - t4)
        return
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    t5 = time.perf_counter()
    log("SerpApi call OK", t5 - t4)

    t6 = time.perf_counter()
    results = parse_lens_results(raw)
    t7 = time.perf_counter()
    log(f"parse_lens_results -> {len(results)} item(s)", t7 - t6)

    if results:
        top = results[0]
        print(f"  -> Top result: {top['title']}")
        print(f"               source={top['source']}")
        print(f"               link={top['link']}")
        print(f"               thumbnail={'yes' if top['thumbnail'] else 'no'}")
    else:
        print("  -> No parsed results (API returned no visual/exact matches)")

    total = t7 - t0
    print(f"  TOTAL wall time: {total:.2f}s")


if __name__ == "__main__":
    # Test 1: Blank image (no face)
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    run_flow("Blank image (no face)", blank)

    # Test 2: Real face image
    img = cv2.imread("test_man.jpg")
    if img is not None:
        run_flow("Real face photo (Unsplash)", img)
    else:
        print("ERROR: Could not read test_man.jpg")

    # Test 3: Same image resized smaller
    if img is not None:
        small = cv2.resize(img, (200, 200))
        run_flow("Same face, smaller (200x200)", small)
