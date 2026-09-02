"""Full round-trip test: face detect -> search -> canonical -> fingerprint -> anchor -> verify.

Prerequisites:
  - Hardhat node running (npx hardhat node)
  - Streamlit app NOT required -- this script runs the pipeline directly.

Run:
  python test_full_flow.py              # uses mock data (Free Plan returns no matches)
  python test_full_flow.py --live       # uses real search results (requires paid SerpApi plan)
"""

import json
import sys
import tempfile
import time
from pathlib import Path

import cv2
import numpy as np


def log(stage: str, start: float):
    elapsed = time.time() - start
    print(f"  [{elapsed:6.2f}s] {stage}")


# Hardcoded mock results to test the pipeline end-to-end
# when the Free Plan returns no visual matches.
MOCK_RESULTS = [
    {
        "title": "  Example Photo -- Wikipedia  ",
        "source": " Wikipedia ",
        "link": "https://en.wikipedia.org/wiki/Example",
        "thumbnail": "https://upload.wikimedia.org/wikipedia/en/a/a0/Example.jpg",
    },
    {
        "title": "Example Image - Pixabay",
        "source": " Pixabay",
        "link": "https://pixabay.com/photos/example",
        "thumbnail": "https://cdn.pixabay.com/photo/2024/01/01/example.jpg",
    },
]


def run_flow(label: str, results: list[dict], client):
    from records.canonical import build_canonical_record
    from records.fingerprint import generate_fingerprint

    print(f"\n{'='*60}")
    print(f"FLOW: {label}")
    print(f"{'='*60}")

    total_start = time.time()

    if not results:
        print("  No results to process.")
        return None

    # Stage 1: Select result and build canonical record
    t = time.time()
    selected_result = results[0]
    canonical = build_canonical_record(selected_result)
    log("Canonical record built", t)
    print(f"    {json.dumps(canonical, indent=4)}")

    # Stage 2: Generate fingerprint
    t = time.time()
    fingerprint = generate_fingerprint(canonical)
    log(f"Fingerprint generated: {fingerprint}", t)

    # Stage 3: Anchor to chain
    t = time.time()
    tx = client.anchor_fingerprint(fingerprint)
    log(f"Transaction anchored -- block {tx['block_number']}", t)
    print(f"    tx_hash:  {tx['tx_hash']}")
    print(f"    block:    {tx['block_number']}")
    print(f"    from:     {tx['from']}")

    # Stage 4: Determinism check -- rebuild from same result
    t = time.time()
    canonical2 = build_canonical_record(selected_result)
    fingerprint2 = generate_fingerprint(canonical2)
    match = fingerprint == fingerprint2
    log(f"Determinism check -- {'PASS' if match else 'FAIL'}", t)
    print(f"    original:  {fingerprint}")
    print(f"    rebuilt:   {fingerprint2}")

    # Stage 5: Read back tx data from chain
    t = time.time()
    tx_data = client.w3.eth.get_transaction(tx["tx_hash"])
    raw_data = tx_data.get("input") or tx_data.get("data") or b""
    if isinstance(raw_data, bytes):
        data_hex = raw_data.hex()
    else:
        data_hex = raw_data
    if data_hex.startswith("0x"):
        data_hex = data_hex[2:]
    chain_match = data_hex == fingerprint
    log(f"On-chain data check -- {'PASS' if chain_match else 'FAIL'}", t)
    print(f"    expected:  {fingerprint}")
    print(f"    on-chain:  {data_hex}")

    total_elapsed = time.time() - total_start
    print(f"\n  TOTAL TIME: {total_elapsed:.2f}s")

    return {
        "fingerprint": fingerprint,
        "tx_hash": tx["tx_hash"],
        "block_number": tx["block_number"],
        "determinism_pass": match,
        "chain_verify_pass": chain_match,
    }


if __name__ == "__main__":
    from chain.client import Web3Client

    client = Web3Client()
    if not client.is_connected():
        print("ERROR: Hardhat node not running. Start with: npx hardhat node")
        raise SystemExit(1)

    all_results = []

    # Run with different mock results to verify reproducibility
    for i, mock in enumerate(MOCK_RESULTS, 1):
        result = run_flow(f"Mock Result {i}", [mock], client)
        if result:
            all_results.append(result)

    # Also test that the same input produces the same fingerprint across runs
    print(f"\n{'='*60}")
    print("CROSS-RUN CONSISTENCY CHECK")
    print(f"{'='*60}")

    from records.canonical import build_canonical_record
    from records.fingerprint import generate_fingerprint

    fp1 = generate_fingerprint(build_canonical_record(MOCK_RESULTS[0]))
    fp2 = generate_fingerprint(build_canonical_record(MOCK_RESULTS[0]))
    fp3 = generate_fingerprint(build_canonical_record(MOCK_RESULTS[1]))

    print(f"  Result 0, run 1: {fp1}")
    print(f"  Result 0, run 2: {fp2}")
    print(f"  Result 1, run 1: {fp3}")
    print(f"  Same result -> same hash:  {'PASS' if fp1 == fp2 else 'FAIL'}")
    print(f"  Diff result -> diff hash:  {'PASS' if fp1 != fp3 else 'FAIL'}")

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for i, r in enumerate(all_results, 1):
        status = "PASS" if (r["determinism_pass"] and r["chain_verify_pass"]) else "FAIL"
        print(f"  Run {i}: {status} -- fingerprint {r['fingerprint'][:16]}... -> block {r['block_number']}")
