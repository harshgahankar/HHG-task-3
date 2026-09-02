# Face Reverse Search

A Streamlit app that detects faces in uploaded photos and searches Google Lens for matching results, with on-chain fingerprinting.

## Setup

### Prerequisites

- Python 3.12+
- Node.js (for local Ethereum dev chain)

### Start Local Chain

```bash
npx hardhat node
```

This runs a local Ethereum node on `http://localhost:8545` with 20 deterministic test accounts (pre-funded with 10,000 ETH each).

### Install Dependencies

```bash
pip install -r requirements.txt
npm install
```

### Configure Environment

Copy `.env.example` to `.env` and add your SerpApi key:

```
SERPAPI_KEY=your_key_here
```

### Run the App

```bash
streamlit run app.py
```

## Architecture

- `app.py` — Streamlit UI: upload → detect → search → select → fingerprint
- `face/detector.py` — Face detection via insightface
- `search/lens_search.py` — Google Lens reverse image search via SerpApi
- `records/canonical.py` — Stable canonical record builder
- `records/fingerprint.py` — SHA-256 fingerprint generator
- `chain/client.py` — Web3 client for local Ethereum chain
- `hardhat.config.js` — Hardhat configuration
