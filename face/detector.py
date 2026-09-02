"""Face detection module wrapping insightface.app.FaceAnalysis."""

from __future__ import annotations

import numpy as np

try:
    from insightface.app import FaceAnalysis
except ImportError:
    FaceAnalysis = None  # allow importing this module without insightface installed


class FaceDetector:
    """Thin wrapper around insightface.app.FaceAnalysis."""

    def __init__(self) -> None:
        if FaceAnalysis is None:
            raise ImportError(
                "insightface is not installed. "
                "Install it with: pip install insightface onnxruntime"
            )
        try:
            self._app = FaceAnalysis(providers=["CPUExecutionProvider"])
            self._app.prepare(ctx_id=-1, det_size=(640, 640))
        except Exception as exc:
            raise RuntimeError(
                f"Failed to initialise FaceAnalysis model: {exc}"
            ) from exc

    def detect(self, image: np.ndarray) -> list[dict]:
        """Run face detection on *image* and return a list of face dicts.

        Each dict contains:
            bbox       – [x1, y1, x2, y2]
            det_score  – detection confidence
            embedding  – 512-d face embedding vector

        Raises
        ------
        ValueError
            If *image* is not a valid NumPy array or has an unexpected shape.
        RuntimeError
            If the underlying model fails to process the image.
        """
        if not isinstance(image, np.ndarray):
            raise ValueError("image must be a numpy.ndarray")
        if image.ndim not in (2, 3):
            raise ValueError(
                f"image must be 2-D (grayscale) or 3-D (BGR), got ndim={image.ndim}"
            )
        try:
            faces = self._app.get(image)
        except Exception as exc:
            raise RuntimeError(
                f"FaceAnalysis.get() failed: {exc}"
            ) from exc

        results: list[dict] = []
        for face in faces:
            results.append(
                {
                    "bbox": face.bbox.tolist(),
                    "det_score": float(face.det_score),
                    "embedding": face.embedding,
                }
            )
        return results
