"""End-to-end pipeline test with timing logs - real face images."""

import time
import tempfile
from pathlib import Path

import cv2

from face.detector import FaceDetector
from search.lens_search import reverse_image_search, parse_lens_results, SerpApiError


def log(stage, elapsed):
    print(f"  [{elapsed:6.2f}s] {stage}")


def run_flow(label, img_path):
    print(f"\n{'=' * 60}")
    print(f"  TEST: {label}")
    print(f"{'=' * 60}")

    detector = FaceDetector()

    t0 = time.perf_counter()
    img = cv2.imread(img_path)
    if img is None:
        print("  ERROR: Could not read image")
        return
    t1 = time.perf_counter()
    log(f"Image loaded ({img.shape[1]}x{img.shape[0]})", t1 - t0)

    t2 = time.perf_counter()
    faces = detector.detect(img)
    t3 = time.perf_counter()
    log(f"Face detect -> {len(faces)} face(s)", t3 - t2)

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

    t4 = time.perf_counter()
    emb = selected["embedding"]
    t5 = time.perf_counter()
    log(f"Embedding stored (shape={emb.shape})", t5 - t4)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, img)
        tmp_path = tmp.name

    t6 = time.perf_counter()
    try:
        raw = reverse_image_search(tmp_path)
    except (SerpApiError, FileNotFoundError) as e:
        t7 = time.perf_counter()
        log(f"SerpApi call FAILED: {e}", t7 - t6)
        return
    except Exception as e:
        t7 = time.perf_counter()
        log(f"SerpApi call FAILED (unexpected): {e}", t7 - t6)
        return
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    t7 = time.perf_counter()
    log("SerpApi call OK", t7 - t6)

    t8 = time.perf_counter()
    results = parse_lens_results(raw)
    t9 = time.perf_counter()
    log(f"parse_lens_results -> {len(results)} item(s)", t9 - t8)

    if results:
        top = results[0]
        print(f"  -> Top result: {top['title']}")
        print(f"               source={top['source']}")
        print(f"               link={top['link']}")
        print(f"               thumbnail={'yes' if top['thumbnail'] else 'no'}")
    else:
        print("  -> No parsed results (API returned no visual/exact matches)")

    total = t9 - t0
    print(f"  TOTAL wall time: {total:.2f}s")


if __name__ == "__main__":
    run_flow("Real face photo 1 (AI generated)", "test_face1.jpg")
    run_flow("Real face photo 2 (portrait)", "test_face2.jpg")
    run_flow("Real face photo 3 (portrait)", "test_face3.jpg")
