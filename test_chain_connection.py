"""Standalone connectivity test for the local Hardhat chain.

Prerequisites:
  - Hardhat node must already be running (npx hardhat node)
  - web3 must be installed (pip install web3)

Run:
  python test_chain_connection.py
"""

from chain.client import Web3Client

client = Web3Client()

if not client.is_connected():
    print("ERROR: Cannot connect to Hardhat node at http://localhost:8545")
    print("Start it first: npx hardhat node")
    raise SystemExit(1)

chain_id = client.get_chain_id()
account = client.get_default_account()
balance_wei = client.get_balance(account)
balance_eth = balance_wei / 10**18

print(f"Connected to chain ID: {chain_id}")
print(f"Default account:       {account}")
print(f"Balance:               {balance_eth:,.0f} ETH ({balance_wei} wei)")
