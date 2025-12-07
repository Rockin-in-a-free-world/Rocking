# What are Solana account locks?

When a transaction is being executed, Solana’s runtime locks the accounts it touches:

- Writable account that executes transactions → EXCLUSIVE lock: Only one in-flight transaction may write to that account.

- Read-only accounts → SHARED lock: Many transactions can read the same account simultaneously.

These locks last only during execution (milliseconds), NOT for the entire block or epoch.

Once the transaction completes, all locks are released.

## Write account locks: send a transaction

✅ When Alice sends SOL to Bob

A native SOL transfer touches only two writable accounts:

Alice (sender) — writable

Bob (recipient) — writable

So both Alice and Bob will receive exclusive locks during that short execution window.

✔ Lock effects:

No other in-flight transaction can write to Alice

No other in-flight transaction can write to Bob

Other transactions can still read their accounts

Other transactions can still write other unrelated accounts

✔ Lock duration:

Only while the validator executes the tx

Typically under 1 millisecond on a healthy cluster

## Fee payers and transactions

🔥 Does the account lock impact the fee payer?

The fee payer account is always:

Writable

Deducted SOL (fee)

Locked during execution

So:

If Alice is also the fee payer → Alice gets two reasons to be locked

If Bob is the fee payer → Bob gets locked

If a third party (Carol) is the fee payer → Carol gets locked

A relayer acting as fee payer also gets locked for the duration

Locking rules apply independently for each writable account in the transaction.


## One at a time please folks

🔍 What happens if two simultaneous transactions try to use Alice or Bob?

Scenario A: Two txs both need to write to Alice

Transaction 1 gets lock → executes

Transaction 2 arrives → fails with AccountInUse

Second transaction can be retried after the first completes
(clients usually automatically resubmit)

Scenario B: Two txs both write Bob

Same as above.

Scenario C: One tx writes Alice & Bob; another writes Carol

Both can run in parallel → no conflict.

Scenario D: One tx writes Alice; another only reads Alice

Reads conflict only with other writes, not with each other.

So:

Operation on Account	Allows Parallel?
Write + Write	❌ No (exclusive)
Write + Read	❌ No (write is exclusive)
Read + Read	✔ Yes


#### How this affects multi-party signing scenarios

Suppose Alice signs a tx sending SOL to Bob, and Bob signs something else at the same time.

Example:
Alice → sends SOL to Bob
Bob → sends tokens to Alice

Their transactions may conflict if:

Both transactions try to write Bob's account at the same time

Or write Alice's account at the same time

Result:

One will fail with AccountInUse

The client must retry with a new blockhash

This is happens often in high-throughput Solana systems.

## Summary 

When Alice sends Bob SOL, both Alice’s account and Bob’s account are locked exclusively during execution. This prevents any other transaction from writing to either account at the same time. If there is a fee payer account it is also locked exclusively. Locks last only for the duration of execution (milliseconds), and are released immediately after. Lock failures cause transactions to error with AccountInUse and must be retried.

### 📌 Locks are not replay protection

They only prevent simultaneous writes. They do not affect a replay attempt arriving later.

[Replay prevention](transactions-on-chain.md) is handled by blockhash expiry + duplicate signature cache held by validators.