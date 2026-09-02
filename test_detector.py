"""Standalone smoke-test for FaceDetector."""

import sys
from pathlib import Path

import cv2

# allow running from repo root without installing the package
sys.path.insert(0, str(Path(__file__).resolve().parent))

from face.detector import FaceDetector


def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: python {Path(__file__).name} <image.jpg>")
        sys.exit(1)

    image_path = sys.argv[1]
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read image '{image_path}'")
        sys.exit(1)

    detector = FaceDetector()
    faces = detector.detect(img)

    print(f"Faces detected: {len(faces)}")
    for i, f in enumerate(faces, 1):
        x1, y1, x2, y2 = f["bbox"]
        print(f"  #{i}  bbox=[{x1:.0f}, {y1:.0f}, {x2:.0f}, {y2:.0f}]  score={f['det_score']:.4f}")


if __name__ == "__main__":
    main()
