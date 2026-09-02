"""Streamlit entrypoint for Face Reverse Search."""

import tempfile
from pathlib import Path

import cv2
import numpy as np
import streamlit as st
from face.detector import FaceDetector
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
        st.warning(f"Multiple faces detected — using the largest one ({len(faces)} faces found).")
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

        if not results:
            st.info("No results found for this image.")
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
                        st.markdown(f"**{r['title']}** — {r['source']}")
                        st.markdown(f"[{r['link']}]({r['link']})")
                        st.write("---")
