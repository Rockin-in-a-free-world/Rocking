

You pay rent to occupy a Solana account.

- You can do that via tetherto's sdks.
	- account/s created with one call
	- seed phrase provided
		- once the call is over, the seed phrase copies only exist where you keep them
		- unless someone else copies them

- With the seed phrase, even if an account is culled, you can recreate it later, but:
	- it's a reset (all previous state, e.g. balances, lost)

- Accounts may be allowed to persist rent free: rent exempt
	- keep 0.001 SOL min for better chances to persistence 

- You can close an account:
	- drains an account to 0 (passes balance on)
	- deletes it from chain


