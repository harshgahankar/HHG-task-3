"""End-to-end pipeline test with real images."""

import time
import tempfile
from pathlib import Path

import cv2
import numpy as np
import urllib.request
import ssl

from face.detector import FaceDetector
from search.lens_search import reverse_image_search, parse_lens_results, SerpApiError


def log(stage, elapsed):
    print(f"  [{elapsed:6.2f}s] {stage}")


def download_image(url, fname):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        data = resp.read()
        with open(fname, "wb") as f:
            f.write(data)
    return len(data)


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
    except Exception as e:
        t7 = time.perf_counter()
        log(f"SerpApi call FAILED: {e}", t7 - t6)
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
    # Test 1: Blank image (no face)
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.imwrite("test_blank.jpg", blank)
    run_flow("Blank image (no face)", "test_blank.jpg")

    # Test 2: Danny DeVito (real face, known URL)
    size = download_image(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Danny_DeVito_by_Gage_Skidmore.jpg/440px-Danny_DeVito_by_Gage_Skidmore.jpg",
        "test_devito.jpg",
    )
    print(f"  Downloaded test_devito.jpg ({size} bytes)")
    run_flow("Danny DeVito (real face)", "test_devito.jpg")

    # Test 3: randomuser portrait
    size = download_image(
        "https://randomuser.me/api/portraits/lego/2.jpg",
        "test_lego.jpg",
    )
    print(f"  Downloaded test_lego.jpg ({size} bytes)")
    run_flow("Lego portrait (real face)", "test_lego.jpg")
