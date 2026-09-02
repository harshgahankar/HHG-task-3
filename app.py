"""Streamlit entrypoint for Face Reverse Search."""

import tempfile
from pathlib import Path

import json

import cv2
import numpy as np
import streamlit as st
from face.detector import FaceDetector
from records.canonical import build_canonical_record
from records.fingerprint import generate_fingerprint
from search.lens_search import reverse_image_search, parse_lens_results, SerpApiError

st.set_page_config(page_title="Face Reverse Search", page_icon="🔍")
st.title("Face Reverse Search")

detector = FaceDetector()

uploaded = st.file_uploader("Upload a photo", type=["jpg", "jpeg", "png"])

if uploaded is not None:
    file_bytes = np.asarray(bytearray(uploaded.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        st.error("Could not decode image.")
        st.stop()

    faces = detector.detect(img)

    if len(faces) == 0:
        st.error("No face detected.")
        st.stop()

    if len(faces) > 1:
        areas = [(f["bbox"][2] - f["bbox"][0]) * (f["bbox"][3] - f["bbox"][1]) for f in faces]
        idx = int(np.argmax(areas))
        st.warning(f"Multiple faces detected -- using the largest one ({len(faces)} faces found).")
    else:
        idx = 0

    selected = faces[idx]
    x1, y1, x2, y2 = [int(v) for v in selected["bbox"]]
    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)

    st.image(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), caption="Detected face")

    confidence = selected["det_score"] * 100
    st.write(f"**Confidence:** {confidence:.1f}%")

    st.session_state["embedding"] = selected["embedding"]
    st.success("Embedding stored for next step.")

    st.divider()

    if st.button("Search for this image"):
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            cv2.imwrite(tmp.name, img)
            tmp_path = tmp.name

        try:
            with st.spinner("Searching Google Lens..."):
                raw = reverse_image_search(tmp_path)
        except (SerpApiError, FileNotFoundError) as e:
            st.error(f"Search failed: {e}")
            st.stop()
        finally:
            Path(tmp_path).unlink(missing_ok=True)

        results = parse_lens_results(raw)
        st.session_state["results"] = results

        if not results:
            st.info(
                "No visual matches found for this image.\n\n"
                "**Note:** The SerpApi Free Plan only provides AI Overview data, "
                "not visual/exact matches. Upgrade to a paid plan for full results."
            )
        else:
            top = results[0]
            st.subheader("Top Result")
            cols = st.columns([1, 2])
            with cols[0]:
                if top["thumbnail"]:
                    st.image(top["thumbnail"])
            with cols[1]:
                st.write(f"**{top['title']}**")
                st.write(f"Source: {top['source']}")
                st.write(f"[Open link]({top['link']})")

            if len(results) > 1:
                with st.expander(f"Show {len(results) - 1} more results"):
                    for r in results[1:]:
                        st.markdown(f"**{r['title']}** -- {r['source']}")
                        st.markdown(f"[{r['link']}]({r['link']})")
                        st.write("---")

            st.divider()
            st.subheader("Select Matching Post")

            labels = [f"{r['title']} -- {r['source']}" for r in results]
            selected_idx = st.radio(
                "Which result matches your image?",
                range(len(results)),
                format_func=lambda i: labels[i],
                index=0,
            )

            canonical = build_canonical_record(results[selected_idx])
            fingerprint = generate_fingerprint(canonical)

            st.session_state["canonical"] = canonical
            st.session_state["fingerprint"] = fingerprint

            st.markdown("**Canonical Record**")
            st.code(json.dumps(canonical, indent=2), language="json")

            st.markdown("**Fingerprint (SHA-256)**")
            st.code(fingerprint)

            st.divider()
            st.subheader("Anchor to Blockchain")

            if st.button("Anchor to blockchain"):
                from chain.client import Web3Client

                try:
                    client = Web3Client()
                    if not client.is_connected():
                        st.error(
                            "Local chain not running. "
                            "Start it with `npx hardhat node` in the project directory."
                        )
                        st.stop()

                    with st.spinner("Anchoring fingerprint to chain..."):
                        tx = client.anchor_fingerprint(fingerprint)

                    st.session_state["tx_hash"] = tx["tx_hash"]
                    st.session_state["block_number"] = tx["block_number"]

                    st.success("Fingerprint anchored on-chain!")

                    st.markdown(
                        f"""
                        <div style="background:#1e1e1e;padding:16px;border-radius:8px;
                                    border:1px solid #4CAF50;font-family:monospace;">
                            <div style="color:#4CAF50;font-weight:bold;margin-bottom:8px;">
                                Transaction Confirmed
                            </div>
                            <div style="color:#ccc;">
                                <strong>TX Hash:</strong> {tx['tx_hash']}<br>
                                <strong>Block:</strong> {tx['block_number']}<br>
                                <strong>From:</strong> {tx['from']}
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                    with st.expander("How to verify independently"):
                        st.markdown(f"""
                        Check the Hardhat node terminal output, or run:
                        ```bash
                        python -c "from chain.client import Web3Client; c=Web3Client(); tx=c.w3.eth.get_transaction('{tx['tx_hash']}'); print('Data:', tx['input'].hex())"
                        ```
                        """)

                except Exception as e:
                    st.error(f"Blockchain anchor failed: {e}")
