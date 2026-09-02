"""Web3 client for connecting to a local Hardhat dev chain."""

from web3 import Web3

# First Hardhat test account private key (for local dev only).
DEFAULT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


class Web3Client:
    """Thin wrapper around Web3 for a local Ethereum node.

    Parameters
    ----------
    rpc_url : str
        JSON-RPC endpoint (default ``http://localhost:8545``).
    """

    def __init__(self, rpc_url: str = "http://localhost:8545") -> None:
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

    def is_connected(self) -> bool:
        """Return True if the node is reachable."""
        return self.w3.is_connected()

    def get_default_account(self) -> str:
        """Return the address of the first Hardhat test account."""
        return self.w3.eth.accounts[0]

    def get_balance(self, address: str) -> int:
        """Return the balance of *address* in wei."""
        return self.w3.eth.get_balance(Web3.to_checksum_address(address))

    def get_chain_id(self) -> int:
        """Return the chain ID of the connected network."""
        return self.w3.eth.chain_id

    def anchor_fingerprint(self, fingerprint_hex: str) -> dict:
        """Anchor a fingerprint hash on-chain via a raw transaction.

        Sends a zero-value transaction from the default account to itself,
        embedding the fingerprint hex string in the ``data`` field.

        Parameters
        ----------
        fingerprint_hex : str
            A 64-character hex string (e.g. SHA-256 digest).

        Returns
        -------
        dict
            ``{"tx_hash", "block_number", "from", "data"}``.
        """
        account = self.get_default_account()
        account_addr = Web3.to_checksum_address(account)

        data_hex = "0x" + fingerprint_hex

        tx = {
            "from": account_addr,
            "to": account_addr,
            "value": 0,
            "gas": self.w3.eth.estimate_gas({
                "from": account_addr,
                "to": account_addr,
                "value": 0,
                "data": bytes.fromhex(fingerprint_hex),
            }) + 10000,
            "gasPrice": self.w3.eth.gas_price,
            "nonce": self.w3.eth.get_transaction_count(account_addr),
            "data": bytes.fromhex(fingerprint_hex),
            "chainId": self.w3.eth.chain_id,
        }

        signed = self.w3.eth.account.sign_transaction(tx, private_key=DEFAULT_PRIVATE_KEY)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "tx_hash": receipt["transactionHash"].hex(),
            "block_number": receipt["blockNumber"],
            "from": account_addr,
            "data": data_hex,
        }
