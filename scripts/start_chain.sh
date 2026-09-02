#!/usr/bin/env bash
# Start a local Hardhat dev chain for testing.

set -e

echo "Starting Hardhat node on http://localhost:8545 ..."
echo "Press Ctrl+C to stop."
echo ""

npx hardhat node
