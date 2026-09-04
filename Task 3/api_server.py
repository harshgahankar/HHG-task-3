"""FastAPI backend server for FaceChain."""

import io
import json
import tempfile
import time
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from face.detector import FaceDetector
from search.lens_search import (
    SerpApiError,
    parse_lens_results,
    reverse_image_search,
)
from records.canonical import build_canonical_record
from records.fingerprint import generate_fingerprint

app = FastAPI(title="FaceChain API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector: Optional[FaceDetector] = None
history: list[dict] = []


def get_detector() -> FaceDetector:
    global detector
    if detector is None:
        detector = FaceDetector()
    return detector


class FingerprintRequest(BaseModel):
    source: str = ""
    url: str = ""
    title: str = ""
    image_url: str = ""


class AnchorRequest(BaseModel):
    fingerprint: str


@app.post("/api/detect")
async def detect_faces(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        arr = np.frombuffer(contents, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        det = get_detector()
        faces = det.detect(img)

        return {
            "faces": [
                {
                    "bbox": f["bbox"],
                    "det_score": f["det_score"],
                }
                for f in faces
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search")
async def search(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        arr = np.frombuffer(contents, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            cv2.imwrite(tmp.name, img)
            tmp_path = tmp.name

        try:
            raw = reverse_image_search(tmp_path)
        except (SerpApiError, FileNotFoundError) as e:
            raise HTTPException(status_code=502, detail=str(e))
        finally:
            Path(tmp_path).unlink(missing_ok=True)

        results = parse_lens_results(raw)
        return {"results": results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fingerprint")
async def create_fingerprint(req: FingerprintRequest):
    try:
        canonical = build_canonical_record({
            "source": req.source,
            "link": req.url,
            "title": req.title,
            "thumbnail": req.image_url,
        })
        fp = generate_fingerprint(canonical)
        return {"fingerprint": fp, "canonical": canonical}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/anchor")
async def anchor_to_chain(req: AnchorRequest):
    try:
        from chain.client import Web3Client

        client = Web3Client()
        if not client.is_connected():
            raise HTTPException(
                status_code=503,
                detail="Local chain not running. Start it with npx hardhat node.",
            )

        result = client.anchor_fingerprint(req.fingerprint)

        history.append({
            "date": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "source": "FaceChain",
            "tx": result["tx_hash"],
            "block_number": result["block_number"],
            "fingerprint": req.fingerprint,
            "status": "verified",
        })

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history")
async def get_history():
    return {"records": history}


@app.get("/api/chain/status")
async def chain_status():
    try:
        from chain.client import Web3Client

        client = Web3Client()
        connected = client.is_connected()
        if connected:
            account = client.get_default_account()
            balance = client.get_balance(account)
            chain_id = client.get_chain_id()
            return {
                "connected": True,
                "account": account,
                "balance_wei": str(balance),
                "chain_id": chain_id,
            }
        return {"connected": False}
    except Exception:
        return {"connected": False}


STATIC_DIR = Path(__file__).parent / "frontend-react" / "dist"

if STATIC_DIR.exists():
    from fastapi.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
