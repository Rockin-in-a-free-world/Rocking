Every Solana transaction includes:

`feePayer: <public key>` and this account must be able to cover the gas fee in SOL

The fee payer doesn't need to be the transaction signer	



Therefore, to test a fee payer scenario you need:
✔ Account A (fee payer)

Holds SOL and signs as fee payer.

✔ Account B (authority)

Signs the instruction requiring authorization.

✔ A workflow that:

Constructs the transaction

Inserts a fresh blockhash

Sends it to both signers (or signs locally)

Submits the fully signed transaction to the cluster

All within ~1 minute

---------------

🔥 BUT — If you want to avoid rushing: use a 

### Durable nonce

If your goal is:

multi-party signing

long signing windows

signing transactions hours or days apart

collecting signatures gradually

offline signing workflows

Then you need a Durable Nonce Account.

With a durable nonce:

You replace the recent blockhash with a special value stored in a nonce account

That value does NOT expire automatically

All signatures can be collected whenever you want

Only the final “nonce advance” step consumes the nonce and executes the tx

The fee payer still must sign the final transaction — but you can pre-sign all other signatures ahead of time

This is how:

multisigs,

batched approvals,

sponsored transactions,

treasury approvals
are done in production.

### Rent exempt

Deposit at least 2 years' worth of rent upfront
- No ongoing rent deductions
- Account stays active indefinitely (as long as it has balance)
- Minimum: ~0.001 SOL for a basic account