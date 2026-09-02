"""Standalone test for anchoring a fingerprint on the local Hardhat chain.

Prerequisites:
  - Hardhat node running (npx hardhat node)
  - web3 installed (pip install web3)

Run:
  python test_anchor_fingerprint.py
"""

from records.canonical import build_canonical_record
from records.fingerprint import generate_fingerprint
from chain.client import Web3Client

sample_result = {
    "source": "Wikipedia",
    "link": "https://en.wikipedia.org/wiki/Test",
    "title": "Test Page",
    "thumbnail": "https://example.com/thumb.jpg",
}

canonical = build_canonical_record(sample_result)
fingerprint = generate_fingerprint(canonical)

print(f"Fingerprint: {fingerprint}")
print()

client = Web3Client()

if not client.is_connected():
    print("ERROR: Cannot connect to Hardhat node at http://localhost:8545")
    raise SystemExit(1)

tx = client.anchor_fingerprint(fingerprint)

print(f"tx_hash:     {tx['tx_hash']}")
print(f"block_number: {tx['block_number']}")
print(f"from:        {tx['from']}")
print(f"data:        {tx['data']}")
