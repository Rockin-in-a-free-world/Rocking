mental model: Read Write onchain

✔ Reads:

eth_call via a read/write gateway (JSON-RPC API)

Never signed

Never recorded

Zero gas

Off-chain

Instant

✔ Transactions:

Signed

Broadcast

Confirmed

Always recorded

EVM: Always modify state 

	(EVM at minimum: nonce, a counter, increments)
	EVM prevents replay attemps with strict counter on the signer's activity
	
SOLANA:

	(Solana's counter mechanism:
			- tx much include lively blockhash (upto 150 blocks old) [or alt](solana-gas.md#durable-nonce)
			- BUT remember, there is no ordering of transactions either, older tx can arrive ahead of recent tx)
	A replay attempt on Solana within the block-building window (the ~1 minute / ~150 block window) will be rejected by validators because they maintain a cache of recently processed transaction signatures. Any replay that uses the same signed message and a still-valid blockhash is dropped as a duplicate. If the blockhash is older than the window, the transaction is rejected because the blockhash is no longer valid.